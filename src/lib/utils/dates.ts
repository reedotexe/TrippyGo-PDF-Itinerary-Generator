/**
 * Timezone-aware date calculations and calendar utilities.
 * All operations anchored to 'Asia/Kolkata' timezone to eliminate UTC drift.
 */

export interface ComputedDayDate {
  dayNumber: number;
  calendarDate: string | null; // e.g. "30 Dec 2026"
  weekday: string | null;      // e.g. "Wednesday"
  fullDateLabel: string | null; // e.g. "30 Dec 2026, Wednesday"
  isoDate: string | null;      // e.g. "2026-12-30"
}

export interface TripDatesResult {
  startDateFormatted: string | null;
  endDateFormatted: string | null;
  validUntilFormatted: string;
  days: ComputedDayDate[];
}

/**
 * Computes "today" in the 'Asia/Kolkata' timezone (IST, UTC+05:30).
 * Guarantees correct date transitions regardless of the host server's local timezone.
 */
export function getKolkataToday(): { iso: string; year: number; month: number; day: number; date: Date } {
  // 'en-CA' outputs ISO formatted YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const iso = formatter.format(new Date()); // e.g. "2026-10-24"
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0); // Anchored at midday

  return { iso, year, month, day, date };
}

/**
 * Safely parse a YYYY-MM-DD string into a midday Date object to prevent UTC midnight date shifting.
 */
export function parseDateSafe(dateStr: string | null | undefined): Date | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return null;

  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Set hour to 12:00:00 to prevent edge-of-day timezone boundary shifts
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a Date object to "DD Mon YYYY" (e.g. "10 Dec 2026")
 */
export function formatDateEnGb(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a Date object to full weekday name (e.g. "Thursday")
 */
export function formatWeekday(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

/**
 * Master Trip Date Computation:
 * - Computes calendar dates for each day in the sequence
 * - Accurately transitions across month and year boundaries (e.g. 30 Dec -> 31 Dec -> 1 Jan)
 * - Correctly accounts for leap years (28 Feb -> 29 Feb in leap year, 28 Feb -> 1 Mar in common year)
 * - Computes trip end date based on package nights or total days
 * - Computes quote validity expiry date anchored to Asia/Kolkata
 */
export function computeTripDates(options: {
  startDate: string | null;
  daysCount: number;
  nights?: number;
  validityDays?: number;
}): TripDatesResult {
  const { startDate, daysCount, nights, validityDays = 7 } = options;
  const kolkataToday = getKolkataToday();

  // 1. Compute Quote Validity Expiry Date
  const validityAnchor = parseDateSafe(startDate) || kolkataToday.date;
  const expiryDate = new Date(validityAnchor);
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  const validUntilFormatted = formatDateEnGb(expiryDate);

  // 2. Parse Trip Start Date
  const tripStart = parseDateSafe(startDate);

  if (!tripStart || daysCount <= 0) {
    // Flexible dates / no start date specified
    const placeholderDays: ComputedDayDate[] = Array.from({ length: Math.max(1, daysCount) }, (_, i) => ({
      dayNumber: i + 1,
      calendarDate: null,
      weekday: null,
      fullDateLabel: null,
      isoDate: null,
    }));

    return {
      startDateFormatted: null,
      endDateFormatted: null,
      validUntilFormatted,
      days: placeholderDays,
    };
  }

  // 3. Compute Sequential Dates for Each Day
  const computedDays: ComputedDayDate[] = [];
  for (let i = 0; i < daysCount; i++) {
    const cur = new Date(tripStart);
    cur.setDate(tripStart.getDate() + i);

    const calendarDate = formatDateEnGb(cur);
    const weekday = formatWeekday(cur);
    const fullDateLabel = `${calendarDate}, ${weekday}`;

    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const isoDate = `${y}-${m}-${d}`;

    computedDays.push({
      dayNumber: i + 1,
      calendarDate,
      weekday,
      fullDateLabel,
      isoDate,
    });
  }

  // 4. Compute Trip End Date
  // If nights specified: endDate = startDate + nights
  // Otherwise default to last day: startDate + (daysCount - 1)
  const tripDurationNights = nights !== undefined && nights >= 0 ? nights : Math.max(0, daysCount - 1);
  const end = new Date(tripStart);
  end.setDate(tripStart.getDate() + tripDurationNights);
  const endDateFormatted = formatDateEnGb(end);
  const startDateFormatted = computedDays[0].calendarDate;

  return {
    startDateFormatted,
    endDateFormatted,
    validUntilFormatted,
    days: computedDays,
  };
}
