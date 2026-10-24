"use client";

import React, { useState } from "react";
import { Package } from "@/lib/schema/itinerary";
import { AlertCircle, RotateCcw, X, Plus } from "lucide-react";

interface BasicsPanelProps {
  packageData: Package;
  onChange: (updated: Package) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
  extractedSnapshot?: any;
}

export default function BasicsPanel({
  packageData,
  onChange,
  reviewFlags = [],
  extractedSnapshot,
}: BasicsPanelProps) {
  const [newDest, setNewDest] = useState("");

  const getFlag = (fieldName: string) => {
    return reviewFlags.find((f) => f.field === `package.${fieldName}` || f.field === fieldName);
  };

  const handleAddDestination = () => {
    if (!newDest.trim()) return;
    const trimmed = newDest.trim();
    if (!packageData.destinations.includes(trimmed)) {
      onChange({
        ...packageData,
        destinations: [...packageData.destinations, trimmed],
      });
    }
    setNewDest("");
  };

  const handleRemoveDestination = (dest: string) => {
    onChange({
      ...packageData,
      destinations: packageData.destinations.filter((d) => d !== dest),
    });
  };

  // Compute End Date
  let computedEndDate = "TBD";
  if (packageData.startDate) {
    const [y, m, d] = packageData.startDate.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + (packageData.nights || 0));
    computedEndDate = date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  }

  const titleFlag = getFlag("title");
  const destFlag = getFlag("destinations");
  const daysFlag = getFlag("days");

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>📋</span> Trip Overview & Logistics
        </h3>
        {extractedSnapshot?.rawTitle && (
          <button
            onClick={() => onChange({ ...packageData, title: extractedSnapshot.rawTitle })}
            title="Reset title to extracted value"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset to Extracted
          </button>
        )}
      </div>

      {/* Package Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Package Title *
        </label>
        <div className="relative">
          <input
            type="text"
            value={packageData.title}
            onChange={(e) => onChange({ ...packageData, title: e.target.value })}
            className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition ${
              titleFlag
                ? "border-amber-400 bg-amber-50/30 focus:ring-amber-400"
                : "border-slate-300 focus:border-blue-500 focus:ring-blue-200"
            }`}
            placeholder="e.g. Kashmir Paradise Escape"
          />
          {titleFlag && (
            <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{titleFlag.issue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Destinations Tag Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Destinations Circuit *
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {packageData.destinations.map((dest) => (
            <span
              key={dest}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-medium"
            >
              {dest}
              <button
                type="button"
                onClick={() => handleRemoveDestination(dest)}
                className="hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newDest}
            onChange={(e) => setNewDest(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDestination();
              }
            }}
            placeholder="Add destination (e.g. Gulmarg) and press Enter"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddDestination}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {destFlag && (
          <div className="mt-1 text-xs text-amber-700 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {destFlag.issue}
          </div>
        )}
      </div>

      {/* Nights, Days, Dates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Nights */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nights</label>
          <input
            type="number"
            min={0}
            value={packageData.nights}
            onChange={(e) => {
              const nights = parseInt(e.target.value, 10) || 0;
              onChange({
                ...packageData,
                nights,
                days: nights + 1, // Auto synchronize days = nights + 1
              });
            }}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Days */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Days</label>
          <input
            type="number"
            min={1}
            value={packageData.days}
            onChange={(e) => onChange({ ...packageData, days: parseInt(e.target.value, 10) || 1 })}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${
              daysFlag ? "border-amber-400 bg-amber-50/40" : "border-slate-300"
            }`}
          />
          {daysFlag && <span className="text-[10px] text-amber-700">{daysFlag.issue}</span>}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Trip Start Date</label>
          <input
            type="date"
            value={packageData.startDate || ""}
            onChange={(e) => onChange({ ...packageData, startDate: e.target.value || null })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* End Date (Computed) */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Trip End Date (Computed)
          </label>
          <div className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
            {computedEndDate}
          </div>
        </div>
      </div>

      {/* Travellers Details */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Travellers & Accommodation
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-slate-600">Adults (12+ yrs)</span>
            <input
              type="number"
              min={1}
              value={packageData.travellers.adults}
              onChange={(e) =>
                onChange({
                  ...packageData,
                  travellers: {
                    ...packageData.travellers,
                    adults: parseInt(e.target.value, 10) || 1,
                  },
                })
              }
              className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <span className="text-xs text-slate-600">Children (2–11 yrs)</span>
            <input
              type="number"
              min={0}
              value={packageData.travellers.children}
              onChange={(e) =>
                onChange({
                  ...packageData,
                  travellers: {
                    ...packageData.travellers,
                    children: parseInt(e.target.value, 10) || 0,
                  },
                })
              }
              className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300"
            />
          </div>
          <div>
            <span className="text-xs text-slate-600">Rooms</span>
            <input
              type="number"
              min={1}
              value={packageData.travellers.rooms}
              onChange={(e) =>
                onChange({
                  ...packageData,
                  travellers: {
                    ...packageData.travellers,
                    rooms: parseInt(e.target.value, 10) || 1,
                  },
                })
              }
              className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
