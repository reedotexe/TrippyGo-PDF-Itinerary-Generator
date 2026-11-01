"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ListChecks,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";

interface InclusionsPanelProps {
  inclusions: string[];
  exclusions: string[];
  onChange: (updated: { inclusions: string[]; exclusions: string[] }) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

const POPULAR_INCLUSIONS_PRESETS = [
  "Daily Breakfast at Hotel",
  "Airport Transfers (Arrival & Departure)",
  "Private AC Vehicle for Transfers & Sightseeing",
  "Sightseeing as per Itinerary",
  "Tolls, Parking, Interstate Taxes & Driver Allowance",
  "24/7 Dedicated On-Trip Support",
  "Welcome Drink on Arrival",
];

const POPULAR_EXCLUSIONS_PRESETS = [
  "Airfare / Flight Tickets (Unless Specified)",
  "Personal Expenses, Laundry & Beverages",
  "Travel Insurance & Medical Expenses",
  "Monument, Museum & Activity Entry Fees",
  "Early Check-in & Late Checkout Charges",
  "Optional Water Sports & Adventure Activities",
  "Tips, Portage & Gratuities",
];

export default function InclusionsPanel({
  inclusions = [],
  exclusions = [],
  onChange,
  reviewFlags = [],
}: InclusionsPanelProps) {
  const [newInc, setNewInc] = useState("");
  const [newExc, setNewExc] = useState("");

  const handleAddInclusion = (customText?: string) => {
    const text = (customText || newInc).trim();
    if (!text) return;
    if (!inclusions.includes(text)) {
      onChange({ inclusions: [...inclusions, text], exclusions });
    }
    setNewInc("");
  };

  const handleRemoveInclusion = (index: number) => {
    onChange({
      inclusions: inclusions.filter((_, i) => i !== index),
      exclusions,
    });
  };

  const handleUpdateInclusion = (index: number, text: string) => {
    const copy = [...inclusions];
    copy[index] = text;
    onChange({ inclusions: copy, exclusions });
  };

  const handleAddExclusion = (customText?: string) => {
    const text = (customText || newExc).trim();
    if (!text) return;
    if (!exclusions.includes(text)) {
      onChange({ inclusions, exclusions: [...exclusions, text] });
    }
    setNewExc("");
  };

  const handleRemoveExclusion = (index: number) => {
    onChange({
      inclusions,
      exclusions: exclusions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateExclusion = (index: number, text: string) => {
    const copy = [...exclusions];
    copy[index] = text;
    onChange({ inclusions, exclusions: copy });
  };

  // 1-Click Load Standard Pack
  const handleLoadStandardPack = () => {
    const standardInc = [
      "Daily Breakfast at Hotel",
      "Airport Transfers (Arrival & Departure)",
      "Private AC Vehicle for Transfers & Sightseeing",
      "Sightseeing as per Itinerary",
      "Tolls, Parking, Interstate Taxes & Driver Allowance",
      "24/7 Dedicated On-Trip Support",
    ];
    const standardExc = [
      "Airfare / Flight Tickets (Unless Specified)",
      "Personal Expenses, Laundry & Beverages",
      "Travel Insurance & Medical Expenses",
      "Monument & Activity Entry Tickets",
      "Early Check-in & Late Checkout Charges",
    ];

    // Merge uniquely
    const mergedInc = Array.from(new Set([...inclusions, ...standardInc]));
    const mergedExc = Array.from(new Set([...exclusions, ...standardExc]));

    onChange({ inclusions: mergedInc, exclusions: mergedExc });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 font-body">
      {/* 1. HEADER BAR: Editorial Neutral Styling with 1-Click Preset Pack */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#091c3e] text-white shadow-2xs">
              <ListChecks className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Package Inclusions & Exclusions
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {inclusions.length} Inclusions • {exclusions.length} Exclusions
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Clearly specifies covered services and exclusions on Page 4 of the client proposal.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadStandardPack}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition shrink-0 self-start sm:self-auto"
          title="Pre-populate standard travel inclusions and exclusions"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>+ Load Standard Preset Pack</span>
        </button>
      </div>

      {/* 2. TWO-COLUMN WORKBENCH: Calm Editorial Neutral Backgrounds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INCLUSIONS COLUMN */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3.5">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                What is Included ({inclusions.length})
              </span>
            </div>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              Client Covered
            </span>
          </div>

          {/* FIX 5.2: 1-Click Popular Preset Chips */}
          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick Add Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {POPULAR_INCLUSIONS_PRESETS.map((preset) => {
                const isAdded = inclusions.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddInclusion(preset)}
                    disabled={isAdded}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                      isAdded
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-60"
                        : "bg-white text-slate-700 hover:text-emerald-800 hover:bg-emerald-50/70 border-slate-200 hover:border-emerald-300 shadow-2xs"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                    ) : (
                      <span className="text-emerald-600 font-bold">+</span>
                    )}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Inclusions List */}
          <div className="space-y-1.5 min-h-[120px]">
            {inclusions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                No inclusions added yet. Click a preset above or type below.
              </div>
            ) : (
              inclusions.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-2 p-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
                >
                  <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 ml-1.5">
                    <Check className="w-2.5 h-2.5 text-emerald-600 font-bold" />
                  </span>
                  <input
                    type="text"
                    value={item}
                    aria-label={`Inclusion item ${idx + 1}`}
                    onChange={(e) => handleUpdateInclusion(idx, e.target.value)}
                    className="flex-1 px-1 py-1 text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveInclusion(idx)}
                    aria-label={`Remove inclusion item ${idx + 1}`}
                    className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-80 group-hover:opacity-100 mr-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Inline Add Inclusion Input */}
          <div className="flex gap-2 pt-1 border-t border-slate-200/60">
            <input
              id="new-inclusion-input"
              type="text"
              value={newInc}
              onChange={(e) => setNewInc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInclusion();
                }
              }}
              placeholder="Type custom inclusion and press Enter..."
              className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => handleAddInclusion()}
              className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* EXCLUSIONS COLUMN */}
        <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3.5">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-rose-500/15 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                What is Excluded ({exclusions.length})
              </span>
            </div>
            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/60">
              Not Included
            </span>
          </div>

          {/* FIX 5.2: 1-Click Popular Preset Chips */}
          <div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick Add Presets:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {POPULAR_EXCLUSIONS_PRESETS.map((preset) => {
                const isAdded = exclusions.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddExclusion(preset)}
                    disabled={isAdded}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                      isAdded
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-60"
                        : "bg-white text-slate-700 hover:text-rose-800 hover:bg-rose-50/70 border-slate-200 hover:border-rose-300 shadow-2xs"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="w-2.5 h-2.5 text-rose-600" />
                    ) : (
                      <span className="text-rose-600 font-bold">+</span>
                    )}
                    <span>{preset}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Exclusions List */}
          <div className="space-y-1.5 min-h-[120px]">
            {exclusions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                No exclusions added yet. Click a preset above or type below.
              </div>
            ) : (
              exclusions.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-2 p-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
                >
                  <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center shrink-0 ml-1.5">
                    <span className="text-rose-600 font-bold text-[10px]">✕</span>
                  </span>
                  <input
                    type="text"
                    value={item}
                    aria-label={`Exclusion item ${idx + 1}`}
                    onChange={(e) => handleUpdateExclusion(idx, e.target.value)}
                    className="flex-1 px-1 py-1 text-xs font-medium text-slate-800 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExclusion(idx)}
                    aria-label={`Remove exclusion item ${idx + 1}`}
                    className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-80 group-hover:opacity-100 mr-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Inline Add Exclusion Input */}
          <div className="flex gap-2 pt-1 border-t border-slate-200/60">
            <input
              id="new-exclusion-input"
              type="text"
              value={newExc}
              onChange={(e) => setNewExc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExclusion();
                }
              }}
              placeholder="Type custom exclusion and press Enter..."
              className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={() => handleAddExclusion()}
              className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
