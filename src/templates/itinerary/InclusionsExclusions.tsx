import React from "react";
import { Check, X } from "lucide-react";
import { SectionTitle, PageFooter, PageWatermark } from "./PageHeaderFooter";

interface InclusionsExclusionsProps {
  inclusions: string[];
  exclusions: string[];
  pageNumber?: number;
  totalPages?: number;
}

export default function InclusionsExclusions({
  inclusions,
  exclusions,
  pageNumber,
  totalPages,
}: InclusionsExclusionsProps) {
  const hasInclusions = inclusions && inclusions.length > 0;
  const hasExclusions = exclusions && exclusions.length > 0;

  // Fallback defaults if empty
  const displayInclusions = hasInclusions
    ? inclusions
    : [
        "Accommodation in Double/Twin share room with daily breakfast as mentioned in stay details.",
        "Sightseeing tickets, transfers, and all services as mentioned in the travel itinerary.",
        "English-speaking tour guide during all guided tours.",
        "All airport transfers via private air-conditioned vehicle.",
        "Meals as specified in the day-by-day itinerary program.",
        "Ha Long Bay Cruise day tour / excursion with buffet lunch.",
        "Entrance tickets to all monuments, cable cars, and national parks listed.",
        "Complimentary bottled drinking water during tours (1 bottle/person/day).",
      ];

  const displayExclusions = hasExclusions
    ? exclusions
    : [
        "International / Domestic Airfare (unless explicitly specified in Flight section).",
        "Visa fees and processing charges (unless pre-arranged and mentioned).",
        "TCS charges (collected as per prevailing Government of India regulations).",
        "Personal expenses (laundry, telephone calls, beverages, minibar, etc.).",
        "Tips & gratuities for driver, local guides, and hotel staff.",
        "Any optional tours, upgrades, or additional activities not mentioned in itinerary.",
        "Early hotel check-in or late check-out surcharges.",
        "Travel and medical insurance cover.",
      ];

  return (
    <section className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body">
      <PageWatermark />
      <div className="relative z-10">
        {/* 2-Column Grid: Inclusions (Left) & Exclusions (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Inclusions Editorial Column */}
          <div className="avoid-break">
            <SectionTitle kicker="DETAILS // WHAT IS COVERED" title="Inclusions" />
            <ul className="space-y-3 text-[13px] md:text-sm text-slate-700 font-body">
              {displayInclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <span className="leading-relaxed">{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Exclusions Editorial Column */}
          <div className="avoid-break">
            <SectionTitle kicker="DETAILS // WHAT IS EXCLUDED" title="Exclusions" />
            <ul className="space-y-3 text-[13px] md:text-sm text-slate-700 font-body">
              {displayExclusions.map((exc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 text-[#c92229] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <span className="leading-relaxed">{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Essential Travel Documentation Notes */}
        <div className="avoid-break mt-8 p-4 border-l-3 border-[#091c3e] bg-slate-50/80 rounded-r-lg">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#091c3e] block mb-1">
            Documentation & Regulatory Compliance
          </span>
          <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-900">
              • Passports must be strictly valid for a minimum of 6 months from the scheduled return date.
            </p>
            <p>
              • If the guest submits their passport copy, details therein are deemed verified and confirmed by the traveler.
            </p>
            <p>
              • TrippyGo Holidays assumes no liability for immigration clearances, customs delays, or airline boarding refusals.
            </p>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}
