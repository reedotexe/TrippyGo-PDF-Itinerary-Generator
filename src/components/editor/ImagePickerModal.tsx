"use client";

import React, { useState, useEffect } from "react";
import { NormalizedImage, buildEditorialCoverQuery, ImageOrientation } from "@/lib/images/client";
import {
  COVER_PRESETS,
  CoverPreset,
  findPresetsForDestinations,
  presetToItineraryImage,
} from "@/lib/images/cover-presets";
import { ItineraryImage } from "@/lib/schema/itinerary";
import {
  Search,
  X,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Upload,
  Eye,
  Check,
  Compass,
  Layers,
  Crop,
} from "lucide-react";
import CoverImageCropper from "./CoverImageCropper";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber?: number;
  mode?: "day" | "cover";
  initialQuery: string;
  destinationFallback?: string;
  currentImage?: ItineraryImage | null;
  onSelectImage: (image: ItineraryImage | null) => void;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  dayNumber = 1,
  mode = "day",
  initialQuery,
  destinationFallback,
  currentImage,
  onSelectImage,
}: ImagePickerModalProps) {
  const isCoverMode = mode === "cover";

  // Tabs: 'presets' | 'search' | 'upload'
  const [activeTab, setActiveTab] = useState<"presets" | "search" | "upload">(
    isCoverMode ? "presets" : "search"
  );

  // Search & Filter State
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<NormalizedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<ImageOrientation>(
    isCoverMode ? "portrait" : "all"
  );

  // Upload Tab Preview
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const fetchImages = async (searchQuery: string, orientOverride?: ImageOrientation) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const activeOrient = orientOverride || orientation;
      const orientationParam = `&orientation=${activeOrient}`;
      const finalQuery = isCoverMode ? buildEditorialCoverQuery(searchQuery) : searchQuery;
      const res = await fetch(
        `/api/images/search?query=${encodeURIComponent(finalQuery)}${orientationParam}`
      );
      const data = await res.json();
      if (res.ok && data.images) {
        setImages(data.images);
      } else {
        setError(data.error || "Failed to load photos");
      }
    } catch (err) {
      setError("Network error while searching images");
    } finally {
      setIsLoading(false);
    }
  };

  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      const initialTerm = initialQuery || destinationFallback || "Dubai travel scenic";
      setQuery(initialTerm);
      const initialOrient: ImageOrientation = isCoverMode ? "portrait" : "all";
      setOrientation(initialOrient);
      setActiveTab(isCoverMode ? "presets" : "search");
      setUploadedDataUrl(null);
      setUploadedFileName("");
      fetchImages(initialTerm, initialOrient);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCloseRef.current();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectNormalized = async (img: NormalizedImage) => {
    // 1. If Unsplash, fire download tracking API
    if (img.provider === "unsplash" && img.downloadLocation) {
      fetch("/api/images/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: img.provider,
          photoId: img.photoId,
          downloadLocation: img.downloadLocation,
        }),
      }).catch((e) => console.warn("Failed tracking download:", e));
    }

    // 2. Format to ItineraryImage schema
    const formatted: ItineraryImage = {
      provider: img.provider,
      photoId: img.photoId,
      imageUrl: img.fullUrl,
      thumbnailUrl: img.thumbUrl,
      photographerName: img.photographerName,
      photographerUrl: img.photographerUrl,
      downloadLocation: img.downloadLocation,
    };

    onSelectImage(formatted);
    onClose();
  };

  const handleSelectPreset = (preset: CoverPreset) => {
    const formatted = presetToItineraryImage(preset);
    onSelectImage(formatted);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP)");
      return;
    }

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCropped = (croppedDataUrl: string) => {
    const formatted: ItineraryImage = {
      provider: "upload",
      photoId: isCoverMode ? `upload-cover-${Date.now()}` : `upload-day-${dayNumber}-${Date.now()}`,
      imageUrl: croppedDataUrl,
      thumbnailUrl: croppedDataUrl,
      photographerName: "Custom Direct Upload",
      photographerUrl: "",
      downloadLocation: null,
    };

    onSelectImage(formatted);
    onClose();
  };

  const handleApplyUpload = () => {
    if (!uploadedDataUrl) return;

    const formatted: ItineraryImage = {
      provider: "upload",
      photoId: isCoverMode ? `upload-cover-${Date.now()}` : `upload-day-${dayNumber}-${Date.now()}`,
      imageUrl: uploadedDataUrl,
      thumbnailUrl: uploadedDataUrl,
      photographerName: "Custom Direct Upload",
      photographerUrl: "",
      downloadLocation: null,
    };

    onSelectImage(formatted);
    onClose();
  };

  const handleClear = () => {
    onSelectImage(null);
    onClose();
  };

  // Filter Presets by Region or Destination
  const matchingDestinationPresets = findPresetsForDestinations(
    destinationFallback ? [destinationFallback] : []
  );
  const filteredPresets =
    selectedRegion === "All"
      ? COVER_PRESETS
      : selectedRegion === "Matching"
      ? matchingDestinationPresets
      : COVER_PRESETS.filter((p) => p.region === selectedRegion);

  const regions = [
    "All",
    "Matching",
    "Middle East",
    "Southeast Asia",
    "India & Subcontinent",
    "Europe",
    "Island Escapes",
    "East Asia",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-picker-modal-title"
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${
                  isCoverMode ? "bg-[#091c3e]" : "bg-blue-600"
                }`}
              >
                {isCoverMode ? <Compass className="w-3.5 h-3.5" /> : dayNumber}
              </span>
              <h2 id="image-picker-modal-title" className="text-base font-bold text-slate-800">
                {isCoverMode ? "Select A4 Portrait Cover Hero Photo" : `Select Photo for Day ${dayNumber}`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isCoverMode
                ? "Sourced in high-resolution A4 portrait ratio (1:1.414). Keep subject centered in the 45% safe zone."
                : "Photos are cropped to square (1:1) on the right side of the day block in the final PDF proposal."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCoverMode && (
              <button
                type="button"
                onClick={() => setShowSafeZone(!showSafeZone)}
                title="Toggle Safe-Zone composition guides"
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition flex items-center gap-1.5 ${
                  showSafeZone
                    ? "bg-amber-50 text-amber-800 border-amber-300 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Safe Zone {showSafeZone ? "ON" : "OFF"}</span>
              </button>
            )}

            {currentImage && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear selected photo"
                className="px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium border border-red-200 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Reset to Auto
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close photo picker modal"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. MODE TABS (Available in both Cover and Day modes) */}
        <div className="px-6 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex gap-2 py-2 overflow-x-auto">
            {isCoverMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("presets")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "presets"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Curated Luxury Presets</span>
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] rounded-full font-black">
                    {COVER_PRESETS.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "search"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Multi-Stock Portrait Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "upload"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom Upload & Crop</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("search")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "search"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Stock Search</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "upload"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Custom Upload (Square)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("presets")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 shrink-0 ${
                    activeTab === "presets"
                      ? "bg-white text-[#091c3e] shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Destination Presets</span>
                </button>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center text-[11px] text-slate-500 gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isCoverMode
                ? "A4 Editorial Luxury Spec (1:1.414)"
                : "Day Editorial Spec (1:1 Square on Right Side)"}
            </span>
          </div>
        </div>

        {/* 3. TAB: CURATED PRESETS */}
        {activeTab === "presets" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Region Filter Chips */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-xs font-semibold text-slate-500 shrink-0">Region:</span>
              {regions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                    selectedRegion === region
                      ? "bg-[#091c3e] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {region === "Matching" && destinationFallback
                    ? `★ Matching (${destinationFallback})`
                    : region}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPreset(preset)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectPreset(preset);
                      }
                    }}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-[#091c3e] hover:shadow-xl transition-all cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {/* Preset Thumbnail */}
                    <div
                      className={`relative overflow-hidden bg-slate-900 ${
                        isCoverMode ? "aspect-[1/1.414]" : "aspect-square"
                      }`}
                    >
                      <img
                        src={preset.thumbnailUrl}
                        alt={preset.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />

                      {/* Safe Zone Guide (when enabled in cover mode) */}
                      {isCoverMode && showSafeZone && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="h-[20%] bg-blue-900/30 border-b border-blue-400/50 flex items-center justify-center p-1">
                            <span className="text-[9px] font-black uppercase text-white/90 drop-shadow">
                              Logo Bar
                            </span>
                          </div>
                          <div className="flex-1 border-2 border-emerald-400/60 m-1 rounded flex items-center justify-center bg-emerald-500/10">
                            <span className="text-[9px] font-black uppercase text-emerald-200 drop-shadow">
                              Safe Zone
                            </span>
                          </div>
                          <div className="h-[35%] bg-slate-950/60 border-t border-slate-400/40 flex items-center justify-center p-1">
                            <span className="text-[9px] font-black uppercase text-white/90 drop-shadow">
                              Title Vignette
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Square Crop Indicator in Day Mode */}
                      {!isCoverMode && (
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8.5px] font-semibold backdrop-blur-xs flex items-center gap-1">
                          <Crop className="w-2.5 h-2.5" />
                          <span>Square Crop</span>
                        </span>
                      )}

                      {/* Region Badge */}
                      <span className="absolute top-2 right-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                        {preset.region}
                      </span>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 flex flex-col justify-between flex-1 bg-white">
                      <div>
                        <div className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                          {preset.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Photo: {preset.photographerName}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 uppercase font-bold text-[9px]">
                          {preset.provider}
                        </span>
                        <span className="text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                          <span>{isCoverMode ? "Apply Cover" : `Apply Day ${dayNumber}`}</span>
                          <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. TAB: STOCK SEARCH */}
        {activeTab === "search" && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Input Bar & Orientation Controls */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white space-y-2 shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Orientation Selector for Day Mode */}
                {!isCoverMode && (
                  <div className="flex items-center gap-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-2 sm:pb-0 sm:pr-3 shrink-0">
                    <span className="text-[11px] font-bold text-slate-600 shrink-0 uppercase tracking-wider">
                      Orientation:
                    </span>
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setOrientation("all");
                          fetchImages(query, "all");
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                          orientation === "all"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrientation("portrait");
                          fetchImages(query, "portrait");
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition flex items-center gap-1 ${
                          orientation === "portrait"
                            ? "bg-[#091c3e] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>Portrait</span>
                        <span className="text-[10px] font-bold">▯</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOrientation("landscape");
                          fetchImages(query, "landscape");
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition flex items-center gap-1 ${
                          orientation === "landscape"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>Landscape</span>
                        <span className="text-[10px] font-bold">▭</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchImages(query);
                  }}
                  className="flex-1 flex gap-2"
                >
                  <div className="relative flex-1">
                    <label htmlFor="image-picker-search" className="sr-only">
                      Search photo keywords
                    </label>
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" aria-hidden="true" />
                    <input
                      id="image-picker-search"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        isCoverMode
                          ? "Search vertical cover imagery (e.g. Dubai skyline dusk, Bali rice terrace drone)..."
                          : "Search photos (e.g. Dal Lake shikara sunset, Gulmarg snow, Luxury resort)..."
                      }
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </form>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 overflow-x-auto pb-1">
                <span className="font-medium shrink-0">
                  {isCoverMode ? "Editorial Modifiers:" : "Suggestions:"}
                </span>

                {destinationFallback && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(destinationFallback);
                      fetchImages(destinationFallback);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shrink-0 font-medium"
                  >
                    ★ {destinationFallback}
                  </button>
                )}

                {isCoverMode ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Dubai"} aerial drone vertical`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Aerial Drone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Bali"} golden hour sunset vertical`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Golden Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Switzerland"} iconic landmark vertical`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Iconic Landmark
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Travel"} landscape`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Landscape View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Luxury"} resort hotel`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Resort & Stay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = `${destinationFallback || "Tour"} sightseeing landmark`;
                        setQuery(q);
                        fetchImages(q);
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                    >
                      Sightseeing & Culture
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Photo Grid Results */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <div className="text-xs font-medium">
                    {isCoverMode
                      ? "Querying high-resolution vertical photography across Unsplash, Pexels, Pixabay & Wikimedia..."
                      : `Querying ${orientation} photography across stock providers...`}
                  </div>
                </div>
              ) : error ? (
                <div className="py-16 text-center text-xs text-red-600 font-medium">{error}</div>
              ) : images.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <div className="text-sm font-semibold text-slate-700">No photos found</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching with broader destination terms or switching orientation to &quot;All&quot;.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    isCoverMode
                      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                      : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  }
                >
                  {images.map((img) => (
                    <div
                      key={img.photoId}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectNormalized(img)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectNormalized(img);
                        }
                      }}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-[#091c3e] hover:shadow-xl transition-all cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      {/* Photo Thumbnail */}
                      <div
                        className={`relative overflow-hidden bg-slate-900 ${
                          isCoverMode ? "aspect-[1/1.414]" : "aspect-square"
                        }`}
                      >
                        <img
                          src={img.thumbUrl}
                          alt={img.altDescription || "Scenic view"}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />

                        {/* Safe Zone Guide Overlay for Cover Mode */}
                        {isCoverMode && showSafeZone && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="h-[20%] bg-blue-900/30 border-b border-blue-400/50 flex items-center justify-center p-1">
                              <span className="text-[9px] font-black uppercase text-white/90 drop-shadow">
                                Logo Bar
                              </span>
                            </div>
                            <div className="flex-1 border-2 border-emerald-400/60 m-1 rounded flex items-center justify-center bg-emerald-500/10">
                              <span className="text-[9px] font-black uppercase text-emerald-200 drop-shadow">
                                Safe Zone
                              </span>
                            </div>
                            <div className="h-[35%] bg-slate-950/60 border-t border-slate-400/40 flex items-center justify-center p-1">
                              <span className="text-[9px] font-black uppercase text-white/90 drop-shadow">
                                Title Vignette
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Orientation Badge for Day Mode */}
                        {!isCoverMode && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8.5px] font-semibold backdrop-blur-xs flex items-center gap-1">
                            <span>{img.orientation === "portrait" ? "▯ Portrait" : "▭ Landscape"}</span>
                          </span>
                        )}

                        {/* Provider Badge */}
                        <span
                          className={`absolute top-2 right-2 text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded shadow ${
                            img.provider === "unsplash"
                              ? "bg-black/75 text-white"
                              : img.provider === "pexels"
                              ? "bg-emerald-700/80 text-white"
                              : img.provider === "pixabay"
                              ? "bg-amber-600/80 text-white"
                              : "bg-blue-700/80 text-white"
                          }`}
                        >
                          {img.provider}
                        </span>
                      </div>

                      {/* Photo Metadata Footer */}
                      <div className="p-3 flex flex-col justify-between flex-1 bg-white">
                        <div>
                          <div className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                            {img.altDescription || "Scenic destination photography"}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>By</span>
                            <span className="text-slate-600 font-medium truncate max-w-[120px]">
                              {img.photographerName}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                            {img.width && img.height ? `${img.width}×${img.height}` : img.provider}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                            <span>{isCoverMode ? "Apply Cover" : `Apply Day ${dayNumber}`}</span>
                            <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. TAB: CUSTOM UPLOAD & INTERACTIVE CROPPER */}
        {activeTab === "upload" && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-950">
            {uploadedDataUrl ? (
              <CoverImageCropper
                imageSrc={uploadedDataUrl}
                mode={isCoverMode ? "cover" : "day"}
                dayNumber={dayNumber}
                onApplyCrop={handleApplyCropped}
                onCancel={() => {
                  setUploadedDataUrl(null);
                  setUploadedFileName("");
                }}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center space-y-4 shadow-sm hover:border-blue-500 transition">
                  <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isCoverMode
                        ? "Upload Custom Cover Photo"
                        : `Upload Custom Photo for Day ${dayNumber}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      {isCoverMode
                        ? "Supports JPG, PNG, WebP up to 15MB. Pan, zoom, and frame the 1:1.414 portrait crop with live safe-zone overlays."
                        : `Upload photos for Day ${dayNumber}. Pan, zoom, and crop to a 1:1 square for the PDF proposal.`}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="custom-file-input"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#091c3e] hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Browse Photo From Computer</span>
                    </label>
                    <input
                      id="custom-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. MODAL FOOTER (Hidden when cropper has its own controls) */}
        {!(activeTab === "upload" && uploadedDataUrl) && (
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-500">
              {isCoverMode ? (
                <span>
                  Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] font-mono">ESC</kbd> to close.
                </span>
              ) : (
                <span>
                  Day {dayNumber} photo: displayed on the right side of the day timeline, cropped to a 1:1 square.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
