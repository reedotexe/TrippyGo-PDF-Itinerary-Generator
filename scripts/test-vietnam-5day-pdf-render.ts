import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";
import { computeClientView } from "../src/lib/schema/client-view";
import ItineraryTemplate from "../src/templates/itinerary/ItineraryTemplate";
import { Itinerary } from "../src/lib/schema/itinerary";

const vietnam5DayMock: Itinerary = {
  id: "itn-vietnam-5d",
  schemaVersion: 1,
  package: {
    title: "Vietnam Scenic Discovery: Phu Quoc & Ho Chi Minh",
    destinations: ["Phu Quoc", "Ho Chi Minh City"],
    nights: 4,
    days: 5,
    startDate: "2026-12-01",
    travellers: { adults: 2, children: 0, rooms: 1 },
    guestName: "MR. JOHN DOE",
  },
  pricing: {
    netAmountPaise: 12000000,
    markup: { type: "percent", value: 15 },
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    tcsDisclaimer: "TCS 5% applicable",
    validUntil: "30 Nov 2026",
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Phu Quoc and Leisure",
      description:
        "The itinerary describes breakfast and checkout in Ho Chi Minh City, followed by a transfer to Tan Son Nhat Airport and a flight to Phu Quoc; flight details are not supplied. On arrival, transfer to the hotel and enjoy free time by the sea. Optional independent visits include VinWonders & Safari or Grand World. Lunch and dinner are at your own expense.",
      activities: ["Beach Leisure", "Sunset View", "Resort Check-in"],
      meals: ["Breakfast Included"],
      stay: { hotel: "Hotel to be confirmed", city: "Phu Quoc", roomType: "Sharing double/twin room" },
      imageQuery: "Phu Quoc sunset beach",
      image: {
        provider: "unsplash",
        photoId: "pq-1",
        imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&auto=format&fit=crop&q=80",
        photographerName: "Ondrej Bocek",
        photographerUrl: "https://unsplash.com",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 2,
      title: "Phu Quoc Islands, Aquatopia and Cable Car",
      description:
        "After breakfast, join a shared speedboat excursion, with pickup in the Duong Dong area around 08:00–08:30 and departure from An Thoi Harbor. Explore the southern islands, with swimming and snorkeling opportunities; seawalking and diving are optional paid activities. Enjoy buffet lunch at Hon Thom, visit Aquatopia Water Park, then take the cable car back with sea views. Stop at Mediterranean Town before returning to the hotel around 18:00.",
      activities: ["Island Hopping", "Aquatopia Water Park", "Cable Car Experience"],
      meals: ["Breakfast Included", "Buffet Lunch Included"],
      stay: { hotel: "Hotel to be confirmed", city: "Phu Quoc", roomType: "Sharing double/twin room" },
      imageQuery: null,
      image: null,
    },
    {
      dayNumber: 3,
      title: "Phu Quoc to Ho Chi Minh City and City Tour",
      description:
        "Have breakfast, check out and transfer to Phu Quoc International Airport for the flight to Ho Chi Minh City; the domestic airfare is excluded and flight details are not provided. After arrival, transfer to the hotel and check in, with standard check-in at 14:00 subject to availability. In the afternoon, visit Reunification Palace and see colonial landmarks including Notre Dame Cathedral, the General Post Office, City Hall and the Opera House, then shop at Ben Thanh Market.",
      activities: ["Airport Transfer", "Reunification Palace", "Ben Thanh Market"],
      meals: ["Breakfast Included"],
      stay: { hotel: "Hotel to be confirmed", city: "Ho Chi Minh City", roomType: "Sharing double/twin room" },
      imageQuery: null,
      image: null,
    },
    {
      dayNumber: 4,
      title: "Mekong Delta and My Tho Excursion",
      description:
        "After breakfast, depart around 08:30 by air-conditioned vehicle for My Tho and visit Vinh Trang Pagoda. Take a boat along the Mekong past fish farms and the Dragon, Unicorn, Turtle and Phoenix islands. Continue to Ben Tre for a coconut workshop, horse-cart ride to a honey farm with honey tea, a sampan ride beneath water-coconut trees, a motorboat journey along a small canal and a visit to a coconut-candy factory. Return to Ho Chi Minh City around 16:00.",
      activities: ["Mekong River Cruise", "Vinh Trang Pagoda", "Coconut Workshop"],
      meals: ["Breakfast Included"],
      stay: { hotel: "Hotel to be confirmed", city: "Ho Chi Minh City", roomType: "Sharing double/twin room" },
      imageQuery: null,
      image: null,
    },
    {
      dayNumber: 5,
      title: "Departure from Ho Chi Minh City",
      description:
        "Enjoy breakfast at the hotel and check out. Transfer to Tan Son Nhat International Airport for the departure flight; airline and flight details are not provided. Standard checkout is 12:00. Safe travels home!",
      activities: ["Breakfast", "Airport Transfer", "Homeward Departure"],
      meals: ["Breakfast Included"],
      stay: { hotel: "Departure", city: "Ho Chi Minh City", roomType: null },
      imageQuery: null,
      image: null,
    },
  ],
  flights: [],
  inclusions: [
    "Accommodation in double/twin sharing room with daily breakfast",
    "Transfers and sightseeing by air-conditioned vehicle as mentioned",
    "English-speaking guide during shared excursions",
    "Cable car tickets and entrance fees per itinerary",
    "Boat trips in Mekong Delta and speedboat in Phu Quoc",
  ],
  exclusions: [
    "International and domestic flights",
    "Vietnam visa fees",
    "Personal expenses (beverages, laundry, phone calls)",
    "Tips for drivers and guides",
  ],
  terms: {
    payment: [
      "Token Amount: INR 10,000 non-refundable upon booking confirmation",
      "Balance 50% upon confirmation of services",
      "Full payment 15 days before departure",
    ],
    cancellation: [
      { window: "30+ days prior", charge: "Loss of token deposit" },
      { window: "15 to 29 days", charge: "50% of package cost" },
      { window: "Less than 15 days", charge: "100% non-refundable" },
    ],
  },
  meta: {
    sourceFile: "sample-itineraries/vietnam-5d.pdf",
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

async function testVietnam() {
  console.log("=== TESTING 5-DAY VIETNAM ITINERARY WITH ADAPTIVE FLOW ===");
  const clientView = computeClientView(vietnam5DayMock);

  const templateElement = React.createElement(ItineraryTemplate, { clientView });
  const renderedMarkup = renderToStaticMarkup(templateElement);

  const printCssPath = path.join(process.cwd(), "src", "styles", "print.css");
  const printCss = fs.readFileSync(printCssPath, "utf8");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${clientView.package.title}</title>
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
  const htmlPath = path.join(outputDir, "vietnam-preview.html");
  fs.writeFileSync(htmlPath, fullHtml, "utf8");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 1697 });
  await page.setContent(fullHtml, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: "print" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });

  const pdfPath = path.join(outputDir, "vietnam-adaptive.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);
  console.log(`Generated Vietnam PDF: ${pdfPath}`);

  // Screenshot Page 2 (Summary + Stays combined)
  const pages = await page.$$(".itinerary-page, .cover-page, .back-page");
  console.log(`Total sections rendered: ${pages.length}`);

  if (pages[1]) {
    await pages[1].screenshot({ path: path.join(outputDir, "vietnam-page2-summary-stays.png") });
    console.log("Captured vietnam-page2-summary-stays.png");
  }
  if (pages[2]) {
    await pages[2].screenshot({ path: path.join(outputDir, "vietnam-page3-days.png") });
    console.log("Captured vietnam-page3-days.png");
  }
  if (pages[3]) {
    await pages[3].screenshot({ path: path.join(outputDir, "vietnam-page4-days.png") });
    console.log("Captured vietnam-page4-days.png");
  }

  await browser.close();

  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const pageCount = textResult.pages?.length || 0;
  await parser.destroy();

  const normalizedUpper = textResult.text.replace(/\s+/g, "").toUpperCase();

  console.log(`\nAuditing Vietnam PDF metrics:`);
  console.log(`  -> Total A4 Pages Generated: ${pageCount}`);
  console.log(`  -> Contains "Private Transfers": ${normalizedUpper.includes("PRIVATETRANSFERS")}`);
  console.log(`  -> Contains "Daily Highlights & Activities": ${normalizedUpper.includes("DAILYHIGHLIGHTS")}`);
  console.log(`  -> Contains "Phu Quoc Islands, Aquatopia and Cable Car": ${textResult.text.includes("Aquatopia and Cable Car")}`);

  if (pageCount !== 8) {
    throw new Error(`Expected exactly 8 pages for 5-day Vietnam itinerary, got ${pageCount}`);
  }

  console.log("\nPASS: 5-DAY VIETNAM ADAPTIVE PDF AUDIT COMPLETED 100%!");
}

testVietnam().catch(console.error);
