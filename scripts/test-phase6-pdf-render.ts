import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";
import ItineraryTemplate from "../src/templates/itinerary/ItineraryTemplate";
import { computeClientView } from "../src/lib/schema/client-view";
import { Itinerary } from "../src/lib/schema/itinerary";

console.log("=== PHASE 6: PLAYWRIGHT PRINT EMULATION & VISUAL AUDIT ===\n");

// 1. Build a realistic 7-Day luxury proposal
const luxuryItineraryMock: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Enchanting Kashmir & Valley of Lakes",
    destinations: ["Srinagar", "Gulmarg", "Pahalgam"],
    nights: 6,
    days: 7,
    startDate: "2026-11-15",
    travellers: { adults: 2, children: 0, rooms: 1 },
    guestName: "DR. ARUN & PRIYA SHARMA",
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Srinagar & Dal Lake Shikara Sunset",
      description:
        "Arrive at Sheikh ul-Alam International Airport where your private chauffeur awaits. Escorted transfer to your heritage luxury houseboat. As golden hour settles over the Pir Panjal range, embark on a private Shikara voyage through the floating gardens and lotus channels of Dal Lake.",
      activities: ["VIP Airport Welcome", "Private Sunset Shikara Cruise", "Houseboat Welcome Dinner"],
      meals: ["Dinner Included"],
      stay: { hotel: "Mascot Heritage Luxury Houseboat", city: "Srinagar", roomType: "Royal Lakeview Suite" },
      imageQuery: "Srinagar shikara dal lake",
      image: {
        provider: "unsplash",
        photoId: "kashmir-1",
        imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&auto=format&fit=crop&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400&auto=format&fit=crop&q=80",
        photographerName: "Imad Clicks",
        photographerUrl: "https://unsplash.com/@imadclicks",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 2,
      title: "Mughal Gardens of Srinagar & Old City Heritage Walk",
      description:
        "Morning architectural walkthrough of Nishat Bagh (Garden of Bliss) and Shalimar Bagh, masterworks of Persian terraced water architecture. Afternoon private guided trail through the artisan alleyways of Old Srinagar, meeting generational pashmina weavers and woodcarvers.",
      activities: ["Nishat Bagh Tour", "Shalimar Pavilion Walk", "Pashmina Artisan Studio"],
      meals: ["Breakfast Included", "Wazwan Tasting Lunch"],
      stay: { hotel: "Mascot Heritage Luxury Houseboat", city: "Srinagar", roomType: "Royal Lakeview Suite" },
      imageQuery: "Mughal gardens srinagar",
      image: null,
    },
    {
      dayNumber: 3,
      title: "Ascent to Gulmarg & Affarwat Peak Gondola",
      description:
        "Scenic mountain drive ascending into the high-altitude fir forests of Gulmarg. Board the world-renowned Gulmarg Gondola Phase 2 to 13,780 feet for panoramic vistas of K2 and Nanga Parbat. Evening fireside dinner at The Khyber.",
      activities: ["Scenic Valley Drive", "Gondola Phase II Ride", "Alpine Pine Trail"],
      meals: ["Breakfast Included", "Dinner Included"],
      stay: { hotel: "The Khyber Himalayan Resort & Spa", city: "Gulmarg", roomType: "Premier Valley View Room" },
      imageQuery: "Gulmarg snow mountains",
      image: {
        provider: "unsplash",
        photoId: "gulmarg-1",
        imageUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&auto=format&fit=crop&q=80",
        photographerName: "Farhan Khan",
        photographerUrl: "https://unsplash.com/@farhankhan",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 4,
      title: "Alpine Meadows & Countryside Leisure in Gulmarg",
      description:
        "Morning at leisure enjoying The Khyber's temperature-controlled swimming pool overlooking the snow peaks. Afternoon horseback riding across the pristine strawberry valley or snow activities at Kongdoori.",
      activities: ["Heated Infinity Pool", "Strawberry Valley Excursion", "Spa Treatment"],
      meals: ["Breakfast Included"],
      stay: { hotel: "The Khyber Himalayan Resort & Spa", city: "Gulmarg", roomType: "Premier Valley View Room" },
      imageQuery: "Gulmarg meadows",
      image: null,
    },
    {
      dayNumber: 5,
      title: "Pahalgam Valley of Shepherds & Lidder Riverbank",
      description:
        "Descend toward the saffron fields of Pampore before following the turquoise glacial rapids of the Lidder River into Pahalgam. Check into your boutique mountain chalet with private riverbank gardens.",
      activities: ["Saffron Field Stopover", "Lidder River Trail", "Private Chalet Check-in"],
      meals: ["Breakfast Included", "Riverside High Tea", "Dinner Included"],
      stay: { hotel: "Pahalgam Hotel & River Chalets", city: "Pahalgam", roomType: "Luxury Riverside Cottage" },
      imageQuery: "Pahalgam river lidder",
      image: {
        provider: "unsplash",
        photoId: "pahalgam-1",
        imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&auto=format&fit=crop&q=80",
        photographerName: "Scenic Outdoors",
        photographerUrl: "https://unsplash.com",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 6,
      title: "Betaab Valley & Aru Biosphere Sanctuary",
      description:
        "Private excursion to pristine Betaab Valley, surrounded by dense deodar forests and snow-capped peaks. Proceed to Aru Valley for gentle nature walks along glacier-fed streams.",
      activities: ["Betaab Valley Exploration", "Aru Nature Walk", "Evening Campfire"],
      meals: ["Breakfast Included", "Dinner Included"],
      stay: { hotel: "Pahalgam Hotel & River Chalets", city: "Pahalgam", roomType: "Luxury Riverside Cottage" },
      imageQuery: "Betaab valley pahalgam",
      image: null,
    },
    {
      dayNumber: 7,
      title: "Farewell to Paradise & Homeward Departure",
      description:
        "Savor breakfast overlooking the Lidder River. Private chauffeur transfer to Srinagar International Airport for your return flight home, taking with you cherished memories of Kashmir.",
      activities: ["Private Airport Chauffeur", "VIP Departure Assistance"],
      meals: ["Breakfast Included"],
      stay: { hotel: "Departure", city: "Srinagar", roomType: null },
      imageQuery: null,
      image: null,
    },
  ],
  flights: [
    {
      id: "fl-1",
      airline: "Air India",
      flightNumber: "AI-825",
      date: "15 Nov 2026",
      departureTime: "06:15",
      departureCity: "New Delhi",
      departureAirport: "Indira Gandhi Int'l (T3)",
      departureCode: "DEL",
      arrivalTime: "07:45",
      arrivalCity: "Srinagar",
      arrivalAirport: "Sheikh ul-Alam Int'l Airport",
      arrivalCode: "SXR",
      stops: "Non-stop",
      checkInBaggage: "25 Kg",
      cabinBaggage: "7 Kg",
      layover: null,
    },
    {
      id: "fl-2",
      airline: "Air India",
      flightNumber: "AI-826",
      date: "21 Nov 2026",
      departureTime: "14:30",
      departureCity: "Srinagar",
      departureAirport: "Sheikh ul-Alam Int'l Airport",
      departureCode: "SXR",
      arrivalTime: "16:05",
      arrivalCity: "New Delhi",
      arrivalAirport: "Indira Gandhi Int'l (T3)",
      arrivalCode: "DEL",
      stops: "Non-stop",
      checkInBaggage: "25 Kg",
      cabinBaggage: "7 Kg",
      layover: null,
    },
  ],
  pricing: {
    netAmountPaise: 16500000, // ₹1,65,000 net
    markup: { type: "percent", value: 18 },
    gstMode: "extra",
    gstRate: 0.05,
    sacCode: "998552",
    tcsDisclaimer: "TCS 5% applicable under Section 206C",
    validUntil: "30 Nov 2026",
  },
  inclusions: [
    "02 Nights Accommodation in Mascot Heritage Luxury Houseboat (Srinagar)",
    "02 Nights Accommodation in The Khyber Himalayan Resort & Spa (Gulmarg)",
    "02 Nights Accommodation in Pahalgam Hotel & River Chalets (Pahalgam)",
    "Daily buffet breakfast & signature dinners at all luxury resorts",
    "Private Chauffeur-driven luxury SUV for all transfers and sightseeing",
    "Private 2-hour Sunset Shikara ride on Dal Lake with floral decorations",
    "Gondola Phase 1 & Phase 2 cable car tickets pre-booked for Gulmarg",
    "Dedicated 24/7 TrippyGo Concierge & Trip Manager on ground",
  ],
  exclusions: [
    "Pony rides and personal sledging charges in Gulmarg / Sonamarg",
    "Optional personal expenses, minibar, laundry, and telephone calls",
    "Tips & gratuities for chauffeurs, guides, and hotel staff",
    "Any expenses incurred due to unexpected weather delays or flight reschedulings",
  ],
  terms: {
    payment: [
      "Token Advance: ₹25,000 per couple required to lock in boutique resort confirmations.",
      "Confirmation Stage: 30% of total package amount upon receipt of confirmed hotel vouchers.",
      "Final Balance: 70% balance due 21 days prior to arrival date.",
    ],
    cancellation: [
      { window: "30+ days prior to departure", charge: "₹10,000 partner booking fee" },
      { window: "29 to 15 days prior", charge: "30% of total tour package" },
      { window: "14 to 7 days prior", charge: "60% of total tour package" },
      { window: "Less than 7 days / No-Show", charge: "100% Non-refundable" },
    ],
  },
  meta: {
    sourceFile: "sample-itineraries/kashmir-luxury.pdf",
    extractedBy: "claude-sonnet-4-6",
    reviewFlags: [],
    extractedSnapshot: null,
    tokenUsage: null,
  },
  variants: [],
  salesperson: {
    name: "Rohan Kapoor",
    phone: "+91 98112 34567",
    email: "rohan@trippygo.com",
  },
};

async function runAudit() {
  console.log("[1/5] Computing safe client view (stripping markup/net rates)...");
  const clientView = computeClientView(luxuryItineraryMock);
  console.log(`  -> Client Package: ${clientView.package.title}`);
  console.log(`  -> Guest Name: ${clientView.package.guestName}`);
  console.log(`  -> Selling Price: ₹${clientView.pricing.finalPriceFormatted}`);
  console.log(`  -> Number of Days: ${clientView.days.length}`);
  console.log(`  -> Number of Flights: ${clientView.flights?.length || 0}`);

  console.log("\n[2/5] Rendering ItineraryTemplate into static HTML markup...");
  const templateElement = React.createElement(ItineraryTemplate, { clientView });
  const renderedMarkup = renderToStaticMarkup(templateElement);

  // Read print.css content to inline directly into test HTML
  const printCssPath = path.join(process.cwd(), "src", "styles", "print.css");
  const printCss = fs.readFileSync(printCssPath, "utf8");

  // Build complete HTML document
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${clientView.package.title}</title>
  <!-- Tailwind CSS CDN for exact preview environment -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${printCss}
  </style>
</head>
<body class="bg-slate-100 p-0 m-0">
  ${renderedMarkup}
</body>
</html>`;

  const outputDir = path.join(process.cwd(), ".uploads", "audit");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const htmlPath = path.join(outputDir, "luxury-itinerary-preview.html");
  fs.writeFileSync(htmlPath, fullHtml, "utf8");
  console.log(`  -> HTML preview written to: ${htmlPath}`);

  console.log("\n[3/5] Launching Playwright Chromium in headless print mode...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1600 });
  await page.setContent(fullHtml, { waitUntil: "networkidle" });

  // Await fonts readiness
  await page.evaluate(() => document.fonts.ready);

  // Emulate print media
  await page.emulateMedia({ media: "print" });

  console.log("\n[4/5] Capturing Playwright A4 PDF export...");
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  const pdfPath = path.join(outputDir, "trippygo-luxury-itinerary.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);
  const pdfSizeBytes = pdfBuffer.length;
  const pdfSizeKb = (pdfSizeBytes / 1024).toFixed(1);
  const pdfSizeMb = (pdfSizeBytes / (1024 * 1024)).toFixed(2);
  console.log(`  -> Generated PDF: ${pdfPath}`);
  console.log(`  -> File size: ${pdfSizeKb} KB (${pdfSizeMb} MB) [Target < 8 MB]`);

  await browser.close();

  console.log("\n[5/5] Auditing PDF structure & page metrics with PDFParse...");
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const pageCount = textResult.pages?.length || 0;
  const pdfText = textResult.text;
  await parser.destroy();

  const normalizedText = pdfText.replace(/\s+/g, " ");
  const textWithoutSpaces = pdfText.replace(/\s+/g, "");

  console.log(`  -> Total A4 Pages Generated: ${pageCount}`);
  console.log(`  -> Contains Guest Name ("DR. ARUN & PRIYA SHARMA"): ${pdfText.includes("DR. ARUN & PRIYA SHARMA")}`);
  console.log(`  -> Contains Brand Header ("TrippyGo"): ${pdfText.includes("TrippyGo")}`);
  console.log(`  -> Contains SAC Code ("998552"): ${pdfText.includes("998552")}`);
  console.log(`  -> Contains Flight Leg DEL -> SXR: ${pdfText.includes("DEL") && pdfText.includes("SXR")}`);
  console.log(`  -> Contains Curator Note ("Crafted with Passion"): ${pdfText.includes("Crafted with Passion")}`);
  console.log(`  -> Contains Note Kicker: ${textWithoutSpaces.includes("ANOTEFROMOURCURATORS")}`);

  if (pageCount !== 13) {
    throw new Error(`Unexpected page count: ${pageCount} (Expected exactly 13 pages for 7-day trip with adaptive flow)`);
  }

  if (pdfSizeBytes > 8 * 1024 * 1024) {
    throw new Error(`PDF size too large: ${pdfSizeMb} MB (Expected < 8 MB)`);
  }

  console.log("\n=======================================================");
  console.log("PASS: PHASE 6 PLAYWRIGHT PDF AUDIT COMPLETED 100%!");
  console.log("=======================================================\n");
}

runAudit().catch((err) => {
  console.error("FATAL: Phase 6 Audit Failed:", err);
  process.exit(1);
});
