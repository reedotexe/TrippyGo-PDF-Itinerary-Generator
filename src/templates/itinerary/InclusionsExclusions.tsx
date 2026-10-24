import React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface InclusionsExclusionsProps {
  inclusions: string[];
  exclusions: string[];
  pageNumber?: number;
}

export default function InclusionsExclusions({
  inclusions,
  exclusions,
  pageNumber,
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
        "Visa fees & official consulate processing charges.",
        "International and domestic flight tickets unless explicitly stated as included.",
        "TCS charges (collected as per prevailing Government of India regulations).",
        "Personal expenses (laundry, telephone calls, beverages, minibar, etc.).",
        "Tips & gratuities for driver, local guides, and hotel staff.",
        "Any optional tours, upgrades, or additional activities not mentioned in itinerary.",
        "Early hotel check-in or late check-out surcharges.",
        "Travel and medical insurance cover.",
      ];

  return (
    <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
      <div className="space-y-8">
        {/* 1. Inclusions Card matching Reference Page 12 */}
        <div className="avoid-break">
          <SectionTitle title="Inclusions" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <ul className="space-y-3 text-sm text-slate-700">
              {displayInclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span className="leading-relaxed font-body">{inc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Exclusions Card matching Reference Page 13 */}
        <div className="avoid-break">
          <SectionTitle title="Exclusions" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <ul className="space-y-3 text-sm text-slate-700">
              {displayExclusions.map((exc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 border border-red-200">
                    <X className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span className="leading-relaxed font-body">{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Essential Notes Card matching Reference Page 14 */}
        <div className="avoid-break">
          <SectionTitle title="Important Notes" />
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                </span>
                <span className="leading-relaxed font-semibold text-slate-900">
                  The passport must be valid for at least 6 months from the scheduled date of return.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-2 ml-1.5" />
                <span className="leading-relaxed">
                  If the client shares their passport copy with us, it will be considered verified and correct from the client's end.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-2 ml-1.5" />
                <span className="leading-relaxed">
                  TrippyGo Holidays will not be held responsible for passport validity, immigration rejections, or related airline boarding issues.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}
