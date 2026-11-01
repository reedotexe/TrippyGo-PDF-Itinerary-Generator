"use client";

import React, { useState } from "react";
import { Package, SalespersonContact } from "@/lib/schema/itinerary";
import {
  AlertCircle,
  RotateCcw,
  X,
  Plus,
  ClipboardList,
  Sparkles,
  Check,
  Compass,
  UserCheck,
  Calendar,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import ImagePickerModal from "./ImagePickerModal";
import { findPresetsForDestinations, presetToItineraryImage } from "@/lib/images/cover-presets";

interface BasicsPanelProps {
  packageData: Package;
  onChange: (updated: Package) => void;
  salesperson?: SalespersonContact;
  onSalespersonChange?: (updated: SalespersonContact) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
  extractedSnapshot?: any;
}

export default function BasicsPanel({
  packageData,
  onChange,
  salesperson,
  onSalespersonChange,
  reviewFlags = [],
  extractedSnapshot,
}: BasicsPanelProps) {
  const [newDest, setNewDest] = useState("");
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);
  const matchingPresets = findPresetsForDestinations(packageData.destinations).slice(0, 4);

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

  // Bidirectional auto-calculation: Nights -> Days
  const handleNightsChange = (rawNights: number) => {
    const nights = Math.max(0, rawNights);
    onChange({
      ...packageData,
      nights,
      days: nights + 1, // Auto-set days = nights + 1
    });
  };

  // Bidirectional auto-calculation: Days -> Nights
  const handleDaysChange = (rawDays: number) => {
    const days = Math.max(1, rawDays);
    onChange({
      ...packageData,
      days,
      nights: Math.max(0, days - 1), // Auto-set nights = days - 1
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
    <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
      {/* 1. PANEL HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#091c3e] shrink-0" aria-hidden="true" />
          <span>Trip Overview & Logistics</span>
        </h3>
        {extractedSnapshot?.rawTitle && (
          <button
            type="button"
            onClick={() => onChange({ ...packageData, title: extractedSnapshot.rawTitle })}
            title="Reset title to extracted value"
            aria-label="Reset title to extracted value"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1.5 py-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Extracted
          </button>
        )}
      </div>

      {/* 2. TRIP IDENTITY (2-COLUMN HEADER ROW) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="basic-package-title"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Package Title * <span className="text-slate-400 font-normal lowercase">(Cover Headline)</span>
          </label>
          <div className="relative">
            <input
              id="basic-package-title"
              type="text"
              value={packageData.title}
              onChange={(e) => onChange({ ...packageData, title: e.target.value })}
              className={`w-full px-3.5 py-2 text-sm rounded-lg border font-medium focus:outline-none focus-visible:ring-2 transition ${
                titleFlag
                  ? "border-amber-400 bg-amber-50/30 focus-visible:ring-amber-400 text-slate-900"
                  : "border-slate-300 focus:border-blue-500 focus-visible:ring-blue-200 text-slate-800"
              }`}
              placeholder="e.g. Exotic Bhutan – 8 Days from Bagdogra"
            />
            {titleFlag && (
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{titleFlag.issue}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="basic-guest-name"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
          >
            Guest / Client Name <span className="text-slate-400 font-normal lowercase">(Optional)</span>
          </label>
          <input
            id="basic-guest-name"
            type="text"
            value={packageData.guestName || ""}
            onChange={(e) => onChange({ ...packageData, guestName: e.target.value })}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:border-blue-500 focus-visible:ring-blue-200 focus:outline-none focus-visible:ring-2 transition font-medium text-slate-800"
            placeholder="e.g. Mr. & Mrs. Sharma (or Valued Traveller)"
          />
        </div>
      </div>

      {/* 3. DESTINATIONS CIRCUIT */}
      <div>
        <label
          htmlFor="basic-new-dest"
          className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          Destinations Circuit *
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {packageData.destinations.map((dest) => (
            <span
              key={dest}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 pl-3 pr-1.5 py-1 rounded-full text-xs font-semibold"
            >
              {dest}
              <button
                type="button"
                onClick={() => handleRemoveDestination(dest)}
                aria-label={`Remove destination ${dest}`}
                className="w-5 h-5 inline-flex items-center justify-center rounded-full text-blue-600 hover:text-blue-900 hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            id="basic-new-dest"
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
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 text-slate-800 font-medium"
          />
          <button
            type="button"
            onClick={handleAddDestination}
            className="min-h-[38px] px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 transition"
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

      {/* 4. COVER PAGE HERO PHOTO (SLEEK HORIZONTAL STRIP - NO GHOST OVERLAY, NO 3-SENTENCE LECTURE) */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-slate-100/70 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* A4 Thumbnail Preview (Clean 80x113px portrait without illegible ghost overlay) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsCoverPickerOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsCoverPickerOpen(true);
              }
            }}
            title="Click to choose or change cover photo"
            aria-label="Click to choose or change cover photo"
            className="relative w-20 sm:w-24 aspect-[1/1.414] rounded-lg overflow-hidden shadow-sm border border-slate-300 bg-slate-900 group cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 select-none"
          >
            <img
              src={
                packageData.coverImage?.imageUrl ||
                "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80"
              }
              alt="Cover Preview"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
            {/* Clean A4 ratio badge */}
            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-white text-[8px] font-bold uppercase tracking-wider backdrop-blur-xs">
              A4
            </span>
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-semibold text-center p-1">
              <span>Change</span>
            </div>
          </div>

          {/* Details, Status & Actions */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#091c3e]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Cover Photo Presentation
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  A4 Portrait (1:1.414)
                </span>
              </div>

              {/* Action buttons on the right */}
              <div className="flex items-center gap-2">
                {packageData.coverImage && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...packageData, coverImage: null })}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition border border-rose-200"
                  >
                    Reset to Auto
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCoverPickerOpen(true)}
                  className="min-h-[34px] px-3.5 py-1.5 bg-[#091c3e] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{packageData.coverImage ? "Change Cover Photo" : "Choose Cover Photo"}</span>
                </button>
              </div>
            </div>

            {/* Status & Single Tooltip Note */}
            <div className="text-xs text-slate-600">
              {packageData.coverImage ? (
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Custom Cover Active: <strong className="text-slate-800">{packageData.coverImage.photographerName || "Selected Image"}</strong>
                  </span>
                </span>
              ) : (
                <span className="text-slate-500">
                  Currently using automatic fallback from Day 1. Select a curated portrait hero for optimal Page 1 impact.
                </span>
              )}
            </div>

            {/* Quick 1-Click Destination Presets */}
            {matchingPresets.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Presets:</span>
                </span>
                {matchingPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ ...packageData, coverImage: presetToItineraryImage(preset) })}
                    className="px-2.5 py-1 rounded-md bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 text-[11px] font-semibold text-slate-700 shadow-2xs transition flex items-center gap-1"
                  >
                    <span>{preset.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. TRIP LOGISTICS & ACCOMMODATION (INLINE STRIP WITH BIDIRECTIONAL AUTO-CALC) */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#091c3e]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Duration & Travel Dates
          </h4>
        </div>

        {/* 4-Column Duration & Dates Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Nights (Auto-syncs Days = Nights + 1) */}
          <div>
            <label htmlFor="basic-nights" className="block text-xs font-bold text-slate-700 mb-1">
              Nights
            </label>
            <input
              id="basic-nights"
              type="number"
              min={0}
              value={packageData.nights}
              onChange={(e) => handleNightsChange(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-syncs Days</span>
          </div>

          {/* Days (Auto-syncs Nights = Days - 1) */}
          <div>
            <label htmlFor="basic-days" className="block text-xs font-bold text-slate-700 mb-1">
              Days
            </label>
            <input
              id="basic-days"
              type="number"
              min={1}
              value={packageData.days}
              onChange={(e) => handleDaysChange(parseInt(e.target.value, 10) || 1)}
              className={`w-full px-3.5 py-2 text-sm font-semibold rounded-lg border focus-visible:outline-none focus-visible:ring-2 text-slate-900 ${
                daysFlag ? "border-amber-400 bg-amber-50/40 focus-visible:ring-amber-400" : "border-slate-300 focus-visible:ring-blue-500"
              }`}
            />
            {daysFlag ? (
              <span className="text-[10px] text-amber-700 mt-0.5 block">{daysFlag.issue}</span>
            ) : (
              <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-syncs Nights</span>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="basic-start-date" className="block text-xs font-bold text-slate-700 mb-1">
              Trip Start Date
            </label>
            <input
              id="basic-start-date"
              type="date"
              value={packageData.startDate || ""}
              onChange={(e) => onChange({ ...packageData, startDate: e.target.value || null })}
              className="w-full px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-800"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Departure anchor</span>
          </div>

          {/* End Date (Computed) */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-1">
              Trip End Date (Computed)
            </span>
            <div className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200 truncate">
              {computedEndDate}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Based on Start + Nights</span>
          </div>
        </div>

        {/* 4-Column Travellers & Accommodation Strip */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#091c3e]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Travellers & Accommodation
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="basic-adults" className="block text-xs font-semibold text-slate-600 mb-1">
                Adults (12+ yrs)
              </label>
              <input
                id="basic-adults"
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
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="basic-children" className="block text-xs font-semibold text-slate-600 mb-1">
                Children (2–11 yrs)
              </label>
              <input
                id="basic-children"
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
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="basic-infants" className="block text-xs font-semibold text-slate-600 mb-1">
                Infants (0–2 yrs)
              </label>
              <input
                id="basic-infants"
                type="number"
                min={0}
                value={packageData.travellers.infants ?? 0}
                onChange={(e) =>
                  onChange({
                    ...packageData,
                    travellers: {
                      ...packageData.travellers,
                      infants: parseInt(e.target.value, 10) || 0,
                    },
                  })
                }
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="basic-rooms" className="block text-xs font-semibold text-slate-600 mb-1">
                Rooms Required
              </label>
              <input
                id="basic-rooms"
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
                className="w-full px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. INTEGRATED SALES SPECIALIST DETAILS (REPLACING SEPARATE 7TH CARD & ZERO GST) */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#091c3e]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Trip Specialist Contact (Printed on PDF)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Trip Specialist Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={salesperson?.name || ""}
              onChange={(e) => onSalespersonChange?.({ ...salesperson, name: e.target.value })}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              Direct Phone / WhatsApp
            </label>
            <input
              id="contact-phone"
              type="text"
              value={salesperson?.phone || ""}
              onChange={(e) => onSalespersonChange?.({ ...salesperson, phone: e.target.value })}
              placeholder="e.g. +91 98765 12345"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition text-slate-900"
            />
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Official Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={salesperson?.email || ""}
              onChange={(e) => onSalespersonChange?.({ ...salesperson, email: e.target.value })}
              placeholder="e.g. rahul@trippygo.com"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Cover Image Picker Modal (Mode: A4 Portrait Cover) */}
      <ImagePickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        mode="cover"
        initialQuery={packageData.destinations[0] || packageData.title}
        destinationFallback={packageData.destinations[0] || "Dubai"}
        currentImage={packageData.coverImage}
        onSelectImage={(img) => {
          onChange({
            ...packageData,
            coverImage: img,
          });
        }}
      />
    </div>
  );
}
