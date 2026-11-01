import React from "react";
import { ClientPricingView, ClientPriceItem } from "@/lib/schema/client-view";
import { SectionTitle } from "./PageHeaderFooter";
import { Plane, Building2, MapPin, FileCheck2, CheckCircle2 } from "lucide-react";

interface PriceTableProps {
  pricing: ClientPricingView;
  showSectionTitle?: boolean;
}

function formatBasis(basis: string): string {
  switch (basis) {
    case "per_person_twin_sharing":
      return "Per Person (Twin Sharing Basis)";
    case "per_person":
      return "Per Person";
    case "total_group":
      return "Total Package (All Travellers)";
    case "per_room":
      return "Per Room / Night";
    default:
      return "Per Person Twin Sharing";
  }
}

function getPillarVisuals(category: ClientPriceItem["category"]) {
  switch (category) {
    case "flight":
      return {
        icon: Plane,
        iconBg: "bg-blue-50 text-blue-700 border-blue-200/80",
      };
    case "hotel":
      return {
        icon: Building2,
        iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
      };
    case "visa":
      return {
        icon: FileCheck2,
        iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    case "land":
    case "package":
    default:
      return {
        icon: MapPin,
        iconBg: "bg-amber-50 text-amber-700 border-amber-200/80",
      };
  }
}

export default function PriceTable({ pricing, showSectionTitle = true }: PriceTableProps) {
  const isZeroOrMissing = !pricing.finalPricePaise || pricing.finalPricePaise <= 0;
  const priceDisplay = isZeroOrMissing ? "On Request" : `₹ ${pricing.finalPriceFormatted}`;

  // Only render active, strictly INCLUDED components. Never display excluded items!
  const items = pricing.items && pricing.items.length > 0 ? pricing.items : [];

  return (
    <section className="avoid-break mb-5 font-body">
      {showSectionTitle && (
        <SectionTitle
          kicker="INVESTMENT // PROPOSAL QUOTE"
          title={pricing.pricingType === "total_only" ? "Total Package Price" : "Pricing & Package Breakup"}
        />
      )}

      {/* Modern High-End Commercial Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        {/* Deep Navy Executive Header */}
        <div className="bg-[#091c3e] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#FFDE59]">
                {pricing.pricingType === "total_only" ? "Total Package Price" : "Package Price Breakup"}
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                / {pricing.priceDistribution === "per_passenger"
                  ? `Split Distribution (${pricing.passengerCount} Pax)`
                  : pricing.pricingType === "supplier"
                  ? "Supplier Package"
                  : pricing.pricingType === "total_only"
                  ? "All-Inclusive Package"
                  : "Itemized Package"}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-white tracking-tight mt-0.5 font-serif-luxury">
              {pricing.pricingType === "total_only" ? "Total Package Investment" : "Comprehensive Travel Investment"}
            </h3>
            <div className="text-[11px] text-slate-300 mt-0.5">
              {formatBasis(pricing.basis)}
              {pricing.priceDistribution === "per_passenger" && (
                <span> • Split for {pricing.passengerCount} Passengers</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[9.5px] uppercase font-bold tracking-[0.2em] text-slate-300 block">
              Total Package Investment
            </span>
            <div className="font-serif-luxury text-3xl md:text-4xl font-bold text-white mt-0.5 tracking-tight drop-shadow-xs">
              {priceDisplay}
            </div>
          </div>
        </div>

        {/* Breakup Rows: ONLY active included components are rendered */}
        {pricing.pricingType === "total_only" && pricing.priceDistribution === "per_passenger" ? (
          <div className="divide-y divide-slate-100 bg-white">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 bg-amber-50 text-amber-700 border-amber-200/80">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif-luxury font-bold text-slate-900 text-sm md:text-base">
                      Total All-Inclusive Package
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Included
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-500 mt-0.5">
                    Comprehensive package covering all confirmed stays, transfers, sightseeing, and services
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-sm md:text-base font-bold font-mono text-[#091c3e]">
                    ₹ {Math.round(pricing.basePricePaise / 100 / pricing.passengerCount).toLocaleString("en-IN")}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">/ person</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Total: ₹ {pricing.finalPriceFormatted} ({pricing.passengerCount} {pricing.passengerCount === 1 ? "passenger" : "passengers"})
                </div>
              </div>
            </div>
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-slate-100 bg-white">
            {items.map((item) => {
              const { icon: Icon, iconBg } = getPillarVisuals(item.category);

              return (
                <div
                  key={item.key}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Left: Icon & Pillar Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-serif-luxury font-bold text-slate-900 text-sm md:text-base">
                          {item.title}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Included
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11.5px] text-slate-500 truncate mt-0.5 max-w-sm md:max-w-md">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Item Amount */}
                  <div className="text-right shrink-0">
                    {pricing.priceDistribution === "per_passenger" ? (
                      <div>
                        <div className="flex items-baseline justify-end gap-1">
                          <span className="text-sm md:text-base font-bold font-mono text-[#091c3e]">
                            ₹ {item.splitAmountFormatted}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">/ person</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Total: ₹ {item.amountFormatted} ({pricing.passengerCount} {pricing.passengerCount === 1 ? "passenger" : "passengers"})
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm md:text-base font-bold font-mono text-[#091c3e]">
                        ₹ {item.amountFormatted}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Total Package Investment covers all mentioned inclusions, stays, and transfers.
            </span>
          </div>
        )}

        {/* Footer Meta Strip */}
        {pricing.validUntil && (
          <div className="bg-slate-50/90 border-t border-slate-200/80 px-5 py-2.5 flex items-center justify-between gap-2 text-[10.5px] text-slate-500">
            <span className="text-slate-400">All prices in Indian Rupees (INR)</span>
            <div className="font-medium text-[#c92229]">
              Quote Valid Until: <span className="font-bold">{pricing.validUntil}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
