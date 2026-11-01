import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { computeClientView } from "../src/lib/schema/client-view";
import ItineraryTemplate from "../src/templates/itinerary/ItineraryTemplate";
import { Itinerary } from "../src/lib/schema/itinerary";

async function run() {
  const mockItinerary: Itinerary = {
    schemaVersion: 1,
    package: {
      title: "Splendors of Bali: Sunset Beaches & Ubud Rainforest",
      destinations: ["Bali", "Kuta", "Ubud"],
      nights: 5,
      days: 6,
      startDate: "2027-02-05",
      travellers: { adults: 2, children: 0, rooms: 1 },
      guestName: "Arjun Sharma",
    },
    days: [
      {
        dayNumber: 1,
        title: "Arrival in Bali & Check-in at Kuta",
        location: "Kuta",
        description: "Welcome to Bali. Private airport transfer to your luxury resort.",
        activities: ["Airport Transfer", "Sunset Beach Walk"],
        meals: ["Dinner - Veg"],
        stay: { hotel: "Ramada by Wyndham Bali Sunset Road Kuta", city: "KUTA", roomType: "Superior King Room (Pool View with Balcony)" },
      },
      {
        dayNumber: 2,
        title: "Kuta Beach & Cultural Discovery",
        location: "Kuta",
        description: "Relax by the pool or explore the vibrant beachside boutiques.",
        activities: ["Kuta Beach", "Balinese Spa Treatment"],
        meals: ["Breakfast - Veg", "Dinner - Veg"],
        stay: { hotel: "Ramada by Wyndham Bali Sunset Road Kuta", city: "KUTA", roomType: "Superior King Room (Pool View with Balcony)" },
      },
      {
        dayNumber: 3,
        title: "Transfer to Ubud & Private Pool Villa Check-In",
        location: "Ubud",
        description: "Scenic drive into the central jungle highlands to your private pool villa.",
        activities: ["Tegenungan Waterfall", "Villa Check-in"],
        meals: ["Breakfast - Veg", "Dinner - Veg"],
        stay: { hotel: "Freddies Resort & Villas Ubud", city: "UBUD", roomType: "One Bedroom Luxury Private Pool Villa with Garden View" },
      },
      {
        dayNumber: 4,
        title: "Sacred Monkey Forest & Tegalalang Rice Terraces",
        location: "Ubud",
        description: "Walk among ancient banyan trees and swing over emerald rice paddies.",
        activities: ["Sacred Monkey Forest", "Aloha Ubud Swing"],
        meals: ["Breakfast - Veg", "Dinner - Veg"],
        stay: { hotel: "Freddies Resort & Villas Ubud", city: "UBUD", roomType: "One Bedroom Luxury Private Pool Villa with Garden View" },
      },
      {
        dayNumber: 5,
        title: "Kintamani Volcano & Coffee Plantation",
        location: "Ubud",
        description: "Spectacular views of Mount Batur and traditional luwak coffee tasting.",
        activities: ["Mount Batur Viewpoint", "Holy Springs"],
        meals: ["Breakfast - Veg", "Dinner - Veg"],
        stay: { hotel: "Freddies Resort & Villas Ubud", city: "UBUD", roomType: "One Bedroom Luxury Private Pool Villa with Garden View" },
      },
      {
        dayNumber: 6,
        title: "Farewell Bali & Homeward Flight",
        location: "Ubud",
        description: "Private transfer to Denpasar Airport for departure.",
        activities: ["Airport Transfer"],
        meals: ["Breakfast - Veg"],
        stay: null,
      },
    ],
    inclusions: ["5 Nights Luxury Stays", "Daily Breakfast & Dinner", "All Private Transfers"],
    exclusions: ["Personal Expenses", "Visa on Arrival"],
    pricing: {
      basis: "per_person",
      currency: "INR",
      netTotalPaise: 14000000,
      markup: { type: "percentage", value: 15 },
      roundingRule: "none",
      gstMode: "inclusive",
      tcsMode: "exempt",
      validUntil: "2027-01-20",
      sacCode: "998555",
      tcsDisclaimer: null,
    },
    terms: { payment: ["50% deposit"], cancellation: ["Standard cancellation rules apply"] },
    meta: { sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null, tokenUsage: null },
    variants: [],
  };

  const clientView = computeClientView(mockItinerary);
  const templateElement = React.createElement(ItineraryTemplate, { clientView });
  const renderedMarkup = renderToStaticMarkup(templateElement);
  const printCss = fs.readFileSync(path.join(process.cwd(), "src", "styles", "print.css"), "utf8");

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${printCss}</style>
</head>
<body class="bg-white p-0 m-0">
  ${renderedMarkup}
</body>
</html>`;

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });

  const pages = await page.$$(".itinerary-page, .cover-page, .back-page");
  const outDir = path.join(process.cwd(), ".uploads", "audit");

  // Screenshot Page 2 (Combined Summary + Accommodations)
  if (pages[1]) {
    await pages[1].screenshot({ path: path.join(outDir, "stays-combined-p2.png") });
  }

  await browser.close();
  console.log("Success! Combined screenshot saved.");
}

run().catch(console.error);
