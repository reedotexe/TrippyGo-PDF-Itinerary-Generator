import { FlightLeg, Itinerary, ItineraryDay, ItineraryImage, Pricing } from "./itinerary";
import {
  calculatePricingBreakdown,
  computeMarkupPaise,
  computeGstPaise,
  formatInrBare,
  formatInr,
} from "@/lib/pricing";
import { computeTripDates } from "@/lib/utils/dates";

export interface ClientPriceItem {
  key: string;
  title: string;
  subtitle: string;
  amountPaise: number;
  amountRupees: number;
  amountFormatted: string;
  splitAmountRupees: number;
  splitAmountFormatted: string;
  category: "flight" | "land" | "hotel" | "visa" | "package";
}

export interface ClientPriceBreakupItem {
  amountPaise: number;
  amountRupees: number;
  amountFormatted: string;
  included: boolean;
  note: string;
}

export interface ClientPriceBreakup {
  flight: ClientPriceBreakupItem;
  hotel: ClientPriceBreakupItem;
  landPart: ClientPriceBreakupItem;
  visa: ClientPriceBreakupItem;
  hasItemizedAmounts: boolean;
  totalBreakupPaise: number;
}

export interface ClientPricingView {
  pricingType: "supplier" | "custom" | "total_only";
  priceDistribution: "total" | "per_passenger";
  passengerCount: number;
  currency: string;
  basis: Pricing["basis"];
  basePricePaise: number;
  basePriceRupees: number;
  basePriceFormatted: string;
  gstMode: Pricing["gstMode"];
  gstRate: number;
  gstAmountPaise: number;
  gstAmountRupees: number;
  gstAmountFormatted: string;
  finalPricePaise: number;
  finalPriceRupees: number;
  finalPriceFormatted: string;
  validUntil: string | null;
  sacCode: string;
  tcsDisclaimer: string | null;
  items: ClientPriceItem[];
  breakup: ClientPriceBreakup;
}

export interface ClientDayView extends Omit<ItineraryDay, "imageQuery"> {
  calendarDate: string | null; // e.g. "10 Dec 2026"
  weekday: string | null;      // e.g. "Thursday"
  fullDateLabel: string | null; // e.g. "10 Dec 2026, Thursday"
}

export interface ClientItineraryView {
  schemaVersion: 1;
  package: {
    title: string;
    destinations: string[];
    nights: number;
    days: number;
    startDate: string | null;
    endDate: string | null;
    travellers: {
      adults: number;
      children: number;
      infants?: number;
      rooms: number;
    };
    guestName?: string;
    coverImage?: ItineraryImage | null;
  };
  flights: FlightLeg[];
  days: ClientDayView[];
  inclusions: string[];
  exclusions: string[];
  pricing: ClientPricingView;
  terms: Itinerary["terms"];
  salesperson?: Itinerary["salesperson"];
}

/**
 * Format a rupee amount into Indian number format (e.g., 1,50,000)
 */
export function formatIndianRupees(rupees: number): string {
  return formatInrBare(rupees * 100);
}

/**
 * Strip confidential supplier net rate, markup, and internal meta before template render
 */
export function computeClientView(itinerary: Itinerary): ClientItineraryView {
  const { netAmountPaise, markup, gstMode, gstRate, basis, currency, sacCode, validityDays } =
    itinerary.pricing;

  // Compute pricing via pure pricing engine
  const breakdown = calculatePricingBreakdown(
    netAmountPaise,
    markup,
    gstMode,
    gstRate,
    sacCode
  );

  // Compute Calendar Dates, End Date & Quote Validity via Centralized Timezone-Aware Engine
  const tripDates = computeTripDates({
    startDate: itinerary.package.startDate,
    daysCount: itinerary.days.length,
    nights: itinerary.package.nights,
    validityDays: validityDays || 7,
  });

  const validUntil = tripDates.validUntilFormatted;
  const endDate = tripDates.endDateFormatted;

  const clientDays: ClientDayView[] = itinerary.days.map((d, index) => {
    // Strip imageQuery from public client view
    const { imageQuery, ...restDay } = d;
    const computedDay = tripDates.days[index];

    return {
      ...restDay,
      calendarDate: computedDay?.calendarDate || null,
      weekday: computedDay?.weekday || null,
      fullDateLabel: computedDay?.fullDateLabel || null,
    };
  });

  // -------------------------------------------------------------
  // Commercial Pricing & Package Price Breakup (Supplier vs Custom)
  // -------------------------------------------------------------
  const pricingType = itinerary.pricing.pricingType || "supplier";
  const priceDistribution = itinerary.pricing.priceDistribution || "total";
  const passengerCount = Math.max(
    1,
    (itinerary.package.travellers?.adults || 0) + (itinerary.package.travellers?.children || 0) || 2
  );

  const makePriceItem = (
    key: string,
    title: string,
    subtitle: string,
    amountPaise: number,
    category: ClientPriceItem["category"]
  ): ClientPriceItem => {
    const amountRupees = Math.round(amountPaise / 100);
    const splitAmountPaise = Math.round(amountPaise / passengerCount);
    const splitAmountRupees = Math.round(splitAmountPaise / 100);

    return {
      key,
      title,
      subtitle,
      amountPaise,
      amountRupees,
      amountFormatted: formatInrBare(amountPaise),
      splitAmountRupees,
      splitAmountFormatted: formatInrBare(splitAmountPaise),
      category,
    };
  };

  let basePricePaise = 0;
  const clientItems: ClientPriceItem[] = [];

  if (pricingType === "supplier") {
    // 1. Supplier Itinerary (DMC Quote + Agency Markup + Optional Flight)
    const sb = itinerary.pricing.supplierBreakup || {
      supplierCostPaise: netAmountPaise,
      flightIncluded: false,
      flightCostPaise: 0,
      flightNote: "",
      landNote: "Complete land package, accommodations, transfers & sightseeing",
    };

    const supplierCostPaise =
      (sb.supplierCostPaise || 0) > 0 ? sb.supplierCostPaise : (netAmountPaise || 0);
    const landMarkupPaise = computeMarkupPaise(supplierCostPaise, markup);
    const landSellingPricePaise = supplierCostPaise + landMarkupPaise;

    const flightIncluded = Boolean(sb.flightIncluded);
    const flightCostPaise = flightIncluded ? (sb.flightCostPaise || 0) : 0;
    const flightNote = sb.flightNote || "";
    const landNote = sb.landNote || "Complete land package, accommodations, transfers & sightseeing";

    basePricePaise = landSellingPricePaise + flightCostPaise;

    if (flightIncluded && flightCostPaise > 0) {
      clientItems.push(
        makePriceItem(
          "flight",
          "Flight",
          flightNote || "Return airfare & scheduled flights with baggage",
          flightCostPaise,
          "flight"
        )
      );
      clientItems.push(
        makePriceItem(
          "landPart",
          "Land Package",
          landNote,
          landSellingPricePaise,
          "land"
        )
      );
    } else {
      clientItems.push(
        makePriceItem(
          "landPart",
          "Tour Package",
          landNote,
          landSellingPricePaise,
          "land"
        )
      );
    }
  } else if (pricingType === "total_only") {
    // 3. Total Package Price Only (Single Lump Sum, No Breakup, Zero Markup)
    basePricePaise =
      itinerary.pricing.totalPackagePricePaise ||
      itinerary.pricing.netAmountPaise ||
      0;
    // clientItems remains strictly empty [] - no breakup components!
  } else {
    // 2. Custom Made Itinerary (Itemized by Us: Flight, Land Part, Hotel, Visa)
    const cb = itinerary.pricing.customBreakup || {
      flight: { included: false, amountPaise: 0, note: "" },
      landPart: { included: true, amountPaise: 0, note: "" },
      hotel: { included: true, amountPaise: 0, note: "" },
      visa: { included: false, amountPaise: 0, note: "" },
    };

    // STRICT RULE: Only add components where included === true AND amountPaise > 0
    // Excluded or unpriced components are NEVER shown to the end customer!
    if (cb.flight?.included && (cb.flight.amountPaise || 0) > 0) {
      clientItems.push(
        makePriceItem(
          "flight",
          "Flight",
          cb.flight.note || "Return airfare, scheduled flights & taxes",
          cb.flight.amountPaise,
          "flight"
        )
      );
    }

    if (cb.hotel?.included && (cb.hotel.amountPaise || 0) > 0) {
      clientItems.push(
        makePriceItem(
          "hotel",
          "Hotel",
          cb.hotel.note || "Handpicked luxury stays & boutique accommodations",
          cb.hotel.amountPaise,
          "hotel"
        )
      );
    }

    if (cb.landPart?.included && (cb.landPart.amountPaise || 0) > 0) {
      clientItems.push(
        makePriceItem(
          "landPart",
          "Land Part",
          cb.landPart.note || "Private transfers, sightseeing, excursions & guide",
          cb.landPart.amountPaise,
          "land"
        )
      );
    }

    if (cb.visa?.included && (cb.visa.amountPaise || 0) > 0) {
      clientItems.push(
        makePriceItem(
          "visa",
          "Visa",
          cb.visa.note || "Tourist visa assistance, consular fees & documentation support",
          cb.visa.amountPaise,
          "visa"
        )
      );
    }

    basePricePaise = clientItems.reduce((sum, item) => sum + item.amountPaise, 0);

    // Backward-compatibility fallback: if custom breakup was completely empty, use net amount + markup
    if (basePricePaise === 0 && (netAmountPaise || 0) > 0) {
      const mk = computeMarkupPaise(netAmountPaise, markup);
      basePricePaise = netAmountPaise + mk;
      clientItems.push(
        makePriceItem(
          "package",
          "Tour Package",
          "Complete travel package and accommodations",
          basePricePaise,
          "package"
        )
      );
    }
  }

  // Direct final client investment (all-inclusive direct rates, zero GST markup)
  const gstAmountPaise = 0;
  const finalPricePaise = basePricePaise;

  // Backward compatibility object for legacy tests & consumers
  const rawBreakup = itinerary.pricing.breakup || {
    flight: { amountPaise: 0, included: true, note: "" },
    hotel: { amountPaise: 0, included: true, note: "" },
    landPart: { amountPaise: 0, included: true, note: "" },
    visa: { amountPaise: 0, included: true, note: "" },
  };

  const formatBreakupItem = (item?: { amountPaise?: number; included?: boolean; note?: string }): ClientPriceBreakupItem => {
    const amountPaise = item?.amountPaise || 0;
    const amountRupees = Math.round(amountPaise / 100);
    return {
      amountPaise,
      amountRupees,
      amountFormatted: formatInrBare(amountPaise),
      included: item?.included ?? true,
      note: item?.note || "",
    };
  };

  const clientBreakup: ClientPriceBreakup = {
    flight: formatBreakupItem(rawBreakup.flight),
    hotel: formatBreakupItem(rawBreakup.hotel),
    landPart: formatBreakupItem(rawBreakup.landPart),
    visa: formatBreakupItem(rawBreakup.visa),
    hasItemizedAmounts:
      (rawBreakup.flight?.amountPaise || 0) > 0 ||
      (rawBreakup.hotel?.amountPaise || 0) > 0 ||
      (rawBreakup.landPart?.amountPaise || 0) > 0 ||
      (rawBreakup.visa?.amountPaise || 0) > 0,
    totalBreakupPaise:
      (rawBreakup.flight?.amountPaise || 0) +
      (rawBreakup.hotel?.amountPaise || 0) +
      (rawBreakup.landPart?.amountPaise || 0) +
      (rawBreakup.visa?.amountPaise || 0),
  };

  return {
    schemaVersion: 1,
    package: {
      title: itinerary.package.title,
      destinations: itinerary.package.destinations,
      nights: itinerary.package.nights,
      days: itinerary.package.days,
      startDate: itinerary.package.startDate,
      endDate,
      travellers: itinerary.package.travellers,
      guestName: itinerary.package.guestName,
      coverImage: itinerary.package.coverImage || null,
    },
    flights: itinerary.flights || [],
    days: clientDays,
    inclusions: itinerary.inclusions,
    exclusions: itinerary.exclusions,
    pricing: {
      pricingType,
      priceDistribution,
      passengerCount,
      currency,
      basis,
      basePricePaise,
      basePriceRupees: Math.round(basePricePaise / 100),
      basePriceFormatted: formatInrBare(basePricePaise),
      gstMode: "hidden",
      gstRate: 0,
      gstAmountPaise: 0,
      gstAmountRupees: 0,
      gstAmountFormatted: "0",
      finalPricePaise,
      finalPriceRupees: Math.round(finalPricePaise / 100),
      finalPriceFormatted: formatInrBare(finalPricePaise),
      validUntil,
      sacCode: sacCode || "998552",
      tcsDisclaimer: breakdown.tcsDisclaimer,
      items: clientItems,
      breakup: clientBreakup,
    },
    terms: itinerary.terms,
    salesperson: itinerary.salesperson,
  };
}
