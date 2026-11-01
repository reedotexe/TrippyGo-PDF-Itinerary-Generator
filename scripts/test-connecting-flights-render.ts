import fs from "fs";
import path from "path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "playwright";
import { PDFParse } from "pdf-parse";
import { computeClientView } from "../src/lib/schema/client-view";
import ItineraryTemplate from "../src/templates/itinerary/ItineraryTemplate";
import { Itinerary } from "../src/lib/schema/itinerary";

async function testConnectingFlightsRender() {
  const mockItinerary: Itinerary = {
    schemaVersion: 1,
    package: {
      title: "Exquisite Bali Escape: Beaches, Temples & Waterfalls",
      destinations: ["Bali", "Ubud", "Seminyak"],
      nights: 6,
      days: 7,
      startDate: "2026-11-15",
      travellers: {
        adults: 2,
        children: 0,
        rooms: 1,
      },
      guestName: "Arjun & Sneha Sharma",
    },
    flights: [
      {
        id: "fl_out_1",
        airline: "IndiGo",
        flightNumber: "6E-204",
        date: "2026-11-15",
        departureTime: "06:00",
        departureCode: "DEL",
        departureCity: "New Delhi",
        departureAirport: "Indira Gandhi International Airport Terminal 3",
        arrivalTime: "08:45",
        arrivalCode: "BLR",
        arrivalCity: "Bengaluru",
        arrivalAirport: "Kempegowda International Airport",
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "15 kg",
        cabinBaggage: "7 kg",
        direction: "outbound",
      },
      {
        id: "fl_out_2",
        airline: "Batik Air",
        flightNumber: "OD-9102",
        date: "2026-11-15",
        departureTime: "11:30",
        departureCode: "BLR",
        departureCity: "Bengaluru",
        departureAirport: "Kempegowda International Airport Terminal 2",
        arrivalTime: "19:15",
        arrivalCode: "DPS",
        arrivalCity: "Bali (Denpasar)",
        arrivalAirport: "Ngurah Rai International Airport",
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "20 kg",
        cabinBaggage: "7 kg",
        direction: "outbound",
      },
      {
        id: "fl_in_1",
        airline: "Air India",
        flightNumber: "AI-383",
        date: "2026-11-21",
        departureTime: "14:30",
        departureCode: "DPS",
        departureCity: "Bali (Denpasar)",
        departureAirport: "Ngurah Rai International Airport",
        arrivalTime: "20:45",
        arrivalCode: "DEL",
        arrivalCity: "New Delhi",
        arrivalAirport: "Indira Gandhi International Airport",
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "25 kg",
        cabinBaggage: "7 kg",
        direction: "inbound",
      },
    ],
    days: [
      {
        dayNumber: 1,
        title: "Arrival in Bali & Private Villa Check-In",
        location: "Seminyak",
        description: "Touchdown at Ngurah Rai International Airport. Meet your personal chauffeur and transfer to your luxury private pool villa.",
        highlights: ["VIP Airport Meet & Greet", "Welcome Dinner by the Beach"],
        meals: { breakfast: false, lunch: false, dinner: true },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 2,
        title: "Sacred Monkey Forest & Ubud Art Market",
        location: "Ubud",
        description: "Explore the cultural heart of Bali with a guided morning tour through the lush monkey forest sanctuary.",
        highlights: ["Ubud Palace", "Traditional Art Market", "Tegalalang Rice Terraces"],
        meals: { breakfast: true, lunch: true, dinner: false },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 3,
        title: "Tirta Empul Water Blessing & Kintamani Volcano",
        location: "Kintamani",
        description: "Experience holy spring water blessings at Tirta Empul Temple followed by panoramic dining overlooking Mount Batur.",
        highlights: ["Holy Spring Water Cleansing", "Mount Batur Caldera View"],
        meals: { breakfast: true, lunch: true, dinner: false },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 4,
        title: "Nusa Penida Island Speedboat Day Cruise",
        location: "Nusa Penida",
        description: "Speedboat across the Badung Strait to Nusa Penida. Visit the world-famous Kelingking T-Rex cliff and swim at Broken Beach.",
        highlights: ["Kelingking T-Rex Beach", "Angel's Billabong", "Snorkeling at Crystal Bay"],
        meals: { breakfast: true, lunch: true, dinner: true },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 5,
        title: "Ulun Danu Beratan Floating Temple & Handara Gate",
        location: "Bedugul",
        description: "Ascend to the central highlands to witness the iconic lakeside temple and capture postcard memories at Handara Gate.",
        highlights: ["Iconic Lake Bratan Temple", "Banyumala Twin Waterfalls"],
        meals: { breakfast: true, lunch: true, dinner: false },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 6,
        title: "Sunset Catamaran Cruise & Uluwatu Kecak Dance",
        location: "Uluwatu",
        description: "Spend your afternoon sailing along south Bali cliffs, followed by the fiery cliffside Kecak dance at sunset.",
        highlights: ["Cliffside Temple Amphitheatre", "Jimbaran Seafood BBQ"],
        meals: { breakfast: true, lunch: false, dinner: true },
        hotel: { name: "The Seminyak Beach Resort & Spa", roomType: "Private Pool Villa" },
      },
      {
        dayNumber: 7,
        title: "Morning Spa Ritual & Homeward Flight",
        location: "Seminyak",
        description: "Enjoy a final Balinese floral massage before private airport transfer for your departure back home to New Delhi.",
        highlights: ["Traditional 90-min Floral Massage", "Private Airport Transfer"],
        meals: { breakfast: true, lunch: false, dinner: false },
        hotel: null,
      },
    ],
    inclusions: [
      "Round-trip airfare (New Delhi to Bali via Bengaluru connection & return to Delhi)",
      "6 Nights accommodation in Private Pool Villa with daily champagne breakfast",
      "All airport and sightseeing transfers in private air-conditioned vehicle",
      "Full-day guided Nusa Penida speedboat tour with all entrance permits",
      "Sunset Kecak Fire Dance performance tickets at Uluwatu Temple",
      "24/7 Dedicated WhatsApp Concierge and local English-speaking tour guide",
    ],
    exclusions: [
      "Indonesia Visa on Arrival (approx $35 USD payable at airport)",
      "Expenses of personal nature and laundry services",
      "Travel insurance coverage (available upon request)",
    ],
    pricing: {
      basis: "per_person",
      currency: "INR",
      netTotalPaise: 24000000,
      markup: {
        type: "percentage",
        value: 15,
      },
      roundingRule: "none",
      gstMode: "inclusive",
      tcsMode: "exempt",
      validUntil: "2026-11-05",
      sacCode: "998555",
      tcsDisclaimer: "TCS applicable as per RBI guidelines for international travel.",
    },
    terms: {
      payment: [
        "25% advance token payment upon itinerary confirmation.",
        "50% second tranche payable 30 days prior to departure.",
        "25% final settlement payable 10 days before departure.",
      ],
      cancellation: [
        "Free cancellation up to 45 days prior to travel date.",
        "50% retention for cancellations between 30 to 44 days prior.",
        "100% non-refundable within 29 days of travel.",
      ],
    },
    meta: {
      sourceFile: null,
      extractedBy: null,
      reviewFlags: [],
      extractedSnapshot: null,
      tokenUsage: null,
    },
    variants: [],
    salesperson: {
      name: "Rohan Verma",
      phone: "+91 98112 34567",
      email: "rohan@trippygo.com",
    },
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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
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

  const outDir = path.join(process.cwd(), ".uploads", "audit");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfPath = path.join(outDir, "test-connecting-flights.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);

  const pages = await page.$$(".itinerary-page, .cover-page, .back-page");
  console.log(`Rendered ${pages.length} pages in DOM.`);

  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({
      path: path.join(outDir, `connecting-flights-p${i + 1}.png`),
    });
  }

  await browser.close();

  const parser = new PDFParse({ data: pdfBuffer });
  const res = await parser.getText();
  await parser.destroy();

  console.log(`PDF Pages parsed: ${res.pages.length}`);
  res.pages.forEach((p, i) => {
    const hasLayover = p.text.includes("Layover in Bengaluru") || p.text.includes("LAYOVER IN BENGALURU");
    const hasGoing = p.text.includes("Going Flights") || p.text.includes("GOING FLIGHTS");
    const hasReturn = p.text.includes("Return Flights") || p.text.includes("RETURN FLIGHTS");
    const hasFooter = p.text.includes("Friends Travels");
    const firstLine = p.text.trim().split("\n")[0];
    console.log(
      `Page ${i + 1}: Title="${firstLine}" | Footer=${hasFooter} | HasLayover=${hasLayover} | HasGoing=${hasGoing} | HasReturn=${hasReturn}`
    );
    if (hasGoing || hasReturn || p.text.includes("FLIGHT")) {
      console.log(`--- Flight text on Page ${i + 1} ---:\n${p.text}\n-------------------`);
    }
  });
}

testConnectingFlightsRender().catch(console.error);
