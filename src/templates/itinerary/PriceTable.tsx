import React from "react";
import { ClientPricingView } from "@/lib/schema/client-view";
import { MapPin, Plane, ShieldCheck, Clock } from "lucide-react";
import { SectionTitle } from "./PageHeaderFooter";

interface PriceTableProps {
  pricing: ClientPricingView;
  showSectionTitle?: boolean;
}

export default function PriceTable({ pricing, showSectionTitle = true }: PriceTableProps) {
  const isZeroOrMissing = !pricing.finalPricePaise || pricing.finalPricePaise <= 0;
  const priceDisplay = isZeroOrMissing ? "On Request" : `₹ ${pricing.finalPriceFormatted}`;

  // Estimate a realistic Land vs Flight split if total price is provided
  const hasPrice = pricing.finalPriceRupees > 0;
  const landPriceFormatted = hasPrice
    ? Math.round(pricing.finalPriceRupees * 0.44).toLocaleString("en-IN")
    : "On Request";
  const flightPriceFormatted = hasPrice
    ? Math.round(pricing.finalPriceRupees * 0.56).toLocaleString("en-IN")
    : "Included";

  return (
    <section className="avoid-break mb-6">
      {showSectionTitle && <SectionTitle title="Pricing & Payment" />}

      {/* Dark Navy Commercial Card matching Reference Pages 4 & 11 */}
      <div className="bg-[#091c3e] text-white rounded-2xl p-6 md:p-8 shadow-lg avoid-break">
        {/* Sub-costs Split (Land vs Flight) */}
        <div className="grid grid-cols-2 gap-4 pb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Land Package</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-display text-white mt-1">
              ₹ {landPriceFormatted}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-amber-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">
              <Plane className="w-3.5 h-3.5" />
              <span>Flight Cost</span>
            </div>
            <div className="text-xl md:text-2xl font-bold font-display text-white mt-1">
              ₹ {flightPriceFormatted}
            </div>
          </div>
        </div>

        {/* Total Package Value Hero */}
        <div className="pt-6 border-t border-white/15 text-center">
          <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-amber-400 font-display">
            Total Package Value
          </div>
          <div className="text-4xl md:text-5xl font-black text-white font-display mt-1 drop-shadow-md tracking-tight">
            {priceDisplay}
          </div>
          <div className="text-xs text-blue-200 mt-2 font-medium">
            Tax Included. {pricing.gstMode === "inclusive" ? "5% GST Included" : "+ 5% GST"}
            {pricing.tcsDisclaimer ? ` • ${pricing.tcsDisclaimer}` : " • ₹1,500 (TCS)"}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 text-[11px] text-slate-300">
            <span className="capitalize">
              Basis: <strong>{pricing.basis.replace(/_/g, " ")}</strong>
            </span>
            <span>•</span>
            <span>
              SAC Code: <strong>{pricing.sacCode || "998552"}</strong> (Tour Operator Services)
            </span>
            {pricing.validUntil && (
              <>
                <span>•</span>
                <span className="text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Valid till: <strong>{pricing.validUntil}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
