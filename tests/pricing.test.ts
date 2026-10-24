import {
  computeMarkupPaise,
  applyRounding,
  computeSellingPricePaise,
  computeMarginPercent,
  computeGstPaise,
  formatInr,
  formatInrBare,
  computeTravellerUnits,
  isMarginBelowFloor,
  calculatePricingBreakdown,
} from "../src/lib/pricing";

export function runPricingUnitTests() {
  console.log("--- UNIT TEST SUITE: PRICING LOGIC ---");

  // 1. Zero markup
  const zeroMarkup = computeMarkupPaise(5000000, { type: "percent", value: 0 });
  if (zeroMarkup !== 0) throw new Error(`Expected zero markup, got ${zeroMarkup}`);

  const zeroFlat = computeMarkupPaise(5000000, { type: "flat", valuePaise: 0 });
  if (zeroFlat !== 0) throw new Error(`Expected zero flat markup, got ${zeroFlat}`);

  // 2. 100% markup
  const hundredMarkup = computeMarkupPaise(5000000, { type: "percent", value: 100 });
  if (hundredMarkup !== 5000000) throw new Error(`Expected 100% markup 5000000, got ${hundredMarkup}`);

  // 3. Rounding at threshold boundaries
  // 50,049 paise -> nearest rupee rounds down to 50,000 paise; 50,050 paise rounds up to 50,100 paise
  if (applyRounding(50049, "nearest_rupee") !== 50000) throw new Error("Nearest rupee floor failed");
  if (applyRounding(50050, "nearest_rupee") !== 50100) throw new Error("Nearest rupee ceil failed");

  // Nearest 50 threshold: 50,001 paise (₹500.01) -> ₹550 = 55,000 paise
  if (applyRounding(50001, "nearest_50") !== 55000) throw new Error("Nearest 50 ceil failed");

  // Nearest 100 threshold: 50,001 paise (₹500.01) -> ₹600 = 60,000 paise
  if (applyRounding(50001, "nearest_100") !== 60000) throw new Error("Nearest 100 ceil failed");

  // 4. Indian number formatting
  if (formatInrBare(10000000) !== "1,00,000") throw new Error("Expected 1 lakh formatting '1,00,000'");
  if (formatInrBare(1000000000) !== "1,00,00,000") throw new Error("Expected 1 crore formatting '1,00,00,000'");

  // 5. Margin floor check
  if (!isMarginBelowFloor(7.99, 8)) throw new Error("7.99% must be below floor 8%");
  if (isMarginBelowFloor(8.0, 8)) throw new Error("8.00% must NOT be below floor 8%");

  console.log("PASS: All pricing unit tests passed.\n");
}

if (require.main === module) {
  runPricingUnitTests();
}
