"use client";

import React from "react";
import { Pricing } from "@/lib/schema/itinerary";
import {
  calculatePricingBreakdown,
  formatInrBare,
} from "@/lib/pricing";
import { AlertCircle, ShieldAlert, AlertTriangle } from "lucide-react";

interface PricingPanelProps {
  pricing: Pricing;
  onChange: (updatedPricing: Pricing) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

export default function PricingPanel({
  pricing,
  onChange,
  reviewFlags = [],
}: PricingPanelProps) {
  const netAmountRupees = Math.round(pricing.netAmountPaise / 100);

  // Compute live breakdown using pure pricing engine
  const breakdown = calculatePricingBreakdown(
    pricing.netAmountPaise,
    pricing.markup,
    pricing.gstMode,
    pricing.gstRate,
    pricing.sacCode || "998552",
    { minMarginFloor: 8 }
  );

  const priceFlag = reviewFlags.find(
    (f) => f.field === "pricing.netAmountPaise" || f.field === "pricing"
  );

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>💰</span> Commercials, Markup & GST
        </h3>
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded text-[11px] font-semibold">
          <ShieldAlert className="w-3 h-3 text-amber-600" /> Staff Confidential View
        </span>
      </div>

      {/* Internal Net & Markup Calculation Card */}
      <div className="p-5 rounded-xl bg-slate-900 text-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Net Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Supplier Net Cost (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min={0}
                value={netAmountRupees}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  onChange({
                    ...pricing,
                    netAmountPaise: val * 100, // Stored as integer paise
                  });
                }}
                className={`w-full pl-8 pr-3 py-2 text-base font-mono font-bold rounded-lg bg-slate-800 border focus:outline-none focus:ring-2 ${
                  priceFlag
                    ? "border-amber-400 text-amber-300 focus:ring-amber-400"
                    : "border-slate-700 text-white focus:ring-blue-400"
                }`}
              />
            </div>
            {priceFlag && (
              <div className="mt-1 text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {priceFlag.issue}
              </div>
            )}
          </div>

          {/* Markup Mode & Value */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Agency Markup
              </label>
              <span className="text-[11px] text-slate-400">
                Floor: {breakdown.minMarginFloor}%
              </span>
            </div>
            <div className="flex gap-2">
              <select
                value={pricing.markup.type}
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
                className="px-3 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>

              <input
                type="number"
                min={0}
                value={
                  pricing.markup.type === "percent"
                    ? pricing.markup.value
                    : Math.round(pricing.markup.valuePaise / 100)
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (pricing.markup.type === "percent") {
                    onChange({
                      ...pricing,
                      markup: { type: "percent", value: val },
                    });
                  } else {
                    onChange({
                      ...pricing,
                      markup: { type: "flat", valuePaise: Math.round(val * 100) },
                    });
                  }
                }}
                className={`flex-1 px-3 py-2 text-sm font-bold font-mono rounded-lg bg-slate-800 border ${
                  breakdown.isLowMargin
                    ? "border-amber-500 text-amber-300"
                    : "border-slate-700 text-white"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Low Margin Warning Alert Badge */}
        {breakdown.isLowMargin && (
          <div className="bg-amber-950/70 border border-amber-600/60 rounded-lg p-3 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Low Margin Warning:</span> Markup yields{" "}
              <strong>{breakdown.marginPercent.toFixed(1)}%</strong> which is below the agency 8%
              minimum margin floor. Salesperson override applied.
            </div>
          </div>
        )}

        {/* Live Selling Price & Margin Summary */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
          <div className="bg-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">
              Client Selling Price (Base)
            </div>
            <div className="text-xl font-extrabold text-white mt-0.5 font-mono">
              ₹ {breakdown.baseSellingPriceFormatted}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Nearest Rupee Rounding Applied
            </div>
          </div>
          <div className="bg-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Agency Margin</div>
            <div
              className={`text-xl font-extrabold mt-0.5 font-mono ${
                breakdown.isLowMargin ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              +₹ {formatInrBare(breakdown.markupPaise)}{" "}
              <span className="text-xs font-normal">({breakdown.marginPercent.toFixed(1)}%)</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Net: ₹ {formatInrBare(pricing.netAmountPaise)}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Basis, GST, Validity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pricing Basis */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pricing Basis</label>
          <select
            value={pricing.basis}
            onChange={(e) => onChange({ ...pricing, basis: e.target.value as Pricing["basis"] })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200"
          >
            <option value="per_person_twin_sharing">Per Person Twin Sharing</option>
            <option value="per_person">Per Person (General)</option>
            <option value="total_group">Total Package (Couple / Group)</option>
            <option value="per_room">Per Room / Night</option>
          </select>
        </div>

        {/* GST Scheme */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">GST Display Mode</label>
          <select
            value={pricing.gstMode}
            onChange={(e) => onChange({ ...pricing, gstMode: e.target.value as Pricing["gstMode"] })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200"
          >
            <option value="inclusive">5% Inclusive (Standard Tour Package)</option>
            <option value="extra">5% Extra (Added to Invoice)</option>
            <option value="hidden">Hidden / All-Inclusive</option>
          </select>
        </div>

        {/* Quote Validity */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Quote Validity (Days)
          </label>
          <input
            type="number"
            min={1}
            value={pricing.validityDays}
            onChange={(e) =>
              onChange({
                ...pricing,
                validityDays: parseInt(e.target.value, 10) || 7,
              })
            }
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
