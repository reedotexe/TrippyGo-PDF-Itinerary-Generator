import fs from "fs";
import path from "path";
import { extractItinerary } from "../src/lib/extraction/client";
import { ItinerarySchema } from "../src/lib/schema/itinerary";
import { validateItinerary } from "../src/lib/schema/validate";

interface TestScore {
  filename: string;
  days: number;
  priceRupees: number;
  hotelsFound: number;
  cancellationRows: number;
  reviewFlagsCount: number;
  schemaValid: boolean;
  score: number; // 0 - 100
}

async function runExtractionHarness() {
  const fixturesDir = path.join(__dirname, "..", "sample-itineraries");
  const files = fs
    .readdirSync(fixturesDir)
    .filter((f) => f.endsWith(".txt"))
    .sort();

  console.log(`\n======================================================`);
  console.log(`  TRIPPYGO EXTRACTION PIPELINE TEST HARNESS`);
  console.log(`  Evaluating ${files.length} Supplier Itineraries`);
  console.log(`======================================================\n`);

  const results: TestScore[] = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const fullPath = path.join(fixturesDir, filename);
    const text = fs.readFileSync(fullPath, "utf8");

    process.stdout.write(`[${i + 1}/${files.length}] Processing: ${filename}... `);

    const extraction = await extractItinerary({
      text,
      filename,
      sourceFileKey: `fixtures/${filename}`,
    });

    const itinerary = extraction.itinerary;

    // 1. Schema Validation
    const validation = validateItinerary(itinerary);
    const schemaValid = validation.success || (validation.data !== undefined);

    // 2. Count metrics
    const days = itinerary.days.length;
    const priceRupees = Math.round(itinerary.pricing.netAmountPaise / 100);
    const hotelsFound = itinerary.days.filter((d) => d.stay?.hotel).length;
    const cancellationRows = itinerary.terms.cancellation.length;
    const reviewFlagsCount = itinerary.meta.reviewFlags.length;

    // Calculate quality score
    let score = 0;
    if (schemaValid) score += 30;
    if (days >= 2) score += 25;
    if (priceRupees > 0) score += 25;
    if (hotelsFound > 0) score += 10;
    if (cancellationRows > 0) score += 10;

    results.push({
      filename,
      days,
      priceRupees,
      hotelsFound,
      cancellationRows,
      reviewFlagsCount,
      schemaValid,
      score,
    });

    console.log(`Score: ${score}/100 | Days: ${days} | Price: ₹${priceRupees.toLocaleString("en-IN")}`);
  }

  // Print Summary Table
  console.log("\n=========================================================================================");
  console.log(
    "| No. | File Name                                      | Days | Price (₹)   | Hotels | Cancel | Flags | Score |"
  );
  console.log("-----------------------------------------------------------------------------------------");

  let totalScore = 0;
  let allValid = true;

  results.forEach((r, idx) => {
    totalScore += r.score;
    if (!r.schemaValid) allValid = false;

    const numStr = String(idx + 1).padStart(2, " ");
    const nameStr = r.filename.padEnd(46, " ").slice(0, 46);
    const dayStr = String(r.days).padStart(4, " ");
    const priceStr = String(r.priceRupees.toLocaleString("en-IN")).padStart(11, " ");
    const hotelStr = String(r.hotelsFound).padStart(6, " ");
    const cancelStr = String(r.cancellationRows).padStart(6, " ");
    const flagStr = String(r.reviewFlagsCount).padStart(5, " ");
    const scoreStr = `${r.score}%`.padStart(5, " ");

    console.log(`| ${numStr}  | ${nameStr} | ${dayStr} | ${priceStr} | ${hotelStr} | ${cancelStr} | ${flagStr} | ${scoreStr} |`);
  });

  const avgScore = (totalScore / results.length).toFixed(1);
  console.log("=========================================================================================");
  console.log(`Summary: Processed ${results.length} files | Average Quality Score: ${avgScore}% | Schema Valid: ${allValid ? "YES (100%)" : "NO"}`);
  console.log("=========================================================================================\n");

  if (!allValid) {
    console.error("Test harness failed: Some itineraries did not conform to schema.");
    process.exit(1);
  }
}

runExtractionHarness().catch((err) => {
  console.error("Fatal error in test harness:", err);
  process.exit(1);
});
