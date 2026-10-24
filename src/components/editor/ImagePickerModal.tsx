"use client";

import React, { useState, useEffect } from "react";
import { NormalizedImage } from "@/lib/images/client";
import { ItineraryImage } from "@/lib/schema/itinerary";
import { Search, X, Loader2, Image as ImageIcon, ExternalLink, RefreshCw } from "lucide-react";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber: number;
  initialQuery: string;
  destinationFallback?: string;
  currentImage?: ItineraryImage | null;
  onSelectImage: (image: ItineraryImage | null) => void;
}

export default function ImagePickerModal({
  isOpen,
  onClose,
  dayNumber,
  initialQuery,
  destinationFallback,
  currentImage,
  onSelectImage,
}: ImagePickerModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<NormalizedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/images/search?query=${encodeURIComponent(searchQuery)}`);
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

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || destinationFallback || "India travel scenic");
      fetchImages(initialQuery || destinationFallback || "India travel scenic");
    }
  }, [isOpen, initialQuery, destinationFallback]);

  if (!isOpen) return null;

  const handleSelect = async (img: NormalizedImage) => {
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

  const handleClear = () => {
    onSelectImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {dayNumber}
              </span>
              <h2 className="text-base font-bold text-slate-800">
                Select Photo for Day {dayNumber}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sourced via Unsplash & Pexels API with verified photographer attribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentImage && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-medium border border-red-200 transition"
              >
                Clear Photo
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH BAR & FALLBACK PILLS */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchImages(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search photo keywords (e.g. Dal Lake shikara sunset, Gulmarg snow)..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search
            </button>
          </form>

          {/* Quick Fallback Suggestion Pills */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 overflow-x-auto pb-1">
            <span>Suggestions:</span>
            {destinationFallback && (
              <button
                type="button"
                onClick={() => {
                  setQuery(destinationFallback);
                  fetchImages(destinationFallback);
                }}
                className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              >
                {destinationFallback}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery("India travel landscape");
                fetchImages("India travel landscape");
              }}
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              India Travel Landscape
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery("Luxury resort pool");
                fetchImages("Luxury resort pool");
              }}
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Luxury Resort
            </button>
          </div>
        </div>

        {/* PHOTO GRID RESULTS */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <div className="text-xs font-medium">Fetching high-resolution landscape photos...</div>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-xs text-red-600">{error}</div>
          ) : images.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">No photos found</div>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with broader keywords like city or landmark name.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.photoId}
                  onClick={() => handleSelect(img)}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-600 hover:shadow-lg transition cursor-pointer flex flex-col"
                >
                  {/* Photo Thumbnail */}
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={img.thumbUrl}
                      alt={img.altDescription || "Scenic view"}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {/* Provider Badge */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shadow ${
                        img.provider === "unsplash"
                          ? "bg-black/70 text-white"
                          : "bg-emerald-600/90 text-white"
                      }`}
                    >
                      {img.provider}
                    </span>
                  </div>

                  {/* Photographer Attribution & Select Button */}
                  <div className="p-2.5 bg-white flex items-center justify-between text-xs">
                    <div className="truncate pr-2">
                      <div className="font-semibold text-slate-800 truncate">
                        {img.photographerName}
                      </div>
                      <a
                        href={img.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                      >
                        Profile <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 bg-blue-600 group-hover:bg-blue-700 text-white text-[11px] font-bold rounded shadow transition shrink-0"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
