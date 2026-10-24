import fs from "fs";
import path from "path";
import { extractItinerary } from "../src/lib/extraction/client";

async function main() {
  console.log("=== VERIFYING GOOGLE GEMINI EXTRACTION PIPELINE ===");
  const pdfPath = path.join(process.cwd(), "Refrences/Vietnam Itinerary/Vietnam-HARKIRAN-SINGH-v1.pdf");
  
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Target test PDF not found at ${pdfPath}`);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString("base64");
  console.log(`Loaded PDF: ${pdfPath} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
  console.log("Calling extractItinerary()...");

  const start = Date.now();
  const res = await extractItinerary({
    pdfBase64,
    filename: "Vietnam-HARKIRAN-SINGH-v1.pdf",
    sourceFileKey: "test/vietnam.pdf",
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nExtraction completed in ${elapsed}s:`);
  console.log(`Success: ${res.success}`);
  console.log(`Extracted By: ${res.itinerary.meta?.extractedBy}`);
  console.log(`Package Title: ${res.itinerary.package.title}`);
  console.log(`Destinations: ${res.itinerary.package.destinations.join(", ")}`);
  console.log(`Days Count: ${res.itinerary.days.length}`);
  console.log(`Nights Count: ${res.itinerary.package.nights}`);
  console.log(`Flights Count: ${res.itinerary.flights?.length || 0}`);
  console.log(`Net Price Paise: ${res.itinerary.pricing.netAmountPaise} (₹${(res.itinerary.pricing.netAmountPaise / 100).toLocaleString("en-IN")})`);
  
  console.log("\n--- DAYS SUMMARY ---");
  res.itinerary.days.forEach((d) => {
    console.log(`Day ${d.dayNumber}: ${d.title} [Hotel: ${d.stay?.hotel || "None"}]`);
    console.log(`  Desc: ${d.description.slice(0, 100)}...`);
  });

  if (res.itinerary.flights && res.itinerary.flights.length > 0) {
    console.log("\n--- FLIGHTS SUMMARY ---");
    res.itinerary.flights.forEach((f, i) => {
      console.log(`Flight ${i + 1}: ${f.airline} (${f.flightNumber}) | ${f.departureCode} ${f.departureTime} -> ${f.arrivalCode} ${f.arrivalTime}`);
    });
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
