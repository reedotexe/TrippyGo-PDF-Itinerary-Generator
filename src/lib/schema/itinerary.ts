import { z } from "zod";

/**
 * Travellers Count Schema
 */
export const TravellersSchema = z.object({
  adults: z.number().int().min(1).default(2),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).optional().default(0),
  rooms: z.number().int().min(1).default(1),
});
export type Travellers = z.infer<typeof TravellersSchema>;

/**
 * Photo Attachment Schema
 */
export const ImageSchema = z.object({
  provider: z.enum([
    "unsplash",
    "pexels",
    "wikimedia",
    "openverse",
    "picsum",
    "pixabay",
    "upload",
    "custom",
  ]),
  photoId: z.string().min(1),
  imageUrl: z.string().refine(
    (val) =>
      val.startsWith("http://") ||
      val.startsWith("https://") ||
      val.startsWith("data:image/"),
    { message: "Must be a valid HTTP(S) URL or Data URI" }
  ),
  thumbnailUrl: z
    .string()
    .refine(
      (val) =>
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("data:image/"),
      { message: "Must be a valid HTTP(S) URL or Data URI" }
    )
    .nullable()
    .default(null),
  photographerName: z.string().min(1),
  photographerUrl: z.string().default(""),
  downloadLocation: z.string().nullable().default(null),
});
export type ItineraryImage = z.infer<typeof ImageSchema>;

/**
 * Package Overview Schema
 */
export const PackageSchema = z.object({
  title: z.string().min(1, "Package title is required"),
  destinations: z.array(z.string().min(1)).min(1, "At least one destination is required"),
  nights: z.number().int().min(0, "Nights cannot be negative"),
  days: z.number().int().min(1, "Days must be at least 1"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD")
    .nullable()
    .default(null),
  travellers: TravellersSchema.default({ adults: 2, children: 0, infants: 0, rooms: 1 }),
  guestName: z.string().optional().default(""),
  coverImage: ImageSchema.nullable().optional().default(null),
});
export type Package = z.infer<typeof PackageSchema>;

/**
 * Night Stay Info Schema
 */
export const DayStaySchema = z.object({
  hotel: z.string().nullable().default(null),
  city: z.string().nullable().default(null),
  roomType: z.string().nullable().default(null),
});
export type DayStay = z.infer<typeof DayStaySchema>;

/**
 * Single Day Schema
 */
export const DaySchema = z.object({
  dayNumber: z.number().int().min(1, "Day number must start at 1"),
  title: z.string().min(1, "Day title is required"),
  description: z.string().default(""),
  activities: z.array(z.string()).default([]),
  meals: z.array(z.string()).default([]),
  stay: DayStaySchema.nullable().default(null),
  imageQuery: z.string().default(""),
  image: ImageSchema.nullable().default(null),
});
export type ItineraryDay = z.infer<typeof DaySchema>;

/**
 * Markup Discriminated Union
 */
export const MarkupPercentSchema = z.object({
  type: z.literal("percent"),
  value: z.number().min(0).max(100),
});

export const MarkupFlatSchema = z.object({
  type: z.literal("flat"),
  valuePaise: z.number().int().min(0),
});

export const MarkupSchema = z.discriminatedUnion("type", [
  MarkupPercentSchema,
  MarkupFlatSchema,
]);
export type Markup = z.infer<typeof MarkupSchema>;

/**
 * Package Price Breakup Item (Flight, Hotel, Land Part, Visa)
 */
export const PriceBreakupItemSchema = z.object({
  amountPaise: z.number().int().min(0).default(0),
  included: z.boolean().default(true),
  note: z.string().default(""),
});
export type PriceBreakupItem = z.infer<typeof PriceBreakupItemSchema>;

/**
 * 4-Pillar Package Price Breakup Schema:
 * - flight: Return airfare / flights
 * - hotel: Luxury stays / accommodations
 * - landPart: Sightseeing, transfers, excursions & guide
 * - visa: Visa fees & processing
 */
export const PriceBreakupSchema = z.object({
  flight: PriceBreakupItemSchema.default({ amountPaise: 0, included: true, note: "" }),
  hotel: PriceBreakupItemSchema.default({ amountPaise: 0, included: true, note: "" }),
  landPart: PriceBreakupItemSchema.default({ amountPaise: 0, included: true, note: "" }),
  visa: PriceBreakupItemSchema.default({ amountPaise: 0, included: true, note: "" }),
});
export type PriceBreakup = z.infer<typeof PriceBreakupSchema>;

/**
 * Pricing Types:
 * 1. "supplier" - DMC / Ground partner quote: Supplier Cost + Markup + Optional Flight Cost
 * 2. "custom" - Custom built itinerary: Itemized Flight, Land Part, Hotel, Visa
 */
export const PricingTypeSchema = z.enum(["supplier", "custom", "total_only"]);
export type PricingType = z.infer<typeof PricingTypeSchema>;

/**
 * Supplier Itinerary Breakup Schema (DMC quote + markup + optional flight)
 */
export const SupplierBreakupSchema = z.object({
  supplierCostPaise: z.number().int().min(0).default(0),
  flightIncluded: z.boolean().default(false),
  flightCostPaise: z.number().int().min(0).default(0),
  flightNote: z.string().default(""),
  landNote: z.string().default("Complete land package, accommodations, transfers & sightseeing"),
});
export type SupplierBreakup = z.infer<typeof SupplierBreakupSchema>;

/**
 * Custom Made Itinerary Breakup Item Schema
 */
export const CustomBreakupItemSchema = z.object({
  included: z.boolean().default(true),
  amountPaise: z.number().int().min(0).default(0),
  note: z.string().default(""),
});
export type CustomBreakupItem = z.infer<typeof CustomBreakupItemSchema>;

/**
 * Custom Made Itinerary Breakup Schema (Flight, Land Part, Hotel, Visa)
 */
export const CustomBreakupSchema = z.object({
  flight: CustomBreakupItemSchema.default({ included: false, amountPaise: 0, note: "" }),
  landPart: CustomBreakupItemSchema.default({ included: true, amountPaise: 0, note: "" }),
  hotel: CustomBreakupItemSchema.default({ included: true, amountPaise: 0, note: "" }),
  visa: CustomBreakupItemSchema.default({ included: false, amountPaise: 0, note: "" }),
});
export type CustomBreakup = z.infer<typeof CustomBreakupSchema>;

/**
 * Pricing Schema with integer paise storage and 2 pricing types
 */
export const PricingSchema = z.object({
  pricingType: PricingTypeSchema.default("supplier"),
  priceDistribution: z.enum(["total", "per_passenger"]).default("total"),
  currency: z.string().default("INR"),
  basis: z
    .enum(["per_person", "per_person_twin_sharing", "per_room", "total_group"])
    .default("per_person_twin_sharing"),
  netAmountPaise: z.number().int().min(0, "Net amount must be a positive integer in paise"),
  totalPackagePricePaise: z.number().int().min(0).default(0),
  markup: MarkupSchema.default({ type: "percent", value: 15 }),
  gstMode: z.enum(["inclusive", "extra", "hidden"]).default("inclusive"),
  gstRate: z.number().min(0).max(1).default(0.05),
  sacCode: z.string().default("998552"),
  validityDays: z.number().int().positive().default(7),
  supplierBreakup: SupplierBreakupSchema.default({
    supplierCostPaise: 0,
    flightIncluded: false,
    flightCostPaise: 0,
    flightNote: "",
    landNote: "Complete land package, accommodations, transfers & sightseeing",
  }),
  customBreakup: CustomBreakupSchema.default({
    flight: { included: false, amountPaise: 0, note: "" },
    landPart: { included: true, amountPaise: 0, note: "" },
    hotel: { included: true, amountPaise: 0, note: "" },
    visa: { included: false, amountPaise: 0, note: "" },
  }),
  breakup: PriceBreakupSchema.default({
    flight: { amountPaise: 0, included: true, note: "" },
    hotel: { amountPaise: 0, included: true, note: "" },
    landPart: { amountPaise: 0, included: true, note: "" },
    visa: { amountPaise: 0, included: true, note: "" },
  }),
});
export type Pricing = z.infer<typeof PricingSchema>;

/**
 * Cancellation Window & Charge Pair
 */
export const CancellationRowSchema = z.object({
  window: z.string().min(1),
  charge: z.string().min(1),
});
export type CancellationRow = z.infer<typeof CancellationRowSchema>;

/**
 * Terms and Policy Schema
 */
export const TermsSchema = z.object({
  payment: z.array(z.string()).default([]),
  cancellation: z.array(CancellationRowSchema).default([]),
});
export type Terms = z.infer<typeof TermsSchema>;

/**
 * Review Flag for LLM extraction review
 */
export const ReviewFlagSchema = z.object({
  field: z.string(),
  issue: z.string(),
  severity: z.enum(["info", "warning", "error"]).default("warning"),
});
export type ReviewFlag = z.infer<typeof ReviewFlagSchema>;

/**
 * Metadata & Provenance Schema
 */
export const TokenUsageSchema = z.object({
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
  costUsd: z.number(),
  costInr: z.number(),
  durationMs: z.number().optional(),
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const MetaSchema = z.object({
  sourceFile: z.string().nullable().default(null),
  extractedBy: z.string().nullable().default(null),
  reviewFlags: z.array(ReviewFlagSchema).default([]),
  extractedSnapshot: z.record(z.string(), z.unknown()).nullable().default(null),
  tokenUsage: TokenUsageSchema.nullable().optional().default(null),
});
export type Meta = z.infer<typeof MetaSchema>;

/**
 * Option / Price Variant
 */
export const VariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  netAmountPaise: z.number().int().min(0),
  hotels: z
    .array(
      z.object({
        dayNumber: z.number().int(),
        hotel: z.string(),
        city: z.string().optional(),
      })
    )
    .optional(),
});
export type Variant = z.infer<typeof VariantSchema>;

/**
 * Assigned Salesperson Details for PDF
 */
export const SalespersonContactSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});
export type SalespersonContact = z.infer<typeof SalespersonContactSchema>;

/**
 * Flight Leg Schema for Boarding Pass Rendering
 */
export const FlightLegSchema = z.object({
  id: z.string().optional(),
  airline: z.string().min(1, "Airline name is required"),
  flightNumber: z.string().default(""),
  date: z.string().default(""),
  departureTime: z.string().min(1, "Departure time is required"),
  departureCode: z.string().min(1, "Departure airport code is required"),
  departureCity: z.string().min(1, "Departure city is required"),
  departureAirport: z.string().default(""),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  arrivalCode: z.string().min(1, "Arrival airport code is required"),
  arrivalCity: z.string().min(1, "Arrival city is required"),
  arrivalAirport: z.string().default(""),
  stops: z.string().default("Non-stop"),
  layover: z.string().optional().default(""),
  checkInBaggage: z.string().default("15 kg"),
  cabinBaggage: z.string().default("7 kg"),
  direction: z.enum(["outbound", "inbound", "internal"]).optional().default("outbound"),
  journeyTitle: z.string().optional().default(""),
});
export type FlightLeg = z.infer<typeof FlightLegSchema>;

/**
 * Root Itinerary Schema - Single Source of Truth
 */
export const ItinerarySchema = z.object({
  schemaVersion: z.literal(1).default(1),
  package: PackageSchema,
  days: z.array(DaySchema).min(1, "Itinerary must contain at least one day"),
  flights: z.array(FlightLegSchema).optional(),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  pricing: PricingSchema,
  terms: TermsSchema.default({ payment: [], cancellation: [] }),
  meta: MetaSchema.default({ sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null, tokenUsage: null }),
  variants: z.array(VariantSchema).default([]),
  salesperson: SalespersonContactSchema.optional(),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;

