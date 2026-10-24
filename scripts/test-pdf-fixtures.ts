import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { Itinerary } from "../src/lib/schema/itinerary";
import { computeClientView, ClientItineraryView } from "../src/lib/schema/client-view";

const FIXTURES_DIR = path.join(process.cwd(), ".uploads", "fixtures");
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

// 1. 3-Day Itinerary (Goa Beach Getaway)
const fixture1_3day: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Goa Sun & Sand Mini-Break",
    destinations: ["North Goa", "South Goa"],
    nights: 2,
    days: 3,
    startDate: "2026-11-15",
    travellers: { adults: 2, children: 0, rooms: 1 },
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Goa & Calangute Beach Sunset",
      description: "Arrive at MOPA airport, private transfer to North Goa boutique resort. Sunset at Calangute beach.",
      activities: ["Airport transfer", "Calangute beach stroll", "Beach shack dinner"],
      meals: ["Dinner"],
      stay: { hotel: "Hard Rock Hotel Goa", city: "Calangute", roomType: "Deluxe King" },
      imageQuery: "Goa calangute beach sunset",
      image: {
        provider: "unsplash",
        photoId: "goa-1",
        imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&auto=format&fit=crop&q=80",
        thumbnailUrl: null,
        photographerName: "Sumit Sourav",
        photographerUrl: "https://unsplash.com/@sumitsourav",
        downloadLocation: null,
      },
    },
    {
      dayNumber: 2,
      title: "North Goa Heritage & Fort Aguada",
      description: "Explore 17th century Fort Aguada, Candolim beach, and Chapora Fort. Evening cruise on Mandovi river.",
      activities: ["Fort Aguada", "Chapora Fort", "Mandovi River Cruise"],
      meals: ["Breakfast"],
      stay: { hotel: "Hard Rock Hotel Goa", city: "Calangute", roomType: "Deluxe King" },
      imageQuery: "Fort aguada lighthouse goa",
      image: null,
    },
    {
      dayNumber: 3,
      title: "South Goa Churches & Airport Drop",
      description: "Visit Basilica of Bom Jesus in Old Goa. Private cab drop to airport for evening flight.",
      activities: ["Old Goa Churches", "Airport transfer"],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: "Old goa church basilica",
      image: null,
    },
  ],
  inclusions: [
    "2 Nights accommodation in 4-star resort with breakfast",
    "Private AC Sedan for all transfers & sightseeing",
    "Mandovi river sunset cruise tickets for 2",
    "Driver allowance, toll taxes, and parking",
  ],
  exclusions: ["Airfare", "Water sports", "Lunch & alcoholic beverages", "Monument entrance fees"],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 1800000, // 18,000 INR
    markup: { type: "percent", value: 15 },
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 7,
  },
  terms: {
    payment: ["100% advance required 7 days prior to travel"],
    cancellation: [
      { window: "> 7 days prior", charge: "Free cancellation" },
      { window: "< 7 days prior", charge: "100% non-refundable" },
    ],
  },
  meta: { sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null },
  variants: [],
  salesperson: { name: "Ananya Deshmukh", phone: "+91 98200 44321", email: "ananya@trippygo.com" },
};

// 2. 7-Day Itinerary (Kashmir Paradise)
const fixture2_7day: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Kashmir Crown of the Himalayas",
    destinations: ["Srinagar", "Gulmarg", "Pahalgam"],
    nights: 6,
    days: 7,
    startDate: "2026-12-10",
    travellers: { adults: 2, children: 1, rooms: 1 },
  },
  days: [
    {
      dayNumber: 1,
      title: "Arrival in Srinagar & Dal Lake Shikara",
      description: "Check into heritage houseboat on Dal Lake. Enjoy relaxing 1-hour sunset Shikara ride.",
      activities: ["Airport transfer", "Shikara ride"],
      meals: ["Dinner"],
      stay: { hotel: "Mascot Houseboats", city: "Srinagar", roomType: "Royal Suite" },
      imageQuery: "Dal lake shikara srinagar",
      image: {
        provider: "unsplash",
        photoId: "kashmir-1",
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
      description: "Day excursion to Sonamarg Meadow of Gold. Trek or take pony to Thajiwas glacier.",
      activities: ["Thajiwas Glacier", "Sindh river valley"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "The Lalit Grand Palace", city: "Srinagar", roomType: "Valley View" },
      imageQuery: "Sonamarg mountains kashmir",
      image: null,
    },
    {
      dayNumber: 3,
      title: "Srinagar to Gulmarg",
      description: "Drive through pine meadows to Gulmarg. Experience world's highest Gondola cable car ride.",
      activities: ["Gondola Phase 1 & 2", "Snow games"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "The Khyber Himalayan Resort", city: "Gulmarg", roomType: "Premier Room" },
      imageQuery: "Gulmarg snow khyber resort",
      image: null,
    },
    {
      dayNumber: 4,
      title: "Gulmarg to Pahalgam Valley",
      description: "Scenic transfer along saffron fields of Pampore to the valley of shepherds, Pahalgam.",
      activities: ["Pampore Saffron", "Apple orchards"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Pahalgam Hotel", city: "Pahalgam", roomType: "River View Suite" },
      imageQuery: "Pahalgam lidder river",
      image: null,
    },
    {
      dayNumber: 5,
      title: "Betaab & Aru Valleys",
      description: "Visit picturesque Betaab Valley and Chandanwari base camp of Amarnath Yatra.",
      activities: ["Betaab Valley", "Aru Valley", "Chandanwari"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "Pahalgam Hotel", city: "Pahalgam", roomType: "River View Suite" },
      imageQuery: "Betaab valley pine trees",
      image: null,
    },
    {
      dayNumber: 6,
      title: "Pahalgam to Srinagar & Mughal Gardens",
      description: "Return to Srinagar city. Explore Nishat Bagh, Shalimar Bagh, and Shankaracharya Temple.",
      activities: ["Mughal Gardens", "Old City Bazaars"],
      meals: ["Breakfast", "Dinner"],
      stay: { hotel: "The Lalit Grand Palace", city: "Srinagar", roomType: "Valley View" },
      imageQuery: "Nishat bagh fountains srinagar",
      image: null,
    },
    {
      dayNumber: 7,
      title: "Departure from Srinagar",
      description: "Morning at leisure for dry fruit and Pashmina shopping. Private transfer to airport.",
      activities: ["Souvenir shopping", "Airport transfer"],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: "Srinagar airport",
      image: null,
    },
  ],
  inclusions: [
    "6 Nights accommodation in 5-star & heritage properties",
    "MAPAI Plan: Daily Buffet Breakfast & Chef-curated Dinners",
    "Exclusive Innova Crysta for all 7 days with commercial permit",
    "Complimentary 1-hour sunset Shikara ride",
  ],
  exclusions: ["Gondola Phase 2 ticket", "Pony rides", "Union taxi in Pahalgam"],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 7400000,
    markup: { type: "percent", value: 18 },
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 10,
  },
  terms: {
    payment: ["30% at booking confirmation", "70% 15 days prior to arrival"],
    cancellation: [
      { window: "> 30 days prior", charge: "10% service retention" },
      { window: "15 to 30 days prior", charge: "50% retention" },
      { window: "< 15 days prior", charge: "100% non-refundable" },
    ],
  },
  meta: { sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null },
  variants: [],
  salesperson: { name: "Vikram Malhotra", phone: "+91 99100 88776", email: "vikram@trippygo.com" },
};

// 3. 14-Day Itinerary (Grand Rajasthan & Golden Triangle Tour)
const fixture3_14day: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Grand Rajasthan & Golden Triangle Heritage Odyssey",
    destinations: ["Delhi", "Agra", "Jaipur", "Jodhpur", "Udaipur", "Jaisalmer"],
    nights: 13,
    days: 14,
    startDate: "2027-01-10",
    travellers: { adults: 4, children: 0, rooms: 2 },
  },
  days: Array.from({ length: 14 }).map((_, i) => ({
    dayNumber: i + 1,
    title: `Heritage Circuit Day ${i + 1}: Royal Exploration`,
    description: `Detailed palace tours, historical ramparts, cultural folk dances, and traditional Rajasthani royal dining on Day ${i + 1}.`,
    activities: [`Fort excursion ${i + 1}`, `Local market tour`, `Folk dance performance`],
    meals: ["Breakfast", "Dinner"],
    stay: { hotel: `Royal Palace Heritage Hotel ${i + 1}`, city: "Rajasthan", roomType: "Heritage Royal Room" },
    imageQuery: `Rajasthan royal palace architecture`,
    image:
      i === 0
        ? {
            provider: "unsplash",
            photoId: "raj-1",
            imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80",
            thumbnailUrl: null,
            photographerName: "Aditya Siva",
            photographerUrl: "https://unsplash.com/@adityasiva",
            downloadLocation: null,
          }
        : null,
  })),
  inclusions: [
    "13 Nights in authentic Palace Heritage properties",
    "Private luxury Tempo Traveller for 14 days",
    "Government authorized English-speaking palace guides",
    "Camel safari and desert tent dinner in Sam Sand Dunes",
  ],
  exclusions: ["International/Domestic flights", "Monument entry tickets", "Camera fees"],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 18500000, // 1,85,000 INR
    markup: { type: "percent", value: 15 },
    gstMode: "extra",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 14,
  },
  terms: {
    payment: ["50% advance upon confirmation", "Balance 20 days prior to arrival"],
    cancellation: [
      { window: "> 45 days", charge: "Zero cancellation" },
      { window: "21 to 45 days", charge: "40% charge" },
      { window: "< 21 days", charge: "100% non-refundable" },
    ],
  },
  meta: { sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null },
  variants: [],
  salesperson: { name: "Rajveer Singh", phone: "+91 94140 12345", email: "rajveer@trippygo.com" },
};

// 4. Day with No Image (Pure typography and badge layout)
const fixture4_no_image: Itinerary = {
  ...fixture1_3day,
  package: { ...fixture1_3day.package, title: "Coorg Hill Station Nature Retreat (No Photos Mode)" },
  days: fixture1_3day.days.map((d) => ({ ...d, image: null })),
};

// 5. Very Long Hotel Name (60+ characters) and Long Activity List (10+ items)
const fixture5_long_hotel_activities: Itinerary = {
  ...fixture1_3day,
  package: { ...fixture1_3day.package, title: "Luxury Wellness Spa & Ayurvedic Immersion" },
  days: [
    {
      dayNumber: 1,
      title: "Comprehensive Wellness Check-in & Rejuvenation Therapy",
      description: "Arrive at the ultra-luxury retreat center. Receive personalized Ayurvedic doctor consultation followed by herbal therapies and sunset meditative yoga.",
      activities: [
        "Personalized Ayurvedic Doctor Consultation",
        "Abhyanga Full Body Herbal Massage",
        "Shirodhara Oil Flow Treatment",
        "Organic Herbal Steam Bath Session",
        "Sunset Mindful Meditation by the Lotus Lake",
        "Sanskrit Chanting and Sound Bowl Healing",
        "Nutritionist Consultation & Custom Diet Plan",
        "Herbal Garden Botanical Walk with Naturalist",
        "Evening Classical Sitar Concert by the Fireplace",
        "Warm Turmeric Golden Milk Nightcap Ritual",
      ],
      meals: ["Breakfast", "Ayurvedic Satvik Lunch", "Dinner"],
      stay: {
        hotel: "The Imperial Grand Heritage Maharaja Palace Luxury Collection Resort & Botanical Sanctuary (68 chars)",
        city: "Wayanad Rainforest Hills",
        roomType: "Presidential Private Pool Treehouse Villa",
      },
      imageQuery: "Luxury ayurvedic resort spa",
      image: null,
    },
  ],
};

// 6. Package with No Cancellation Block
const fixture6_no_cancellation: Itinerary = {
  ...fixture1_3day,
  package: { ...fixture1_3day.package, title: "Special Flash Deal Weekend (No Cancellation Policy)" },
  terms: {
    payment: ["100% payment required instantly"],
    cancellation: [], // Explicitly empty cancellation slabs
  },
};

// 7. Price Missing / Zero ("Price on Request")
const fixture7_zero_price: Itinerary = {
  ...fixture1_3day,
  package: { ...fixture1_3day.package, title: "Bespoke Royal Charter Tour (Custom / On Request)" },
  pricing: {
    currency: "INR",
    basis: "total_group",
    netAmountPaise: 0, // Zero price
    markup: { type: "percent", value: 0 },
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 3,
  },
};

// 8. Inclusions Section Hidden (Both inclusions and exclusions empty)
const fixture8_hidden_inclusions: Itinerary = {
  ...fixture1_3day,
  package: { ...fixture1_3day.package, title: "Hotel-Only Self-Drive Package (Hidden Inclusions Block)" },
  inclusions: [], // Hidden
  exclusions: [], // Hidden
};

const FIXTURES_LIST = [
  { id: "01_3day_goa", name: "3-Day Itinerary (Goa Beach)", data: fixture1_3day },
  { id: "02_7day_kashmir", name: "7-Day Itinerary (Kashmir)", data: fixture2_7day },
  { id: "03_14day_grand_tour", name: "14-Day Itinerary (Grand Rajasthan)", data: fixture3_14day },
  { id: "04_no_image_day", name: "Day with No Image", data: fixture4_no_image },
  { id: "05_long_hotel_activities", name: "Long Hotel (68 chars) & 10 Activities", data: fixture5_long_hotel_activities },
  { id: "06_no_cancellation", name: "Package with No Cancellation Block", data: fixture6_no_cancellation },
  { id: "07_zero_price_on_request", name: "Price Missing / Zero (On Request)", data: fixture7_zero_price },
  { id: "08_hidden_inclusions", name: "Inclusions Section Hidden", data: fixture8_hidden_inclusions },
];

/**
 * Generate HTML matching template components
 */
function generateTemplateHtml(clientView: ClientItineraryView): string {
  const { package: pkg, pricing, salesperson, days, inclusions, exclusions, terms } = clientView;
  const quoteDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const heroImage = days.find((d) => d.image)?.image?.imageUrl;
  const isZeroPrice = !pricing.finalPricePaise || pricing.finalPricePaise <= 0;
  const priceDisplay = isZeroPrice ? "On Request" : `₹ ${pricing.finalPriceFormatted}`;

  const allActivities = days.flatMap((d) => d.activities || []);
  const topHighlights = Array.from(new Set(allActivities)).slice(0, 6);
  const stays = days.filter((d) => d.stay && (d.stay.hotel || d.stay.city));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${pkg.title} - TrippyGo Itinerary</title>
  <meta name="ready" content="true" id="render-ready-meta">
  <style>
    @page { size: A4 portrait; margin: 10mm 8mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; font-size: 13px; line-height: 1.5; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .cover-banner { position: relative; background: #0f172a; color: white; padding: 32px 36px; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
    .hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.35; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(21,86,166,0.85) 60%, rgba(201,34,41,0.8) 100%); }
    .badge { display: inline-block; background: #c92229; color: white; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .glance-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 24px; margin-bottom: 24px; }
    .day-block { border-left: 3px solid #1556a6; padding-left: 20px; margin-bottom: 22px; position: relative; word-break: break-word; }
    .day-num { position: absolute; left: -14px; top: 0; width: 24px; height: 24px; background: #1556a6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
    .stay-pill { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 6px; margin-top: 4px; }
    .act-tag { background: #f1f5f9; color: #334155; padding: 2px 7px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 4px; margin-top: 4px; }
    .table-custom { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
    .table-custom th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .table-custom td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .price-box { background: linear-gradient(135deg, #1556a6, #0f172a); color: white; padding: 24px 28px; border-radius: 12px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
    .footer-bar { background: #0f172a; color: #94a3b8; padding: 24px 28px; border-radius: 8px; margin-top: 24px; font-size: 11px; }
  </style>
</head>
<body>
  <!-- 1. COVER PAGE -->
  <div class="cover-banner avoid-break">
    ${heroImage ? `<img src="${heroImage}" class="hero-img" alt="Cover" />` : ""}
    <div class="hero-overlay"></div>
    <div style="position: relative; z-index: 10;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="badge">Official Travel Proposal</div>
          <h1 style="font-size: 28px; margin: 0 0 8px 0; font-weight: 800; color: #ffffff;">${pkg.title}</h1>
          <div style="font-size: 14px; color: #93c5fd;">📍 ${pkg.destinations.join(" • ")} | ${pkg.nights}N / ${pkg.days}D</div>
        </div>
        <div style="text-align: right;">
          <div style="background: #c92229; color: white; font-weight: 900; font-size: 18px; padding: 4px 12px; border-radius: 4px; display: inline-block;">TRIPPYGO</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">Quote Date: ${quoteDate}</div>
        </div>
      </div>
      <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.2); display: flex; justify-content: space-between; font-size: 12px;">
        <div>Prepared for: <strong style="color: white;">Valued Guests (${pkg.travellers.adults} Adults, ${pkg.travellers.rooms} Room)</strong></div>
        <div>Total Investment: <strong style="color: #fde047; font-size: 16px;">${priceDisplay}</strong></div>
      </div>
    </div>
  </div>

  <!-- 2. TRIP AT A GLANCE -->
  <div class="glance-bar avoid-break">
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #1556a6; margin-bottom: 8px;">Trip at a Glance</div>
    <div style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">
      Route: ${pkg.destinations.join(" ➔ ")}
    </div>
    ${topHighlights.length > 0 ? `<div>${topHighlights.map((h) => `<span class="act-tag" style="background:#e0f2fe;color:#0369a1;">✨ ${h}</span>`).join("")}</div>` : ""}
  </div>

  <!-- 3. DAY BY DAY -->
  <div class="avoid-break" style="margin-bottom: 24px;">
    <h2 style="font-size: 18px; border-bottom: 2px solid #c92229; padding-bottom: 6px; margin: 0 0 20px 0; color: #0f172a;">Day-by-Day Experience</h2>
    ${days
      .map(
        (d) => `
      <div class="day-block avoid-break">
        <div class="day-num">${d.dayNumber}</div>
        <h3 style="margin: 0 0 4px 0; font-size: 15px; color: #0f172a;">Day ${d.dayNumber}: ${d.title}</h3>
        ${d.fullDateLabel ? `<div style="font-size: 11px; color: #c92229; font-weight: 600; margin-bottom: 6px;">📅 ${d.fullDateLabel}</div>` : ""}
        ${d.image ? `<div style="margin: 8px 0; max-height: 180px; overflow: hidden; border-radius: 6px;"><img src="${d.image.imageUrl}" style="width: 100%; height: 160px; object-fit: cover;" alt="Day ${d.dayNumber}"/></div>` : ""}
        <p style="margin: 4px 0 8px 0; color: #475569; font-size: 13px; line-height: 1.5;">${d.description}</p>
        <div>
          ${d.stay?.hotel ? `<span class="stay-pill">🏨 Stay: <strong>${d.stay.hotel}</strong> ${d.stay.city ? `(${d.stay.city})` : ""}</span>` : ""}
          ${d.meals.length > 0 ? `<span class="stay-pill" style="background:#fef3c7;color:#92400e;border-color:#fde68a;">🍽️ Meals: ${d.meals.join(", ")}</span>` : ""}
          ${d.activities.map((a) => `<span class="act-tag">✓ ${a}</span>`).join("")}
        </div>
      </div>
    `
      )
      .join("")}
  </div>

  <!-- 4. STAYS TABLE (Hidden if empty) -->
  ${
    stays.length > 0
      ? `
  <div class="avoid-break" style="margin-bottom: 24px;">
    <h3 style="font-size: 15px; border-bottom: 2px solid #1556a6; padding-bottom: 4px; margin-bottom: 12px; color: #0f172a;">Accommodations & Stays</h3>
    <table class="table-custom">
      <thead>
        <tr><th>Day</th><th>Destination</th><th>Hotel / Resort</th><th>Room Category</th></tr>
      </thead>
      <tbody>
        ${stays
          .map(
            (s) => `
          <tr>
            <td>Day ${s.dayNumber}</td>
            <td><strong>${s.stay?.city || "—"}</strong></td>
            <td>${s.stay?.hotel}</td>
            <td style="color: #64748b;">${s.stay?.roomType || "Base Category"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  <!-- 5. INCLUSIONS & EXCLUSIONS (Hidden if both empty) -->
  ${
    inclusions.length > 0 || exclusions.length > 0
      ? `
  <div class="avoid-break" style="display: flex; gap: 16px; margin-bottom: 24px;">
    ${
      inclusions.length > 0
        ? `
      <div style="flex: 1; border: 1px solid #bbf7d0; background: #f0fdf4; padding: 16px; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 13px;">✓ Package Inclusions</h4>
        <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #374151;">
          ${inclusions.map((inc) => `<li style="margin-bottom: 4px;">${inc}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }
    ${
      exclusions.length > 0
        ? `
      <div style="flex: 1; border: 1px solid #fecaca; background: #fef2f2; padding: 16px; border-radius: 8px;">
        <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px;">✕ Package Exclusions</h4>
        <ul style="margin: 0; padding-left: 16px; font-size: 12px; color: #374151;">
          ${exclusions.map((exc) => `<li style="margin-bottom: 4px;">${exc}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  <!-- 6. INVESTMENT & PRICING -->
  <div class="price-box avoid-break">
    <div>
      <div style="font-size: 11px; text-transform: uppercase; color: #93c5fd; font-weight: 600;">Total Package Investment</div>
      <div style="font-size: 32px; font-weight: 800; font-family: monospace; margin: 4px 0;">${priceDisplay}</div>
      <div style="font-size: 12px; color: #cbd5e1; text-transform: capitalize;">Basis: ${pricing.basis.replace(/_/g, " ")}</div>
    </div>
    <div style="text-align: right; font-size: 12px; color: #e2e8f0; line-height: 1.6;">
      <div><strong>GST:</strong> ${pricing.gstMode === "inclusive" ? `5% Inclusive (₹ ${pricing.gstAmountFormatted})` : pricing.gstMode === "extra" ? `5% Extra (₹ ${pricing.gstAmountFormatted})` : "Included in price"}</div>
      <div><strong>SAC Code:</strong> ${pricing.sacCode || "998552"} (Tour Operator)</div>
      ${pricing.validUntil ? `<div style="color: #fde047; font-weight: bold;">⏳ Offer Valid Till: ${pricing.validUntil}</div>` : ""}
    </div>
  </div>
  <div style="font-size: 10px; color: #94a3b8; font-style: italic; text-align: center; margin-top: 6px;">
    * Computer-generated official travel quote. Subject to room availability at the time of booking.
  </div>

  <!-- 7. TERMS & CANCELLATION (Hidden if both empty) -->
  ${
    terms.payment.length > 0 || terms.cancellation.length > 0
      ? `
  <div class="avoid-break" style="margin-top: 24px; padding: 18px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #0f172a; text-transform: uppercase;">Booking & Cancellation Policies</h4>
    ${
      terms.payment.length > 0
        ? `
      <div style="margin-bottom: 12px;">
        <strong style="font-size: 12px; color: #475569;">Payment Milestones:</strong>
        <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 12px; color: #64748b;">
          ${terms.payment.map((p) => `<li>${p}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }
    ${
      terms.cancellation.length > 0
        ? `
      <div>
        <strong style="font-size: 12px; color: #475569;">Cancellation Slabs:</strong>
        <table class="table-custom" style="margin-top: 6px;">
          <thead><tr><th>Cancellation Window</th><th>Retention Charge</th></tr></thead>
          <tbody>
            ${terms.cancellation
              .map(
                (c) => `
              <tr><td>${c.window}</td><td style="color: #b91c1c; font-weight: 600;">${c.charge}</td></tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  <!-- 8. BACK PAGE & CREDITS -->
  <div class="footer-bar avoid-break">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 800; font-size: 14px; color: #ef4444; margin-bottom: 2px;">TRIPPYGO HOLIDAYS</div>
        <div>GSTIN: 27AABCT1234D1Z5 | SAC: 998552 | trippygo.com</div>
      </div>
      <div style="text-align: right;">
        <div style="color: white; font-weight: 600;">${salesperson?.name || "Concierge Specialist"}</div>
        <div>📞 ${salesperson?.phone || "+91 98765 43210"}</div>
        <div>✉️ ${salesperson?.email || "quotes@trippygo.com"}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function runFixturesVerification() {
  console.log("=== PHASE 5 VERIFICATION: RENDERING 8 EDGE-CASE FIXTURES ===\n");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  const results: Array<{ id: string; name: string; sizeKb: number; status: string; path: string }> = [];

  try {
    for (const fixture of FIXTURES_LIST) {
      console.log(`Rendering fixture: [${fixture.id}] ${fixture.name}...`);
      const clientView = computeClientView(fixture.data);
      const html = generateTemplateHtml(clientView);

      const context = await browser.newContext({
        viewport: { width: 1200, height: 1600 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      await page.setContent(html, { waitUntil: "networkidle" });
      await page.emulateMedia({ media: "print" });

      const pdfUint8 = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="font-size: 8px; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; padding: 0 10mm; display: flex; justify-content: space-between; align-items: center;">
            <span>TrippyGo Holidays • Official Travel Proposal</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>
        `,
        margin: { top: "10mm", bottom: "12mm", left: "8mm", right: "8mm" },
      });

      await context.close();

      const outputPath = path.join(FIXTURES_DIR, `${fixture.id}.pdf`);
      fs.writeFileSync(outputPath, Buffer.from(pdfUint8));

      const stats = fs.statSync(outputPath);
      const sizeKb = Number((stats.size / 1024).toFixed(1));

      // Validate PDF header (%PDF-) and minimum viable length
      const header = fs.readFileSync(outputPath, { encoding: "utf8", flag: "r" }).slice(0, 5);
      const isValidPdf = header === "%PDF-" && stats.size > 8000;

      if (!isValidPdf) {
        throw new Error(`Generated file ${fixture.id}.pdf is invalid or too small (${stats.size} bytes)`);
      }

      results.push({
        id: fixture.id,
        name: fixture.name,
        sizeKb,
        status: "PASS",
        path: outputPath,
      });

      console.log(`  -> Generated ${outputPath} (${sizeKb} KB) [VALID A4 PDF]`);
    }
  } finally {
    await browser.close();
  }

  console.log("\n--- FIXTURES VERIFICATION SUMMARY ---");
  for (const r of results) {
    console.log(`[${r.status}] ${r.id.padEnd(28)} | ${r.sizeKb.toString().padStart(6)} KB | ${r.name}`);
  }

  console.log(`\nALL ${results.length}/8 TEST FIXTURES SUCCESSFULLY RENDERED & VALIDATED!`);
}

runFixturesVerification().catch((err) => {
  console.error("FATAL: Error in runFixturesVerification:", err);
  process.exit(1);
});
