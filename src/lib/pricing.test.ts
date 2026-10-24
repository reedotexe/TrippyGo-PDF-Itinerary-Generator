import assert from "node:assert/strict";
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
} from "./pricing";

console.log("=== RUNNING PRICING ENGINE COMPREHENSIVE UNIT TEST SUITE ===\n");

// -------------------------------------------------------------
// 1. Markup Calculation Tests
// -------------------------------------------------------------
console.log("[Test 1] computeMarkupPaise formulas & edge cases...");
// 1a. Standard percent markup
const net = 5000000; // ₹50,000
assert.equal(computeMarkupPaise(net, { type: "percent", value: 15 }), 750000); // ₹7,500
assert.equal(computeMarkupPaise(net, { type: "percent", value: 10 }), 500000); // ₹5,000

// 1b. Flat markup in paise
assert.equal(computeMarkupPaise(net, { type: "flat", valuePaise: 450000 }), 450000); // ₹4,500

// 1c. Zero markup edge cases
assert.equal(computeMarkupPaise(net, { type: "percent", value: 0 }), 0);
assert.equal(computeMarkupPaise(net, { type: "flat", valuePaise: 0 }), 0);

// 1d. 100% markup edge case
assert.equal(computeMarkupPaise(net, { type: "percent", value: 100 }), 5000000); // 100% of 50,000 = 50,000

// 1e. Zero and negative net cost
assert.equal(computeMarkupPaise(0, { type: "percent", value: 15 }), 0);
assert.equal(computeMarkupPaise(-1000, { type: "percent", value: 15 }), 0);
console.log("  -> computeMarkupPaise passed.");

// -------------------------------------------------------------
// 2. Rounding Rules & Threshold Tests
// -------------------------------------------------------------
console.log("[Test 2] applyRounding thresholds & rules...");
// 2a. Nearest Rupee (100 paise)
// < 50 paise rounds down
assert.equal(applyRounding(4949, "nearest_rupee"), 4900);
// >= 50 paise rounds up
assert.equal(applyRounding(4950, "nearest_rupee"), 5000);
assert.equal(applyRounding(4951, "nearest_rupee"), 5000);

// 2b. Nearest 50 (5,000 paise = ₹50)
// Exact multiple remains unchanged
assert.equal(applyRounding(500000, "nearest_50"), 500000); // ₹5,000
// ₹5,001 rounds up to ₹5,050
assert.equal(applyRounding(500100, "nearest_50"), 505000);
// ₹5,049 rounds up to ₹5,050
assert.equal(applyRounding(504900, "nearest_50"), 505000);
// ₹5,051 rounds up to ₹5,100
assert.equal(applyRounding(505100, "nearest_50"), 510000);

// 2c. Nearest 100 (10,000 paise = ₹100)
// Exact multiple remains unchanged
assert.equal(applyRounding(500000, "nearest_100"), 500000); // ₹5,000
// ₹5,001 rounds up to ₹5,100
assert.equal(applyRounding(500100, "nearest_100"), 510000);
// ₹5,099 rounds up to ₹5,100
assert.equal(applyRounding(509900, "nearest_100"), 510000);
// ₹5,101 rounds up to ₹5,200
assert.equal(applyRounding(510100, "nearest_100"), 520000);

// 2d. Zero & negative values
assert.equal(applyRounding(0, "nearest_rupee"), 0);
assert.equal(applyRounding(-500, "nearest_50"), 0);
console.log("  -> applyRounding passed.");

// -------------------------------------------------------------
// 3. Margin Percentage Tests
// -------------------------------------------------------------
console.log("[Test 3] computeMarginPercent calculations...");
assert.equal(computeMarginPercent(5000000, { type: "percent", value: 18 }), 18);
// Flat markup margin %
assert.equal(computeMarginPercent(1000000, { type: "flat", valuePaise: 250000 }), 25);
// Decimal precision in flat markup
assert.equal(computeMarginPercent(3000000, { type: "flat", valuePaise: 400000 }), 13.33);
// Zero net cost
assert.equal(computeMarginPercent(0, { type: "percent", value: 15 }), 0);
console.log("  -> computeMarginPercent passed.");

// -------------------------------------------------------------
// 4. GST Computation across Modes
// -------------------------------------------------------------
console.log("[Test 4] computeGstPaise across inclusive, extra, hidden...");
// 4a. Inclusive (Tax backed out from selling price)
// Selling price ₹105,000 at 5% GST -> GST is ₹5,000 (500,000 paise)
const gstInclusive = computeGstPaise(10500000, 0.05, "inclusive");
assert.equal(gstInclusive, 500000);

// 4b. Extra (Tax added on top of selling price)
// Selling price ₹100,000 at 5% GST -> GST is ₹5,000 (500,000 paise)
const gstExtra = computeGstPaise(10000000, 0.05, "extra");
assert.equal(gstExtra, 500000);

// 4c. Hidden mode
assert.equal(computeGstPaise(10000000, 0.05, "hidden"), 0);

// 4d. Zero selling price or zero rate
assert.equal(computeGstPaise(0, 0.05, "inclusive"), 0);
assert.equal(computeGstPaise(10000000, 0, "extra"), 0);
console.log("  -> computeGstPaise passed.");

// -------------------------------------------------------------
// 5. Indian Number Formatting (Intl.NumberFormat en-IN)
// -------------------------------------------------------------
console.log("[Test 5] Indian number formatting with 3:2 comma placement...");
// ₹1,25,000
const formattedInr = formatInr(12500000);
assert.ok(formattedInr.includes("1,25,000"), `Expected 1,25,000, got ${formattedInr}`);

const formattedBare = formatInrBare(12500000);
assert.equal(formattedBare, "1,25,000");

// 1 Crore = ₹1,00,00,000
const croreBare = formatInrBare(1000000000);
assert.equal(croreBare, "1,00,00,000");

// Zero amount
assert.equal(formatInrBare(0), "0");
console.log("  -> Indian number formatting passed.");

// -------------------------------------------------------------
// 6. Passenger Weighting Units
// -------------------------------------------------------------
console.log("[Test 6] computeTravellerUnits conventions...");
// 2 Adults
assert.equal(computeTravellerUnits({ adults: 2 }), 2.0);

// 2 Adults + 1 CWB (0.7) + 1 CNB (0.4) + 1 Infant (0.0)
const units = computeTravellerUnits({
  adults: 2,
  childrenWithBed: 1,
  childrenWithoutBed: 1,
  infants: 1,
});
assert.equal(Math.round(units * 100) / 100, 3.1);
console.log("  -> computeTravellerUnits passed.");

// -------------------------------------------------------------
// 7. Safety Floor Verification
// -------------------------------------------------------------
console.log("[Test 7] Safety margin floor checks...");
assert.equal(isMarginBelowFloor(7.9, 8), true);
assert.equal(isMarginBelowFloor(8.0, 8), false);
assert.equal(isMarginBelowFloor(12.5, 8), false);
console.log("  -> isMarginBelowFloor passed.");

// -------------------------------------------------------------
// 8. Master Pricing Breakdown
// -------------------------------------------------------------
console.log("[Test 8] calculatePricingBreakdown master integration...");
// Scenario: Net ₹40,000, 15% Markup, GST 5% Extra, Nearest Rupee, TCS On
const breakdown = calculatePricingBreakdown(
  4000000,
  { type: "percent", value: 15 },
  "extra",
  0.05,
  "998552",
  { roundingRule: "nearest_rupee", minMarginFloor: 8, tcsEnabled: true }
);

// Net: 40,000. Markup: 6,000. Base Selling: 46,000. GST: 2,300. Final: 48,300.
assert.equal(breakdown.netAmountPaise, 4000000);
assert.equal(breakdown.markupPaise, 600000);
assert.equal(breakdown.baseSellingPriceRupees, 46000);
assert.equal(breakdown.gstAmountRupees, 2300);
assert.equal(breakdown.finalClientPriceRupees, 48300);
assert.equal(breakdown.finalClientPriceFormatted, "48,300");
assert.equal(breakdown.isLowMargin, false);
assert.equal(breakdown.sacCode, "998552");
assert.ok(breakdown.tcsDisclaimer?.includes("Sec 206C"), "TCS disclosure must be present");

console.log("\nPASS: ALL PRICING FORMULAS & EDGE CASES VERIFIED 100%!\n");
