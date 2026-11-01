"use client";

import React, { useState, useEffect } from "react";
import { Pricing, SupplierBreakup, CustomBreakup } from "@/lib/schema/itinerary";
import {
  computeMarkupPaise,
  computeMarginPercent,
  formatInrBare,
} from "@/lib/pricing";
import {
  IndianRupee,
  ShieldCheck,
  Building2,
  Palette,
  Plane,
  MapPin,
  FileCheck2,
  AlertCircle,
  AlertTriangle,
  Check,
  Users,
  Receipt,
} from "lucide-react";

interface PricingPanelProps {
  pricing: Pricing;
  onChange: (updatedPricing: Pricing) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
  passengerCount?: number;
}

// ============================================================================
// SUB-COMPONENT: IndianCurrencyInput (Live Indian Comma Formatting)
// ============================================================================

interface IndianCurrencyInputProps {
  id?: string;
  value: number; // In Rupees
  onChange: (rupees: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

function IndianCurrencyInput({
  id,
  value,
  onChange,
  placeholder = "0",
  className = "",
  disabled = false,
  "aria-label": ariaLabel,
}: IndianCurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    value ? value.toLocaleString("en-IN") : ""
  );
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? value.toLocaleString("en-IN") : "");
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanDigits = raw.replace(/[^0-9]/g, "");
    if (!cleanDigits) {
      setDisplayValue("");
      onChange(0);
      return;
    }
    const num = parseInt(cleanDigits, 10);
    setDisplayValue(num.toLocaleString("en-IN"));
    onChange(num);
  };

  return (
    <div className="relative w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none select-none">
        ₹
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => {
          setIsFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => {
          setIsFocused(false);
          setDisplayValue(value ? value.toLocaleString("en-IN") : "");
        }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`w-full pl-7 pr-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition min-h-[42px] ${className}`}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: PricingPanel
// ============================================================================

export default function PricingPanel({
  pricing,
  onChange,
  reviewFlags = [],
  passengerCount = 2,
}: PricingPanelProps) {
  const pricingType = pricing.pricingType || "supplier";
  const priceDistribution = pricing.priceDistribution || "total";
  const effectivePassengers = Math.max(1, passengerCount);

  const supplierBreakup: SupplierBreakup = pricing.supplierBreakup || {
    supplierCostPaise: pricing.netAmountPaise || 0,
    flightIncluded: false,
    flightCostPaise: 0,
    flightNote: "",
    landNote: "Complete land package, accommodations, transfers & sightseeing",
  };

  const customBreakup: CustomBreakup = pricing.customBreakup || {
    flight: { included: false, amountPaise: 0, note: "" },
    landPart: { included: true, amountPaise: 0, note: "" },
    hotel: { included: true, amountPaise: 0, note: "" },
    visa: { included: false, amountPaise: 0, note: "" },
  };

  // -----------------------------------------------------------------
  // Supplier Mode Calculations
  // -----------------------------------------------------------------
  const supplierCostRupees = Math.round(
    (supplierBreakup.supplierCostPaise || 0) / 100
  );
  const supplierCostPaise = supplierBreakup.supplierCostPaise || 0;
  const landMarkupPaise = computeMarkupPaise(supplierCostPaise, pricing.markup);
  const landSellingPricePaise = supplierCostPaise + landMarkupPaise;
  const landSellingPriceRupees = Math.round(landSellingPricePaise / 100);

  const supplierFlightRupees = Math.round(
    (supplierBreakup.flightCostPaise || 0) / 100
  );
  const supplierFlightPaise = supplierBreakup.flightIncluded
    ? supplierBreakup.flightCostPaise || 0
    : 0;

  const supplierTotalBasePaise = landSellingPricePaise + supplierFlightPaise;
  const supplierTotalBaseRupees = Math.round(supplierTotalBasePaise / 100);

  const marginPercent = computeMarginPercent(supplierCostPaise, pricing.markup);
  const isLowMargin = supplierCostPaise > 0 && marginPercent < 8;

  // Split amounts for supplier mode
  const landSplitRupees = Math.round(
    landSellingPriceRupees / effectivePassengers
  );
  const flightSplitRupees = Math.round(
    supplierFlightRupees / effectivePassengers
  );
  const totalSplitRupees = Math.round(
    supplierTotalBaseRupees / effectivePassengers
  );

  // -----------------------------------------------------------------
  // Custom Mode Calculations
  // -----------------------------------------------------------------
  const customItems = [
    {
      key: "flight" as const,
      label: "Flight Airfare",
      subtitle: "Scheduled round-trip / internal flights with baggage",
      icon: Plane,
      placeholderNote: "e.g. Return flights DEL-SXR with 20kg check-in baggage",
      data: customBreakup.flight,
    },
    {
      key: "landPart" as const,
      label: "Land Package",
      subtitle: "Private transfers, excursions, activities & guide",
      icon: MapPin,
      placeholderNote: "e.g. Private AC cab, airport transfers & sightseeing",
      data: customBreakup.landPart,
    },
    {
      key: "hotel" as const,
      label: "Hotel Stays",
      subtitle: "Handpicked boutique hotels, luxury resorts & stays",
      icon: Building2,
      placeholderNote: "e.g. 4-star boutique hotel + luxury houseboat stay",
      data: customBreakup.hotel,
    },
    {
      key: "visa" as const,
      label: "Visa & Entry",
      subtitle: "Tourist visa assistance, permits & documentation",
      icon: FileCheck2,
      placeholderNote: "e.g. Tourist e-Visa assistance & consular processing",
      data: customBreakup.visa,
    },
  ];

  const customTotalRupees =
    (customBreakup.flight?.included
      ? Math.round((customBreakup.flight.amountPaise || 0) / 100)
      : 0) +
    (customBreakup.landPart?.included
      ? Math.round((customBreakup.landPart.amountPaise || 0) / 100)
      : 0) +
    (customBreakup.hotel?.included
      ? Math.round((customBreakup.hotel.amountPaise || 0) / 100)
      : 0) +
    (customBreakup.visa?.included
      ? Math.round((customBreakup.visa.amountPaise || 0) / 100)
      : 0);

  const customTotalSplitRupees = Math.round(
    customTotalRupees / effectivePassengers
  );

  // -----------------------------------------------------------------
  // Total Only Mode Calculations
  // -----------------------------------------------------------------
  const totalOnlyRupees = Math.round(
    (pricing.totalPackagePricePaise ?? pricing.netAmountPaise ?? 0) / 100
  );
  const totalOnlySplitRupees = Math.round(
    totalOnlyRupees / effectivePassengers
  );

  // Review flags helper
  const priceFlag = reviewFlags.find(
    (f) =>
      f.field === "pricing.netAmountPaise" ||
      f.field === "pricing" ||
      f.field === "pricing.supplierBreakup"
  );

  // -----------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------
  const handleTypeChange = (type: "supplier" | "custom" | "total_only") => {
    if (type === "total_only") {
      const initialPricePaise =
        pricing.totalPackagePricePaise ||
        (pricing.pricingType === "custom"
          ? customTotalRupees * 100
          : supplierTotalBasePaise) ||
        pricing.netAmountPaise ||
        0;
      onChange({
        ...pricing,
        pricingType: "total_only",
        totalPackagePricePaise: initialPricePaise,
        netAmountPaise: initialPricePaise,
        markup: { type: "percent", value: 0 },
      });
      return;
    }
    onChange({
      ...pricing,
      pricingType: type,
    });
  };

  const handleUpdateTotalOnly = (rupees: number) => {
    const paise = Math.max(0, Math.round(rupees * 100));
    onChange({
      ...pricing,
      pricingType: "total_only",
      totalPackagePricePaise: paise,
      netAmountPaise: paise,
      markup: { type: "percent", value: 0 },
    });
  };

  const handleUpdateSupplier = (updates: Partial<SupplierBreakup>) => {
    const updated = {
      ...supplierBreakup,
      ...updates,
    };
    onChange({
      ...pricing,
      pricingType: "supplier",
      netAmountPaise: updated.supplierCostPaise,
      supplierBreakup: updated,
    });
  };

  const handleUpdateCustomItem = (
    key: "flight" | "landPart" | "hotel" | "visa",
    updates: Partial<{ included: boolean; amountPaise: number; note: string }>
  ) => {
    const updatedCustom = {
      ...customBreakup,
      [key]: {
        ...customBreakup[key],
        ...updates,
      },
    };

    // Keep netAmountPaise in sync with sum of included items
    const sumPaise =
      (updatedCustom.flight?.included
        ? updatedCustom.flight.amountPaise || 0
        : 0) +
      (updatedCustom.landPart?.included
        ? updatedCustom.landPart.amountPaise || 0
        : 0) +
      (updatedCustom.hotel?.included
        ? updatedCustom.hotel.amountPaise || 0
        : 0) +
      (updatedCustom.visa?.included
        ? updatedCustom.visa.amountPaise || 0
        : 0);

    onChange({
      ...pricing,
      pricingType: "custom",
      netAmountPaise: sumPaise,
      customBreakup: updatedCustom,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 font-body">
      {/* 1. HEADER BAR: Title, Staff View Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#091c3e] text-white shadow-2xs">
              <IndianRupee className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Package Pricing & Commercials
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Confidential Staff View</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Set customer quotes and margins. Markup is strictly confidential and never visible on client PDFs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FIX 6.1: STREAMLINED MODE SELECTOR SEGMENTED BAR */}
      <div>
        <label id="pricing-model-label" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Pricing Calculation Model
        </label>
        <div role="radiogroup" aria-labelledby="pricing-model-label" className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: Supplier DMC Quote */}
          <button
            type="button"
            role="radio"
            aria-checked={pricingType === "supplier"}
            onClick={() => handleTypeChange("supplier")}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 select-none min-h-[44px] ${
              pricingType === "supplier"
                ? "bg-[#091c3e] text-white border-[#091c3e] shadow-xs ring-2 ring-[#091c3e]/15"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pricingType === "supplier"
                  ? "bg-white/10 text-amber-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  1. Supplier DMC Package
                </span>
                {pricingType === "supplier" && (
                  <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] mt-0.5 leading-snug ${
                  pricingType === "supplier" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                DMC ground rate + agency margin, with optional flight bolt-on.
              </p>
            </div>
          </button>

          {/* Option 2: Custom Itemized Quote */}
          <button
            type="button"
            role="radio"
            aria-checked={pricingType === "custom"}
            onClick={() => handleTypeChange("custom")}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 select-none min-h-[44px] ${
              pricingType === "custom"
                ? "bg-[#091c3e] text-white border-[#091c3e] shadow-xs ring-2 ring-[#091c3e]/15"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pricingType === "custom"
                  ? "bg-white/10 text-amber-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  2. Custom Itemized Quote
                </span>
                {pricingType === "custom" && (
                  <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] mt-0.5 leading-snug ${
                  pricingType === "custom" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Itemized 4-pillar quote: Flight, Land Part, Hotel, and Visa.
              </p>
            </div>
          </button>

          {/* Option 3: Total Package Price Only */}
          <button
            type="button"
            role="radio"
            aria-checked={pricingType === "total_only"}
            onClick={() => handleTypeChange("total_only")}
            className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 select-none min-h-[44px] ${
              pricingType === "total_only"
                ? "bg-[#091c3e] text-white border-[#091c3e] shadow-xs ring-2 ring-[#091c3e]/15"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pricingType === "total_only"
                  ? "bg-white/10 text-amber-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Receipt className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  3. Total Price Only
                </span>
                {pricingType === "total_only" && (
                  <span className="bg-amber-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
              </div>
              <p
                className={`text-[11px] mt-0.5 leading-snug ${
                  pricingType === "total_only" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Single lumpsum quote with no breakup and no markup.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. FIX 6.3: COMPACT PRICE DISTRIBUTION STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Price Distribution:
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
            {effectivePassengers}{" "}
            {effectivePassengers === 1 ? "Traveler" : "Travelers"}
          </span>
        </div>

        <div role="radiogroup" aria-label="Price Distribution" className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            type="button"
            role="radio"
            aria-checked={priceDistribution !== "per_passenger"}
            onClick={() => onChange({ ...pricing, priceDistribution: "total" })}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              priceDistribution !== "per_passenger"
                ? "bg-[#091c3e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Total Only (Standard)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={priceDistribution === "per_passenger"}
            onClick={() =>
              onChange({ ...pricing, priceDistribution: "per_passenger" })
            }
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-bold rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              priceDistribution === "per_passenger"
                ? "bg-[#091c3e] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Split Per Person (₹/pax)
          </button>
        </div>
      </div>

      {/* 4. ACTIVE WORKBENCH: ZERO NESTED CARDS (Clean surface with dividers) */}

      {/* -------------------------------------------------------------
          TYPE 1: SUPPLIER ITINERARY WORKBENCH
          ------------------------------------------------------------- */}
      {pricingType === "supplier" && (
        <div className="space-y-5 pt-1">
          {/* Row 1: Ground Commercials (Supplier Cost + Agency Margin) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Ground Package Commercials
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supplier Cost Input with Indian Currency Formatter */}
              <div>
                <label
                  htmlFor="supplier-cost"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Supplier Cost (Net DMC Rate) *
                </label>
                <IndianCurrencyInput
                  id="supplier-cost"
                  value={supplierCostRupees}
                  placeholder="e.g. 60,000"
                  onChange={(rupees) =>
                    handleUpdateSupplier({ supplierCostPaise: rupees * 100 })
                  }
                  aria-label="Supplier Net Rate in Rupees"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Net rate billed by your local DMC / ground partner.
                </p>
                {priceFlag && (
                  <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{priceFlag.issue}</span>
                  </div>
                )}
              </div>

              {/* Agency Markup with Type Selector & Indian Currency Formatting */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="agency-markup-val"
                    className="text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                  >
                    Agency Margin (Profit) *
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Floor: 8%
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    id="agency-markup-type"
                    value={pricing.markup.type}
                    aria-label="Agency markup type"
                    onChange={(e) => {
                      const type = e.target.value as "percent" | "flat";
                      if (type === "percent") {
                        onChange({
                          ...pricing,
                          markup: { type: "percent", value: 15 },
                        });
                      } else {
                        onChange({
                          ...pricing,
                          markup: { type: "flat", valuePaise: 500000 },
                        });
                      }
                    }}
                    className="px-3 py-2 text-xs rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px]"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>

                  <div className="flex-1">
                    {pricing.markup.type === "flat" ? (
                      <IndianCurrencyInput
                        id="agency-markup-val"
                        value={Math.round(pricing.markup.valuePaise / 100)}
                        placeholder="5,000"
                        onChange={(rupees) =>
                          onChange({
                            ...pricing,
                            markup: {
                              type: "flat",
                              valuePaise: rupees * 100,
                            },
                          })
                        }
                        aria-label="Agency Flat Margin in Rupees"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          id="agency-markup-val"
                          type="number"
                          min={0}
                          aria-label="Agency markup percentage"
                          value={pricing.markup.value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            onChange({
                              ...pricing,
                              markup: { type: "percent", value: val },
                            });
                          }}
                          className={`w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[42px] ${
                            isLowMargin
                              ? "border-amber-400 text-amber-800"
                              : "border-slate-300 text-slate-900"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          %
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>
                    Agency Profit:{" "}
                    <strong className="text-emerald-700 font-mono font-bold">
                      + ₹ {formatInrBare(landMarkupPaise)}
                    </strong>{" "}
                    ({marginPercent.toFixed(1)}%)
                  </span>
                  <span>
                    Land Selling:{" "}
                    <strong className="text-slate-900 font-mono font-bold">
                      ₹ {formatInrBare(landSellingPricePaise)}
                    </strong>
                    {priceDistribution === "per_passenger" && (
                      <span className="text-blue-700 font-bold ml-1">
                        (₹ {landSplitRupees.toLocaleString("en-IN")}/pax)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Margin Notice */}
            {isLowMargin && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Low Margin Notice:</strong> Current markup yields{" "}
                  <strong>{marginPercent.toFixed(1)}%</strong> (below the standard 8% agency safety floor).
                </span>
              </div>
            )}
          </div>

          {/* Row 2: FIX 6.5: Consolidated Flight Option (Single Switch, No Duplicate Badges) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={supplierBreakup.flightIncluded}
                  onChange={(e) =>
                    handleUpdateSupplier({ flightIncluded: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-600" />
                  <span>Include Flight Tickets in this Proposal</span>
                </span>
              </label>
            </div>

            {supplierBreakup.flightIncluded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="supplier-flight-cost"
                      className="text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Flight Cost (₹) *
                    </label>
                    {priceDistribution === "per_passenger" &&
                      supplierFlightRupees > 0 && (
                        <span className="text-[11px] font-bold text-blue-600">
                          ₹ {flightSplitRupees.toLocaleString("en-IN")} / pax
                        </span>
                      )}
                  </div>
                  <IndianCurrencyInput
                    id="supplier-flight-cost"
                    value={supplierFlightRupees}
                    placeholder="e.g. 28,000"
                    onChange={(rupees) =>
                      handleUpdateSupplier({ flightCostPaise: rupees * 100 })
                    }
                    aria-label="Flight Cost in Rupees"
                  />
                </div>

                <div>
                  <label
                    htmlFor="supplier-flight-note"
                    className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Flight Details / Specification Note
                  </label>
                  <input
                    id="supplier-flight-note"
                    type="text"
                    placeholder="e.g. VietJet Air return flights with 20kg baggage"
                    value={supplierBreakup.flightNote || ""}
                    onChange={(e) =>
                      handleUpdateSupplier({ flightNote: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px]"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Flights are excluded from this quote. Proposal will render as Land-Only package.
              </p>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE 2: CUSTOM MADE ITINERARY (Itemized 4 Pillars)
          ------------------------------------------------------------- */}
      {pricingType === "custom" && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Itemized Package Components
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Only components marked as <strong>Included</strong> will appear on the proposal.
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Custom Total Quote
              </span>
              <span className="text-base font-black font-mono text-[#091c3e]">
                ₹ {customTotalRupees.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* 4 Pillars List without heavy nesting */}
          <div className="space-y-3">
            {customItems.map((item) => {
              const Icon = item.icon;
              const isIncluded = item.data?.included ?? false;
              const amountRupees = Math.round(
                (item.data?.amountPaise || 0) / 100
              );
              const splitRupees = Math.round(
                amountRupees / effectivePassengers
              );

              return (
                <div
                  key={item.key}
                  className={`p-3.5 rounded-xl border transition ${
                    isIncluded
                      ? "bg-slate-50/70 border-slate-200"
                      : "bg-slate-100/50 border-slate-200/60 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#091c3e] text-white shrink-0">
                        <Icon className="w-3.5 h-3.5 text-amber-400" />
                      </span>
                      <div>
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 block -mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Inclusion Toggle */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={isIncluded}
                        onChange={(e) =>
                          handleUpdateCustomItem(item.key, {
                            included: e.target.checked,
                          })
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Included</span>
                    </label>
                  </div>

                  {isIncluded ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor={`custom-${item.key}-amount`}
                            className="text-[10px] font-bold uppercase tracking-wider text-slate-600"
                          >
                            Item Price (₹) *
                          </label>
                          {priceDistribution === "per_passenger" &&
                            amountRupees > 0 && (
                              <span className="text-[10px] font-bold text-blue-600">
                                ₹ {splitRupees.toLocaleString("en-IN")} / pax
                              </span>
                            )}
                        </div>
                        <IndianCurrencyInput
                          id={`custom-${item.key}-amount`}
                          value={amountRupees}
                          placeholder="0"
                          onChange={(rupees) =>
                            handleUpdateCustomItem(item.key, {
                              amountPaise: rupees * 100,
                            })
                          }
                          aria-label={`${item.label} Price in Rupees`}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`custom-${item.key}-note`}
                          className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1"
                        >
                          Specification Note
                        </label>
                        <input
                          id={`custom-${item.key}-note`}
                          type="text"
                          placeholder={item.placeholderNote}
                          value={item.data?.note || ""}
                          onChange={(e) =>
                            handleUpdateCustomItem(item.key, {
                              note: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/50">
                      Excluded from quote. Will not appear on client proposal.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TYPE 3: TOTAL PACKAGE PRICE ONLY (No breakup, no markup)
          ------------------------------------------------------------- */}
      {pricingType === "total_only" && (
        <div className="space-y-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="total-package-price"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                >
                  Total Package Selling Price (₹) *
                </label>
                {priceDistribution === "per_passenger" && totalOnlyRupees > 0 && (
                  <span className="text-[11px] font-bold text-blue-600">
                    ₹ {totalOnlySplitRupees.toLocaleString("en-IN")} / pax
                  </span>
                )}
              </div>
              <IndianCurrencyInput
                id="total-package-price"
                value={totalOnlyRupees}
                placeholder="e.g. 1,25,000"
                onChange={handleUpdateTotalOnly}
                aria-label="Total Package Selling Price in Rupees"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Direct total investment quote. Zero breakup rows, component splits, or markups will appear on the client PDF.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. FIX 6.6: EXECUTIVE COMMERCIAL SUMMARY FOOTER BAR */}
      <div className="bg-[#091c3e] text-white rounded-xl p-4 md:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Commercial Line Items */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
              Executive Commercial Breakdown
            </span>
            <div className="text-xs text-slate-200 mt-1.5 space-y-1">
              {pricingType === "supplier" ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">• Land Package:</span>
                    <strong className="font-mono text-white font-bold">
                      ₹ {formatInrBare(landSellingPricePaise)}
                    </strong>
                    {priceDistribution === "per_passenger" && (
                      <span className="text-amber-300 text-[11px]">
                        (₹ {landSplitRupees.toLocaleString("en-IN")}/pax)
                      </span>
                    )}
                  </div>
                  {supplierBreakup.flightIncluded && supplierFlightPaise > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">• Flight Airfare:</span>
                      <strong className="font-mono text-white font-bold">
                        ₹ {formatInrBare(supplierFlightPaise)}
                      </strong>
                      {priceDistribution === "per_passenger" && (
                        <span className="text-amber-300 text-[11px]">
                          (₹ {flightSplitRupees.toLocaleString("en-IN")}/pax)
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-[11px]">
                    <span>• Agency Margin:</span>
                    <span className="font-mono">
                      + ₹ {formatInrBare(landMarkupPaise)} ({marginPercent.toFixed(1)}%)
                    </span>
                  </div>
                </>
              ) : pricingType === "custom" ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-200">
                  {customItems
                    .filter((ci) => ci.data?.included && ci.data.amountPaise > 0)
                    .map((ci) => (
                      <span key={ci.key} className="text-xs">
                        • {ci.label}:{" "}
                        <strong className="font-mono text-white">
                          ₹ {formatInrBare(ci.data?.amountPaise || 0)}
                        </strong>
                      </span>
                    ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">• All-Inclusive Package:</span>
                  <strong className="font-mono text-white font-bold">
                    ₹ {totalOnlyRupees.toLocaleString("en-IN")}
                  </strong>
                  {priceDistribution === "per_passenger" && (
                    <span className="text-amber-300 text-[11px]">
                      (₹ {totalOnlySplitRupees.toLocaleString("en-IN")}/pax)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Total Client Quote Hero Readout */}
          <div className="text-left md:text-right pt-3 md:pt-0 border-t md:border-t-0 border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 block">
              Total Client Selling Price
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight mt-0.5">
              ₹{" "}
              {pricingType === "supplier"
                ? formatInrBare(supplierTotalBasePaise)
                : pricingType === "custom"
                ? customTotalRupees.toLocaleString("en-IN")
                : totalOnlyRupees.toLocaleString("en-IN")}
            </div>
            {priceDistribution === "per_passenger" && (
              <div className="text-xs font-semibold text-amber-300 mt-0.5">
                ₹{" "}
                {pricingType === "supplier"
                  ? totalSplitRupees.toLocaleString("en-IN")
                  : pricingType === "custom"
                  ? customTotalSplitRupees.toLocaleString("en-IN")
                  : totalOnlySplitRupees.toLocaleString("en-IN")}{" "}
                / person
              </div>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 mt-1">
              <Check className="w-3.5 h-3.5" /> Markup 100% hidden on client PDF
            </span>
          </div>
        </div>
      </div>

      {/* 6. PROPOSAL TERMS & VALIDITY: Inline 2-Column Row */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
          Proposal Terms & Quote Validity
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pricing Basis */}
          <div>
            <label
              htmlFor="pricing-basis"
              className="block text-[11px] font-bold text-slate-600 mb-1"
            >
              Pricing Basis
            </label>
            <select
              id="pricing-basis"
              value={pricing.basis}
              onChange={(e) =>
                onChange({
                  ...pricing,
                  basis: e.target.value as Pricing["basis"],
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px]"
            >
              <option value="per_person_twin_sharing">
                Per Person Twin Sharing
              </option>
              <option value="per_person">Per Person (General)</option>
              <option value="total_group">Total Package (Couple / Group)</option>
              <option value="per_room">Per Room / Night</option>
            </select>
          </div>

          {/* Quote Validity */}
          <div>
            <label
              htmlFor="pricing-validity-days"
              className="block text-[11px] font-bold text-slate-600 mb-1"
            >
              Quote Validity (Days)
            </label>
            <input
              id="pricing-validity-days"
              type="number"
              min={1}
              value={pricing.validityDays}
              onChange={(e) =>
                onChange({
                  ...pricing,
                  validityDays: parseInt(e.target.value, 10) || 7,
                })
              }
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[42px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
