import { FlightLeg, Itinerary, ItineraryDay, Pricing } from "./itinerary";
import {
  calculatePricingBreakdown,
  formatInrBare,
  formatInr,
} from "@/lib/pricing";
import { computeTripDates } from "@/lib/utils/dates";

export interface ClientPricingView {
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
      rooms: number;
    };
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
    },
    flights: itinerary.flights || [],
    days: clientDays,
    inclusions: itinerary.inclusions,
    exclusions: itinerary.exclusions,
    pricing: {
      currency,
      basis,
      basePricePaise: breakdown.baseSellingPricePaise,
      basePriceRupees: breakdown.baseSellingPriceRupees,
      basePriceFormatted: breakdown.baseSellingPriceFormatted,
      gstMode: breakdown.gstMode,
      gstRate: breakdown.gstRate,
      gstAmountPaise: breakdown.gstAmountPaise,
      gstAmountRupees: breakdown.gstAmountRupees,
      gstAmountFormatted: breakdown.gstAmountFormatted,
      finalPricePaise: breakdown.finalClientPricePaise,
      finalPriceRupees: breakdown.finalClientPriceRupees,
      finalPriceFormatted: breakdown.finalClientPriceFormatted,
      validUntil,
      sacCode: breakdown.sacCode,
      tcsDisclaimer: breakdown.tcsDisclaimer,
    },
    terms: itinerary.terms,
    salesperson: itinerary.salesperson,
  };
}
