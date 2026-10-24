import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { signRenderToken, verifyRenderToken } from "../src/lib/pdf/token";
import { saveItineraryData } from "../src/lib/db/itineraries";
import { Itinerary } from "../src/lib/schema/itinerary";
import { computeClientView } from "../src/lib/schema/client-view";

const mockKashmir7Day: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Kashmir Paradise & Meadows Tour",
    destinations: ["Srinagar", "Gulmarg", "Pahalgam"],
    nights: 6,
    days: 7,
    startDate: "2026-12-10",
    travellers: { adults: 2, children: 0, rooms: 1 },
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Srinagar & Dal Lake Shikara",
      description: "Meet driver at Srinagar airport and transfer to deluxe houseboat on Dal Lake. Enjoy afternoon Shikara ride.",
      activities: ["Airport transfer", "Shikara ride"],
      meals: ["Dinner"],
      stay: { hotel: "Deluxe Houseboat", city: "Srinagar", roomType: "Deluxe Suite" },
      imageQuery: "Dal lake shikara srinagar",
      image: {
        provider: "unsplash",
        photoId: "m-dal-1",
        imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=800&auto=format&fit=crop&q=80",
        thumbnailUrl: null,
        photographerName: "Imad Clicks",
        photographerUrl: "https://unsplash.com/@imadclicks",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 2,
      title: "Srinagar to Sonamarg Excursion",
      description: "Day excursion to Sonamarg Meadow of Gold. Enjoy Thajiwas Glacier pony ride.",
      activities: ["Glacier view", "Pony ride"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Grand Boulevard", city: "Srinagar", roomType: null },
      imageQuery: "Sonamarg glacier kashmir",
      image: null,
    },
    {
      dayNumber: 3,
      title: "Srinagar to Gulmarg",
      description: "Proceed to Gulmarg Meadow of Flowers. Board Gulmarg Gondola Phase 1 & 2.",
      activities: ["Gulmarg Gondola", "Snow walk"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Pine Spring Gulmarg", city: "Gulmarg", roomType: null },
      imageQuery: "Gulmarg snow mountains",
      image: null,
    },
    {
      dayNumber: 4,
      title: "Gulmarg to Pahalgam",
      description: "Drive to Pahalgam via Pampore saffron fields. Check into riverside resort.",
      activities: ["Saffron fields", "Lidder river stroll"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Heevan Pahalgam", city: "Pahalgam", roomType: null },
      imageQuery: "Pahalgam lidder river valley",
      image: null,
    },
    {
      dayNumber: 5,
      title: "Pahalgam Valley Exploration",
      description: "Visit Betaab Valley, Aru Valley, and Chandanwari by local union cab.",
      activities: ["Betaab valley", "Aru valley"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Heevan Pahalgam", city: "Pahalgam", roomType: null },
      imageQuery: "Betaab valley pine trees",
      image: null,
    },
    {
      dayNumber: 6,
      title: "Pahalgam to Srinagar & Mughal Gardens",
      description: "Return to Srinagar. Visit Mughal Gardens: Nishat Bagh and Shalimar Bagh.",
      activities: ["Nishat Bagh", "Shalimar Bagh"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Grand Boulevard", city: "Srinagar", roomType: null },
      imageQuery: "Mughal gardens srinagar fountains",
      image: null,
    },
    {
      dayNumber: 7,
      title: "Departure from Srinagar Airport",
      description: "Breakfast at hotel and private transfer to Srinagar airport for flight home.",
      activities: ["Airport drop"],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: "Srinagar airport departure",
      image: null,
    },
  ],
  inclusions: [
    "6 Nights accommodation in premium deluxe hotels",
    "Daily Breakfast & Dinner (MAPAI plan)",
    "Private Innova Crysta for all transfers and sightseeing",
    "1-hour complimentary Shikara ride on Dal Lake",
    "All toll taxes, parking, and driver night allowances",
  ],
  exclusions: [
    "Airfare / Train fare",
    "Gulmarg Gondola tickets Phase 1 & 2",
    "Union taxi in Pahalgam (direct pay)",
    "Personal expenses and laundry",
  ],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 5200000, // 52,000 INR
    markup: { type: "percent", value: 15 }, // 15% -> 59,800 INR
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 7,
  },
  terms: {
    payment: ["25% advance to confirm booking", "Balance 15 days before departure"],
    cancellation: [
      { window: "> 30 days prior", charge: "10% service fee" },
      { window: "15 to 30 days prior", charge: "50% package cost" },
      { window: "< 15 days prior", charge: "100% non-refundable" },
    ],
  },
  meta: {
    sourceFile: "sample-itineraries/01_kashmir_6n7d_paradise_supplier.txt",
    extractedBy: "claude-sonnet-4-5",
    reviewFlags: [],
    extractedSnapshot: null,
  },
  variants: [],
  salesperson: {
    name: "Rahul Sharma",
    phone: "+91 98765 12345",
    email: "rahul@trippygo.com",
  },
};

async function testPdfRender() {
  console.log("=== RUNNING PHASE 5 PDF TEMPLATE & PLAYWRIGHT TEST ===");

  // 1. HMAC Token Signing & Verification Test
  console.log("\n[Test 1] Testing HMAC token security...");
  const testId = "test-itinerary-123";
  const token = signRenderToken(testId, 60);
  const isValid = verifyRenderToken(testId, token);
  const isInvalidWrongId = verifyRenderToken("wrong-id", token);
  const isInvalidEmpty = verifyRenderToken(testId, "");

  if (!isValid || isInvalidWrongId || isInvalidEmpty) {
    console.error("FAIL: HMAC token validation failed", { isValid, isInvalidWrongId, isInvalidEmpty });
    process.exit(1);
  }
  console.log("PASS: HMAC render token signed and verified successfully. Token:", token.slice(0, 24) + "...");

  // 2. Save Itinerary to Store
  console.log("\n[Test 2] Saving mock itinerary to store...");
  await saveItineraryData(testId, mockKashmir7Day);
  console.log("PASS: Itinerary saved successfully.");

  // 3. Playwright Headless Chromium Render Test
  console.log("\n[Test 3] Launching Playwright Chromium to render A4 PDF...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1600 });

  // Generate HTML directly from client view template
  const clientView = computeClientView(mockKashmir7Day);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${clientView.package.title} - TrippyGo Itinerary</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; background: #fff; color: #1e293b; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; margin-bottom: 20px; }
    .header-banner { background: linear-gradient(135deg, #1556a6, #c92229); color: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; }
    .day-card { border-left: 3px solid #1556a6; padding-left: 20px; margin-bottom: 20px; }
    .price-box { background: #1e293b; color: white; padding: 25px; border-radius: 8px; margin-bottom: 25px; }
    .table-box { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table-box th, .table-box td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    .table-box th { background: #f8fafc; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header-banner avoid-break">
    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Official Travel Itinerary</div>
    <h1 style="margin: 8px 0; font-size: 28px;">${clientView.package.title}</h1>
    <div style="font-size: 14px; opacity: 0.95;">📍 ${clientView.package.destinations.join(" • ")} | ${clientView.package.nights}N / ${clientView.package.days}D</div>
  </div>

  <div class="avoid-break">
    <h2 style="font-size: 18px; border-bottom: 2px solid #c92229; padding-bottom: 6px; margin-bottom: 16px;">Day-by-Day Experience</h2>
    ${clientView.days
      .map(
        (d) => `
      <div class="day-card avoid-break">
        <h3 style="margin: 0 0 6px 0; font-size: 15px;">Day ${d.dayNumber}: ${d.title}</h3>
        ${d.fullDateLabel ? `<div style="font-size: 11px; color: #c92229; font-weight: 600; margin-bottom: 4px;">📅 ${d.fullDateLabel}</div>` : ""}
        <p style="margin: 4px 0 8px 0; font-size: 13px; line-height: 1.5; color: #475569;">${d.description}</p>
        <div style="font-size: 11px; color: #1556a6;">🏨 Stay: <strong>${d.stay?.hotel || "Hotel"}</strong> | 🍽️ Meals: ${d.meals.join(", ")}</div>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="avoid-break" style="display: flex; gap: 20px;">
    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #047857; font-size: 14px;">✓ Inclusions</h3>
      <ul style="font-size: 12px; color: #475569; padding-left: 18px; margin: 0;">
        ${clientView.inclusions.map((inc) => `<li>${inc}</li>`).join("")}
      </ul>
    </div>
    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #b91c1c; font-size: 14px;">✕ Exclusions</h3>
      <ul style="font-size: 12px; color: #475569; padding-left: 18px; margin: 0;">
        ${clientView.exclusions.map((exc) => `<li>${exc}</li>`).join("")}
      </ul>
    </div>
  </div>

  <div class="price-box avoid-break" style="margin-top: 20px;">
    <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8;">Total Package Investment</div>
    <div style="font-size: 32px; font-weight: bold; margin: 4px 0;">₹ ${clientView.pricing.finalPriceFormatted}</div>
    <div style="font-size: 12px; color: #cbd5e1;">Basis: ${clientView.pricing.basis} | GST: 5% Inclusive (SAC 998552)</div>
  </div>

  <div class="avoid-break" style="margin-top: 20px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
    <strong>TrippyGo Holidays</strong> | GSTIN: 27AABCT1234D1Z5 | Specialist: ${clientView.salesperson?.name || "Concierge"} (${clientView.salesperson?.phone})
  </div>
</body>
</html>`;

  await page.setContent(html, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });

  const pdfUint8 = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" },
    preferCSSPageSize: true,
  });

  await browser.close();

  const outputPdfPath = path.join(process.cwd(), ".uploads", "test-kashmir-7day.pdf");
  const uploadDir = path.dirname(outputPdfPath);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  fs.writeFileSync(outputPdfPath, Buffer.from(pdfUint8));

  const stats = fs.statSync(outputPdfPath);
  if (stats.size < 5000) {
    console.error("FAIL: Rendered PDF is suspiciously small:", stats.size);
    process.exit(1);
  }

  console.log(`PASS: Rendered A4 PDF successfully! File size: ${(stats.size / 1024).toFixed(1)} KB.`);
  console.log(`Saved output to: ${outputPdfPath}`);

  console.log("\n=== ALL PHASE 5 TESTS PASSED SUCCESSFULLY ===");
}

testPdfRender().catch((err) => {
  console.error("Error in testPdfRender:", err);
  process.exit(1);
});
