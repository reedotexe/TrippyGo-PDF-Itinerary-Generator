import { Markup } from "./schema/itinerary";

export type RoundingRule = "nearest_rupee" | "nearest_50" | "nearest_100";

export interface PricingCalculationOptions {
  roundingRule?: RoundingRule;
  minMarginFloor?: number;
  tcsEnabled?: boolean;
}

export interface PricingCalculationResult {
  netAmountPaise: number;
  markupPaise: number;
  marginPercent: number;
  baseSellingPricePaise: number;
  baseSellingPriceRupees: number;
  baseSellingPriceFormatted: string;
  gstMode: "inclusive" | "extra" | "hidden";
  gstRate: number;
  gstAmountPaise: number;
  gstAmountRupees: number;
  gstAmountFormatted: string;
  finalClientPricePaise: number;
  finalClientPriceRupees: number;
  finalClientPriceFormatted: string;
  tcsEnabled: boolean;
  tcsDisclaimer: string | null;
  sacCode: string;
  isLowMargin: boolean;
  minMarginFloor: number;
}

/**
 * Compute the agency markup in integer paise.
 */
export function computeMarkupPaise(netPaise: number, markup: Markup): number {
  if (netPaise <= 0) return 0;
  if (markup.type === "percent") {
    return Math.round((netPaise * markup.value) / 100);
  }
  return markup.valuePaise;
}

/**
 * Apply rounding rule once at the final selling price step.
 * - nearest_rupee: round to nearest rupee (100 paise)
 * - nearest_50: round up to nearest 50 rupees (5,000 paise)
 * - nearest_100: round up to nearest 100 rupees (10,000 paise)
 */
export function applyRounding(paise: number, rule: RoundingRule = "nearest_rupee"): number {
  if (paise <= 0) return 0;
  switch (rule) {
    case "nearest_50":
      return Math.ceil(paise / 5000) * 5000;
    case "nearest_100":
      return Math.ceil(paise / 10000) * 10000;
    case "nearest_rupee":
    default:
      return Math.round(paise / 100) * 100;
  }
}

/**
 * Compute base selling price in integer paise.
 * Base selling price = net cost + markup, with rounding applied once.
 */
export function computeSellingPricePaise(
  netPaise: number,
  markup: Markup,
  roundingRule: RoundingRule = "nearest_rupee"
): number {
  if (netPaise <= 0) return 0;
  const markupPaise = computeMarkupPaise(netPaise, markup);
  const rawSellingPrice = netPaise + markupPaise;
  return applyRounding(rawSellingPrice, roundingRule);
}

/**
 * Compute agency margin percentage: (markup / net) * 100.
 */
export function computeMarginPercent(netPaise: number, markup: Markup): number {
  if (netPaise <= 0) return 0;
  if (markup.type === "percent") {
    return markup.value;
  }
  return Number(((markup.valuePaise / netPaise) * 100).toFixed(2));
}

/**
 * Compute GST in paise based on GST mode.
 * - inclusive: tax backed out from selling price
 * - extra: tax added on top of selling price
 * - hidden: zero broken-out tax
 */
export function computeGstPaise(
  sellingPricePaise: number,
  ratePercent: number,
  gstMode: "inclusive" | "extra" | "hidden" = "inclusive"
): number {
  if (sellingPricePaise <= 0 || ratePercent <= 0) return 0;

  if (gstMode === "inclusive") {
    return Math.round(sellingPricePaise - sellingPricePaise / (1 + ratePercent));
  }
  if (gstMode === "extra") {
    return Math.round(sellingPricePaise * ratePercent);
  }
  return 0;
}

/**
 * Format integer paise into Indian currency with symbol (e.g. ₹1,25,000)
 */
export function formatInr(paise: number): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format integer paise into Indian numbers without currency symbol (e.g. 1,25,000)
 */
export function formatInrBare(paise: number): string {
  const rupees = Math.round(paise / 100);
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Passenger weighting units based on standard tour pricing conventions:
 * - Adult: 1.0
 * - Child with bed: 0.70
 * - Child without bed: 0.40
 * - Infant: 0.00
 */
export function computeTravellerUnits(travellers: {
  adults: number;
  childrenWithBed?: number;
  childrenWithoutBed?: number;
  infants?: number;
}): number {
  const adults = travellers.adults || 0;
  const cwb = travellers.childrenWithBed || 0;
  const cnb = travellers.childrenWithoutBed || 0;
  return adults * 1.0 + cwb * 0.7 + cnb * 0.4;
}

/**
 * Check if the current margin falls below the agency safety floor (e.g. 8%)
 */
export function isMarginBelowFloor(marginPercent: number, minFloor: number = 8): boolean {
  return marginPercent < minFloor;
}

/**
 * Master pricing engine: takes net cost, markup, and tax settings, returning a clean immutable calculation.
 */
export function calculatePricingBreakdown(
  netPaise: number,
  markup: Markup,
  gstMode: "inclusive" | "extra" | "hidden",
  gstRate: number = 0.05,
  sacCode: string = "998552",
  options: PricingCalculationOptions = {}
): PricingCalculationResult {
  const roundingRule = options.roundingRule || "nearest_rupee";
  const minFloor = options.minMarginFloor ?? 8;
  const tcsEnabled = options.tcsEnabled ?? false;

  const markupPaise = computeMarkupPaise(netPaise, markup);
  const marginPercent = computeMarginPercent(netPaise, markup);
  const baseSellingPricePaise = computeSellingPricePaise(netPaise, markup, roundingRule);

  const gstAmountPaise = computeGstPaise(baseSellingPricePaise, gstRate, gstMode);

  let finalClientPricePaise = baseSellingPricePaise;
  if (gstMode === "extra") {
    finalClientPricePaise = baseSellingPricePaise + gstAmountPaise;
  }

  const baseSellingPriceRupees = Math.round(baseSellingPricePaise / 100);
  const gstAmountRupees = Math.round(gstAmountPaise / 100);
  const finalClientPriceRupees = Math.round(finalClientPricePaise / 100);

  const isLowMargin = isMarginBelowFloor(marginPercent, minFloor);

  const tcsDisclaimer = tcsEnabled
    ? "TCS @ applicable rates under Sec 206C to be collected separately"
    : null;

  return {
    netAmountPaise: netPaise,
    markupPaise,
    marginPercent,
    baseSellingPricePaise,
    baseSellingPriceRupees,
    baseSellingPriceFormatted: formatInrBare(baseSellingPricePaise),
    gstMode,
    gstRate,
    gstAmountPaise,
    gstAmountRupees,
    gstAmountFormatted: formatInrBare(gstAmountPaise),
    finalClientPricePaise,
    finalClientPriceRupees,
    finalClientPriceFormatted: formatInrBare(finalClientPricePaise),
    tcsEnabled,
    tcsDisclaimer,
    sacCode,
    isLowMargin,
    minMarginFloor: minFloor,
  };
}
