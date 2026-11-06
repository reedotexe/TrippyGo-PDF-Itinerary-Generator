import { Itinerary, ItinerarySchema } from "./itinerary";

/**
 * Migration utility for Itinerary JSON documents.
 * Ensures backward compatibility across schema changes and upgrades legacy records.
 */
export function migrateItinerarySchema(raw: unknown): Itinerary {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid itinerary payload: expected an object");
  }

  const doc = { ...(raw as Record<string, any>) };

  // 1. Check or assign schemaVersion
  const currentVersion = doc.schemaVersion || 0;

  // Migration from v0 to v1:
  if (currentVersion < 1) {
    console.log(`[Schema Migration] Migrating itinerary from v${currentVersion} to v1...`);

    // Ensure package defaults with intelligent fallbacks
    const rawPkg = doc.package || {};
    const rawDays = Array.isArray(doc.days) ? doc.days : [];
    const calculatedDays = typeof rawPkg.days === "number" && rawPkg.days >= 1
      ? rawPkg.days
      : rawDays.length > 0
      ? rawDays.length
      : 2;
    const calculatedNights = typeof rawPkg.nights === "number" && rawPkg.nights >= 0
      ? rawPkg.nights
      : Math.max(0, calculatedDays - 1);

    doc.package = {
      title: rawPkg.title || "Untitled Itinerary",
      destinations:
        Array.isArray(rawPkg.destinations) && rawPkg.destinations.length > 0
          ? rawPkg.destinations
          : ["General Destination"],
      nights: calculatedNights,
      days: calculatedDays,
      coverImage: rawPkg.coverImage || null,
      startDate: rawPkg.startDate || null,
      travellers: {
        adults: rawPkg.travellers?.adults || 2,
        children: rawPkg.travellers?.children || 0,
        infants: rawPkg.travellers?.infants || 0,
        rooms: rawPkg.travellers?.rooms || 1,
      },
    };

    // Ensure pricing is structured with integer paise, 2-type pricing, and breakup
    const defaultBreakup = {
      flight: { amountPaise: 0, included: true, note: "" },
      hotel: { amountPaise: 0, included: true, note: "" },
      landPart: { amountPaise: 0, included: true, note: "" },
      visa: { amountPaise: 0, included: true, note: "" },
    };

    const defaultSupplierBreakup = {
      supplierCostPaise: 0,
      flightIncluded: false,
      flightCostPaise: 0,
      flightNote: "",
      landNote: "Complete land package, accommodations, transfers & sightseeing",
    };

    const defaultCustomBreakup = {
      flight: { amountPaise: 0, included: false, note: "" },
      landPart: { amountPaise: 0, included: true, note: "" },
      hotel: { amountPaise: 0, included: true, note: "" },
      visa: { amountPaise: 0, included: false, note: "" },
    };

    if (!doc.pricing) {
      doc.pricing = {
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
        supplierBreakup: defaultSupplierBreakup,
        customBreakup: defaultCustomBreakup,
        breakup: defaultBreakup,
      };
    } else {
      // If legacy rupees were used, convert to paise
      if (typeof doc.pricing.netAmount === "number" && !doc.pricing.netAmountPaise) {
        doc.pricing.netAmountPaise = Math.round(doc.pricing.netAmount * 100);
        delete doc.pricing.netAmount;
      }

      // Ensure markup is discriminated union
      if (typeof doc.pricing.markup === "number") {
        doc.pricing.markup = { type: "percent", value: doc.pricing.markup };
      } else if (!doc.pricing.markup || !doc.pricing.markup.type) {
        doc.pricing.markup = { type: "percent", value: 15 };
      }

      if (!doc.pricing.pricingType) doc.pricing.pricingType = "supplier";
      if (!doc.pricing.priceDistribution) doc.pricing.priceDistribution = "total";
      if (doc.pricing.totalPackagePricePaise === undefined) {
        doc.pricing.totalPackagePricePaise = doc.pricing.netAmountPaise || 0;
      }
      if (!doc.pricing.sacCode) doc.pricing.sacCode = "998552";
      if (!doc.pricing.gstMode) doc.pricing.gstMode = "inclusive";
      if (doc.pricing.gstRate === undefined) doc.pricing.gstRate = 0.05;
      if (!doc.pricing.validityDays) doc.pricing.validityDays = 7;

      // Ensure supplier breakup
      if (!doc.pricing.supplierBreakup || typeof doc.pricing.supplierBreakup !== "object") {
        doc.pricing.supplierBreakup = {
          ...defaultSupplierBreakup,
          supplierCostPaise: doc.pricing.netAmountPaise || 0,
        };
      } else {
        doc.pricing.supplierBreakup = {
          ...defaultSupplierBreakup,
          ...doc.pricing.supplierBreakup,
          supplierCostPaise: doc.pricing.supplierBreakup.supplierCostPaise ?? (doc.pricing.netAmountPaise || 0),
        };
      }

      // Ensure custom breakup
      if (!doc.pricing.customBreakup || typeof doc.pricing.customBreakup !== "object") {
        doc.pricing.customBreakup = {
          flight: { ...defaultCustomBreakup.flight, ...doc.pricing.breakup?.flight },
          landPart: { ...defaultCustomBreakup.landPart, ...doc.pricing.breakup?.landPart },
          hotel: { ...defaultCustomBreakup.hotel, ...doc.pricing.breakup?.hotel },
          visa: { ...defaultCustomBreakup.visa, ...doc.pricing.breakup?.visa },
        };
      } else {
        doc.pricing.customBreakup = {
          flight: { ...defaultCustomBreakup.flight, ...doc.pricing.customBreakup.flight },
          landPart: { ...defaultCustomBreakup.landPart, ...doc.pricing.customBreakup.landPart },
          hotel: { ...defaultCustomBreakup.hotel, ...doc.pricing.customBreakup.hotel },
          visa: { ...defaultCustomBreakup.visa, ...doc.pricing.customBreakup.visa },
        };
      }

      // Ensure 4-pillar package price breakup
      if (!doc.pricing.breakup || typeof doc.pricing.breakup !== "object") {
        doc.pricing.breakup = defaultBreakup;
      } else {
        doc.pricing.breakup = {
          flight: { ...defaultBreakup.flight, ...doc.pricing.breakup.flight },
          hotel: { ...defaultBreakup.hotel, ...doc.pricing.breakup.hotel },
          landPart: { ...defaultBreakup.landPart, ...doc.pricing.breakup.landPart },
          visa: { ...defaultBreakup.visa, ...doc.pricing.breakup.visa },
        };
      }
    }

    // Ensure days array
    if (!Array.isArray(doc.days) || doc.days.length === 0) {
      doc.days = [
        {
          dayNumber: 1,
          title: "Day 1 Arrival",
          description: "Arrival at destination and check-in.",
          activities: [],
          meals: [],
          stay: null,
          imageQuery: "",
          image: null,
        },
      ];
    } else {
      // Normalize days
      doc.days = doc.days.map((d: any, idx: number) => ({
        dayNumber: d.dayNumber || idx + 1,
        title: d.title || `Day ${idx + 1}`,
        description: d.description || "",
        activities: Array.isArray(d.activities) ? d.activities : [],
        meals: Array.isArray(d.meals) ? d.meals : [],
        stay: d.stay || null,
        imageQuery: d.imageQuery || "",
        image: d.image || null,
      }));
    }

    // Ensure inclusions and exclusions
    if (!Array.isArray(doc.inclusions)) doc.inclusions = [];
    if (!Array.isArray(doc.exclusions)) doc.exclusions = [];

    // Ensure terms
    if (!doc.terms) {
      doc.terms = { payment: [], cancellation: [] };
    }

    // Ensure meta provenance
    if (!doc.meta) {
      doc.meta = {
        sourceFile: null,
        extractedBy: null,
        reviewFlags: [],
        extractedSnapshot: null,
      };
    }

    // Ensure variants array
    if (!Array.isArray(doc.variants)) {
      doc.variants = [];
    }

    // Ensure flights array
    if (!Array.isArray(doc.flights)) {
      doc.flights = [];
    }

    // Set schemaVersion = 1
    doc.schemaVersion = 1;
  } else {
    // If already v1, guarantee flights array, 2-type pricing, and breakup objects
    if (!Array.isArray(doc.flights)) {
      doc.flights = [];
    }
    const defaultBreakup = {
      flight: { amountPaise: 0, included: true, note: "" },
      hotel: { amountPaise: 0, included: true, note: "" },
      landPart: { amountPaise: 0, included: true, note: "" },
      visa: { amountPaise: 0, included: true, note: "" },
    };
    const defaultSupplierBreakup = {
      supplierCostPaise: 0,
      flightIncluded: false,
      flightCostPaise: 0,
      flightNote: "",
      landNote: "Complete land package, accommodations, transfers & sightseeing",
    };
    const defaultCustomBreakup = {
      flight: { amountPaise: 0, included: false, note: "" },
      landPart: { amountPaise: 0, included: true, note: "" },
      hotel: { amountPaise: 0, included: true, note: "" },
      visa: { amountPaise: 0, included: false, note: "" },
    };

    if (doc.pricing) {
      if (!doc.pricing.pricingType) doc.pricing.pricingType = "supplier";
      if (!doc.pricing.priceDistribution) doc.pricing.priceDistribution = "total";

      // Ensure supplier breakup
      if (!doc.pricing.supplierBreakup || typeof doc.pricing.supplierBreakup !== "object") {
        doc.pricing.supplierBreakup = {
          ...defaultSupplierBreakup,
          supplierCostPaise: doc.pricing.netAmountPaise || 0,
        };
      } else {
        doc.pricing.supplierBreakup = {
          ...defaultSupplierBreakup,
          ...doc.pricing.supplierBreakup,
          supplierCostPaise: doc.pricing.supplierBreakup.supplierCostPaise ?? (doc.pricing.netAmountPaise || 0),
        };
      }

      // Ensure custom breakup
      if (!doc.pricing.customBreakup || typeof doc.pricing.customBreakup !== "object") {
        doc.pricing.customBreakup = {
          flight: { ...defaultCustomBreakup.flight, ...doc.pricing.breakup?.flight },
          landPart: { ...defaultCustomBreakup.landPart, ...doc.pricing.breakup?.landPart },
          hotel: { ...defaultCustomBreakup.hotel, ...doc.pricing.breakup?.hotel },
          visa: { ...defaultCustomBreakup.visa, ...doc.pricing.breakup?.visa },
        };
      } else {
        doc.pricing.customBreakup = {
          flight: { ...defaultCustomBreakup.flight, ...doc.pricing.customBreakup.flight },
          landPart: { ...defaultCustomBreakup.landPart, ...doc.pricing.customBreakup.landPart },
          hotel: { ...defaultCustomBreakup.hotel, ...doc.pricing.customBreakup.hotel },
          visa: { ...defaultCustomBreakup.visa, ...doc.pricing.customBreakup.visa },
        };
      }

      if (!doc.pricing.breakup || typeof doc.pricing.breakup !== "object") {
        doc.pricing.breakup = defaultBreakup;
      } else {
        doc.pricing.breakup = {
          flight: { ...defaultBreakup.flight, ...doc.pricing.breakup.flight },
          hotel: { ...defaultBreakup.hotel, ...doc.pricing.breakup.hotel },
          landPart: { ...defaultBreakup.landPart, ...doc.pricing.breakup.landPart },
          visa: { ...defaultBreakup.visa, ...doc.pricing.breakup.visa },
        };
      }
    }
  }

  // -----------------------------------------------------------------
  // Migration to v2: Ownership & Access Control Metadata
  // -----------------------------------------------------------------
  if (!doc.schemaVersion || doc.schemaVersion < 2) {
    doc.schemaVersion = 2;
  }
  if (!doc.ownership || typeof doc.ownership !== "object") {
    doc.ownership = {};
  }

  // Guarantee cleanly normalized variants array
  doc.variants = Array.isArray(doc.variants)
    ? doc.variants
        .filter((v: any) => v && typeof v === "object")
        .map((v: any, idx: number) => {
          let netPaise = 0;
          if (typeof v.netAmountPaise === "number" && v.netAmountPaise >= 0) {
            netPaise = Math.round(v.netAmountPaise);
          } else if (typeof v.netAmount === "number" && v.netAmount >= 0) {
            netPaise = Math.round(v.netAmount * 100);
          } else {
            const candidateStr = v.price || v.cost || v.rate || v.totalAmount || v.amount;
            if (typeof candidateStr === "string") {
              const num = parseInt(candidateStr.replace(/[^\d]/g, ""), 10);
              if (!isNaN(num) && num > 0) netPaise = num * 100;
            } else if (typeof candidateStr === "number" && candidateStr >= 0) {
              netPaise = Math.round(candidateStr * 100);
            }
          }

          const name = String(v.name || v.option || v.tier || v.title || `Option ${idx + 1}`).trim() || `Option ${idx + 1}`;
          const id = String(v.id || `var_${idx + 1}`).trim();
          const description = typeof v.description === "string" ? v.description.trim() : undefined;

          const hotels = Array.isArray(v.hotels)
            ? v.hotels
                .filter((h: any) => h && typeof h === "object")
                .map((h: any) => ({
                  dayNumber: Number(h.dayNumber) || 1,
                  hotel: String(h.hotel || "").trim(),
                  city: typeof h.city === "string" ? h.city.trim() : undefined,
                }))
                .filter((h: any) => h.hotel)
            : undefined;

          return {
            id,
            name,
            description,
            netAmountPaise: netPaise,
            hotels: hotels && hotels.length > 0 ? hotels : undefined,
          };
        })
    : [];

  // Validate resulting structure against single source of truth Zod schema
  return ItinerarySchema.parse(doc);
}
