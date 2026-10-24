import { Itinerary, ReviewFlag } from "../schema/itinerary";

// Supplier Leak Patterns: phone numbers, emails, supplier terms
const PHONE_PATTERN = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b|\+91\s?\d{10})/g;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const SUPPLIER_LEAK_KEYWORDS = [
  /\b(dmc|pvt\s+ltd|private\s+limited|b2b\s+rate|net\s+to\s+agent|net\s+net|commissionable)\b/i,
  /\b(wholesaler|tour\s+operator|b2b\s+deal)\b/i,
];

/**
 * Scan text for supplier contact leaks and suspicious supplier markings
 */
function detectSupplierLeaks(text: string): string[] {
  const leaks: string[] = [];
  const phones = text.match(PHONE_PATTERN);
  if (phones) {
    leaks.push(`Possible phone number detected: ${phones.join(", ")}`);
  }

  const emails = text.match(EMAIL_PATTERN);
  if (emails) {
    leaks.push(`Possible supplier email detected: ${emails.join(", ")}`);
  }

  for (const kw of SUPPLIER_LEAK_KEYWORDS) {
    const match = text.match(kw);
    if (match) {
      leaks.push(`Supplier B2B keyword detected: "${match[0]}"`);
    }
  }

  return leaks;
}

/**
 * Run comprehensive post-extraction hygiene validation.
 * Converts any structural, logical, or leak issues into reviewFlags without throwing exceptions.
 */
export function validateAndEnrichExtraction(itinerary: Itinerary): Itinerary {
  const flags: ReviewFlag[] = [...(itinerary.meta.reviewFlags || [])];

  // 1. Day count vs nights rule (Days should equal Nights + 1)
  if (itinerary.package.days !== itinerary.package.nights + 1) {
    flags.push({
      field: "package.days",
      issue: `Day count (${itinerary.package.days}) is not equal to nights + 1 (${itinerary.package.nights + 1}). Verify arrival/departure timings.`,
      severity: "warning",
    });
  }

  // 2. Day count vs days array length
  if (itinerary.days.length !== itinerary.package.days) {
    flags.push({
      field: "days",
      issue: `Number of day items extracted (${itinerary.days.length}) does not match package days count (${itinerary.package.days}).`,
      severity: "error",
    });
  }

  // 3. Sequential day numbering check
  for (let i = 0; i < itinerary.days.length; i++) {
    const expected = i + 1;
    if (itinerary.days[i].dayNumber !== expected) {
      flags.push({
        field: `days.${i}.dayNumber`,
        issue: `Day sequence jump detected: expected Day ${expected}, found Day ${itinerary.days[i].dayNumber}.`,
        severity: "warning",
      });
    }
  }

  // 4. Net price validity
  if (!itinerary.pricing || itinerary.pricing.netAmountPaise <= 0) {
    flags.push({
      field: "pricing.netAmountPaise",
      issue: "Supplier net price was not detected or is 0 paise. Please manually enter supplier net rate.",
      severity: "error",
    });
  }

  // 5. Inclusions / Exclusions non-empty check
  if (!itinerary.inclusions || itinerary.inclusions.length === 0) {
    flags.push({
      field: "inclusions",
      issue: "No package inclusions were found in the supplier quote. Review supplier document.",
      severity: "warning",
    });
  }

  if (!itinerary.exclusions || itinerary.exclusions.length === 0) {
    flags.push({
      field: "exclusions",
      issue: "No exclusions detected. Common exclusions (airfare, personal expenses) should be confirmed.",
      severity: "info",
    });
  }

  // 6. Terms / Cancellation check
  if (!itinerary.terms.cancellation || itinerary.terms.cancellation.length === 0) {
    flags.push({
      field: "terms.cancellation",
      issue: "No cancellation policy table detected. Default agency cancellation terms will be applied.",
      severity: "warning",
    });
  }

  // 7. Supplier Leak Scans across all user-visible text fields
  // Check package title
  for (const leak of detectSupplierLeaks(itinerary.package.title)) {
    flags.push({ field: "package.title", issue: leak, severity: "warning" });
  }

  // Check each day title and description
  itinerary.days.forEach((day, idx) => {
    for (const leak of detectSupplierLeaks(day.title)) {
      flags.push({ field: `days.${idx}.title`, issue: leak, severity: "warning" });
    }
    for (const leak of detectSupplierLeaks(day.description)) {
      flags.push({ field: `days.${idx}.description`, issue: leak, severity: "warning" });
    }
    if (day.stay?.hotel) {
      for (const leak of detectSupplierLeaks(day.stay.hotel)) {
        flags.push({ field: `days.${idx}.stay.hotel`, issue: leak, severity: "warning" });
      }
    }
  });

  // Check inclusions and exclusions
  itinerary.inclusions.forEach((inc, idx) => {
    for (const leak of detectSupplierLeaks(inc)) {
      flags.push({ field: `inclusions.${idx}`, issue: leak, severity: "warning" });
    }
  });

  return {
    ...itinerary,
    meta: {
      ...itinerary.meta,
      reviewFlags: flags,
    },
  };
}
