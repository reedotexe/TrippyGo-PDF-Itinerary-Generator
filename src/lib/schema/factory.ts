import { Itinerary } from "./itinerary";

/**
 * Creates an initial/blank default itinerary structure for manual review or new creation.
 */
export function createEmptyFallbackItinerary(sourceFile: string = "unnamed_source"): Itinerary {
  return {
    schemaVersion: 1,
    package: {
      title: "New Itinerary (Manual Review)",
      destinations: ["Destination"],
      nights: 3,
      days: 4,
      startDate: null,
      travellers: { adults: 2, children: 0, infants: 0, rooms: 1 },
      guestName: "",
      coverImage: null,
    },
    days: [
      {
        dayNumber: 1,
        title: "Day 1 - Arrival & Leisure",
        description: "Arrival at destination and hotel check-in.",
        activities: [],
        meals: ["Dinner"],
        stay: { hotel: null, city: null, roomType: null },
        imageQuery: "Scenic landscape",
        image: null,
      },
    ],
    flights: [],
    inclusions: [],
    exclusions: ["Airfare", "Personal expenses"],
    pricing: {
      pricingType: "supplier",
      priceDistribution: "total",
      currency: "INR",
      basis: "per_person_twin_sharing",
      netAmountPaise: 0,
      totalPackagePricePaise: 0,
      markup: { type: "percent", value: 15 },
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
      supplierBreakup: {
        supplierCostPaise: 0,
        flightIncluded: false,
        flightCostPaise: 0,
        flightNote: "",
        landNote: "Complete land package, accommodations, transfers & sightseeing",
      },
      customBreakup: {
        flight: { amountPaise: 0, included: false, note: "" },
        hotel: { amountPaise: 0, included: true, note: "" },
        landPart: { amountPaise: 0, included: true, note: "" },
        visa: { amountPaise: 0, included: false, note: "" },
      },
      breakup: {
        flight: { amountPaise: 0, included: true, note: "" },
        hotel: { amountPaise: 0, included: true, note: "" },
        landPart: { amountPaise: 0, included: true, note: "" },
        visa: { amountPaise: 0, included: true, note: "" },
      },
    },
    terms: {
      payment: ["25% advance to confirm booking", "Balance 15 days before travel"],
      cancellation: [
        { window: "> 30 days prior", charge: "10% processing fee" },
        { window: "15-30 days prior", charge: "50% package cost" },
        { window: "< 15 days prior", charge: "100% non-refundable" },
      ],
    },
    meta: {
      sourceFile,
      extractedBy: "manual_fallback",
      reviewFlags: [
        {
          field: "pricing.netAmountPaise",
          issue: "Automatic extraction failed or was skipped. Please verify all details manually beside the source file.",
          severity: "warning",
        },
      ],
      extractedSnapshot: null,
      tokenUsage: null,
    },
    variants: [],
  };
}
