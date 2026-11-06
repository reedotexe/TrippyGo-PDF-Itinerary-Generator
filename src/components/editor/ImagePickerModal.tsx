"use client";

import React, { useState, useEffect, useRef } from "react";
import { NormalizedImage, buildEditorialCoverQuery } from "@/lib/images/client";
import {
  COVER_PRESETS,
  findPresetsForDestinations,
} from "@/lib/images/cover-presets";
import { ItineraryImage } from "@/lib/schema/itinerary";
import { Search, Loader2, Upload, X, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CoverImageCropper from "./CoverImageCropper";

interface ImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber?: number;
  mode?: "day" | "cover";
  initialQuery: string;
  destinationFallback?: string;
  currentImage?: ItineraryImage | null;
  packageTitle?: string;
  guestName?: string;
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
  packageTitle,
  guestName,
  onSelectImage,
}: ImagePickerModalProps) {
  const isCoverMode = mode === "cover";

  // Tabs: 'suggested' | 'search' | 'upload'
  const [activeTab, setActiveTab] = useState<"suggested" | "search" | "upload">(
    isCoverMode ? "suggested" : "search"
  );

  // Search & Filter State
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<NormalizedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("All");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Immediate Candidate for Cropper Transition
  const [candidateForCrop, setCandidateForCrop] = useState<{
    imageUrl: string;
    metadata?: Partial<ItineraryImage>;
  } | null>(null);

  // Upload State
  const [dragOver, setDragOver] = useState(false);

  // Abort controller ref for search requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchImages = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    try {
      const orientationParam = isCoverMode ? "&orientation=portrait" : "&orientation=all";
      const finalQuery = isCoverMode ? buildEditorialCoverQuery(searchQuery) : searchQuery;
      const res = await fetch(
        `/api/images/search?query=${encodeURIComponent(finalQuery)}${orientationParam}`,
        { signal: controller.signal }
      );
      const data = await res.json();
      if (res.ok && data.images) {
        setImages(data.images);
      } else {
        setError(data.error || "Failed to load photos");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("Network error while searching images");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialTerm = initialQuery || destinationFallback || "Dubai travel scenic";
      setQuery(initialTerm);
      setActiveTab(isCoverMode ? "suggested" : "search");
      setCandidateForCrop(null);
      setBrokenImages({});

      // Default suggested region to "Matching" if matching destination presets exist (DESIGN.md 7.12)
      const matching = findPresetsForDestinations(
        destinationFallback ? [destinationFallback] : []
      );
      setSelectedRegion(matching.length > 0 ? "Matching" : "All");

      // Defer external API search in cover mode until user opens search tab (fixes P1 eager fetch)
      if (!isCoverMode) {
        fetchImages(initialTerm);
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, initialQuery, destinationFallback, isCoverMode]);

  // Handle Tab Change: trigger search on first switch to search tab if images empty
  const handleTabChange = (val: string) => {
    const nextTab = val as "suggested" | "search" | "upload";
    setActiveTab(nextTab);
    if (nextTab === "search" && images.length === 0 && !isLoading) {
      fetchImages(query || initialQuery || destinationFallback || "travel scenic");
    }
  };

  // Handle Candidate Selection -> goes straight to Cropper
  const handleSelectCandidate = (
    imageUrl: string,
    metadata?: Partial<ItineraryImage>
  ) => {
    setCandidateForCrop({ imageUrl, metadata });
  };

  // Handle Cropper Apply -> saves cropped image to parent and closes
  const handleApplyCropped = (croppedDataUrl: string) => {
    const meta = candidateForCrop?.metadata || {};

    // Track download for Unsplash if applicable
    if (meta.provider === "unsplash" && meta.downloadLocation) {
      fetch("/api/images/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: meta.provider,
          photoId: meta.photoId,
          downloadLocation: meta.downloadLocation,
        }),
      }).catch((e) => console.warn("Failed tracking download:", e));
    }

    const formatted: ItineraryImage = {
      provider: meta.provider || "upload",
      photoId: meta.photoId || (isCoverMode ? `cover-${Date.now()}` : `day-${dayNumber}-${Date.now()}`),
      imageUrl: croppedDataUrl,
      thumbnailUrl: croppedDataUrl,
      photographerName: meta.photographerName || "Custom Selection",
      photographerUrl: meta.photographerUrl || "",
      downloadLocation: meta.downloadLocation || null,
    };

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

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSelectCandidate(dataUrl, {
        provider: "upload",
        photographerName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file (JPEG, PNG, WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleSelectCandidate(dataUrl, {
        provider: "upload",
        photographerName: file.name,
      });
    };
    reader.readAsDataURL(file);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] w-[92vw] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card shadow-2xl">
        {candidateForCrop ? (
          /* STEP 2: CROPPING AND FRAMING VIEW */
          <div className="flex-1 flex flex-col min-h-0 h-[75vh]">
            <CoverImageCropper
              imageSrc={candidateForCrop.imageUrl}
              mode={isCoverMode ? "cover" : "day"}
              dayNumber={dayNumber}
              packageTitle={packageTitle}
              guestName={guestName}
              onApplyCrop={handleApplyCropped}
              onCancel={() => setCandidateForCrop(null)}
            />
          </div>
        ) : (
          /* STEP 1: BROWSING AND SELECTION VIEW */
          <div className="flex flex-col h-full min-h-0">
            {/* Minimal Header */}
            <div className="px-6 py-4 pr-12 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
                  {isCoverMode ? "Select cover photo" : `Choose photo for Day ${dayNumber}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {isCoverMode
                    ? "Choose a curated cover, search stock, or upload your own."
                    : "Choose an editorial photo for this day's narrative."}
                </DialogDescription>
              </div>

              {currentImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onSelectImage(null);
                    onClose();
                  }}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset to auto
                </Button>
              )}
            </div>

            {/* Navigation Tabs & Region Dropdown (responsive wrapping for mobile) */}
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-6 py-2 border-b border-border/70 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 bg-muted/20 shrink-0">
                <TabsList variant="line" className="h-8 gap-2 bg-transparent p-0 border-0">
                  {isCoverMode && (
                    <TabsTrigger
                      value="suggested"
                      className="text-xs font-medium px-3 py-1 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold"
                    >
                      Suggested
                    </TabsTrigger>
                  )}
                  <TabsTrigger
                    value="search"
                    className="text-xs font-medium px-3 py-1 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold"
                  >
                    Search stock
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="text-xs font-medium px-3 py-1 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold"
                  >
                    Upload
                  </TabsTrigger>
                </TabsList>

                {/* Region Select Filter (Suggested tab only) */}
                {activeTab === "suggested" && isCoverMode && (
                  <Select value={selectedRegion} onValueChange={(val) => val && setSelectedRegion(val)}>
                    <SelectTrigger className="h-7.5 w-44 text-xs font-medium bg-background border-border">
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {regions.map((region) => (
                        <SelectItem key={region} value={region} className="text-xs">
                          {region === "Matching" && destinationFallback
                            ? `Matching (${destinationFallback})`
                            : region === "All"
                            ? "All regions"
                            : region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* TAB 1: SUGGESTED COVERS */}
              {isCoverMode && (
                <TabsContent value="suggested" className="flex-1 min-h-0 overflow-y-auto p-6 m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {filteredPresets.map((preset) => {
                      const isBroken = brokenImages[preset.id];

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            handleSelectCandidate(preset.imageUrl, {
                              provider: preset.provider,
                              photoId: preset.id,
                              photographerName: preset.photographerName,
                              photographerUrl: preset.photographerUrl,
                            })
                          }
                          className="group relative aspect-[1/1.414] rounded-xl overflow-hidden border border-border/80 bg-muted hover:border-foreground/40 hover:shadow-lg transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {isBroken ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-muted text-muted-foreground">
                              <ImageIcon className="w-6 h-6 mb-1.5 opacity-40" />
                              <span className="text-xs font-medium">Couldn&apos;t load</span>
                            </div>
                          ) : (
                            <img
                              src={preset.thumbnailUrl}
                              alt={preset.title}
                              loading="lazy"
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [preset.id]: true }))
                              }
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                            />
                          )}

                          {/* Attribution Overlay on hover (DESIGN.md 7.12) */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-white pointer-events-none">
                            <div className="text-xs font-semibold leading-tight line-clamp-1 drop-shadow-sm">
                              {preset.title}
                            </div>
                            <div className="text-[11px] text-white/80 mt-0.5 font-normal drop-shadow-sm line-clamp-1">
                              {preset.region} · Photo by {preset.photographerName}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>
              )}

              {/* TAB 2: SEARCH STOCK */}
              <TabsContent value="search" className="flex-1 min-h-0 overflow-y-auto p-6 m-0 focus-visible:outline-none space-y-4">
                <div className="flex items-center gap-2.5 max-w-lg w-full">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          fetchImages(query);
                        }
                      }}
                      placeholder="Search stock photos (e.g. Phuket, Bali, Alps)…"
                      className="h-9 pl-9 pr-8 text-xs font-medium bg-muted/40 border border-border hover:border-foreground/30 focus-visible:bg-background focus-visible:border-primary rounded-lg transition-colors shadow-2xs"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchImages(query)}
                    disabled={isLoading || !query.trim()}
                    className="h-9 px-4 text-xs font-semibold shrink-0 rounded-lg border border-border hover:bg-secondary/80 transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Search className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>Search</span>
                  </Button>
                </div>

                {error && (
                  <div className="text-xs text-destructive font-medium p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="py-20 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching stock photos…</span>
                  </div>
                ) : images.length === 0 ? (
                  <div className="py-20 text-center text-xs text-muted-foreground">
                    No photos found. Try a different search query.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <button
                        key={img.photoId}
                        type="button"
                        onClick={() =>
                          handleSelectCandidate(img.fullUrl, {
                            provider: img.provider,
                            photoId: img.photoId,
                            photographerName: img.photographerName,
                            photographerUrl: img.photographerUrl,
                            downloadLocation: img.downloadLocation,
                          })
                        }
                        className={`group relative rounded-xl overflow-hidden border border-border/80 bg-muted hover:border-foreground/40 hover:shadow-lg transition-all duration-200 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isCoverMode ? "aspect-[1/1.414]" : "aspect-square"
                        }`}
                      >
                        <img
                          src={img.thumbUrl}
                          alt={img.altDescription || "Stock photo"}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5 text-white pointer-events-none">
                          <div className="text-xs font-medium leading-tight line-clamp-1 drop-shadow-sm">
                            {img.altDescription || "Stock photograph"}
                          </div>
                          <div className="text-[11px] text-white/80 mt-0.5 drop-shadow-sm">
                            Photo by {img.photographerName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: UPLOAD (adaptive vertical padding) */}
              <TabsContent value="upload" className="flex-1 min-h-0 p-6 m-0 focus-visible:outline-none">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 sm:py-12 text-center transition flex flex-col items-center justify-center gap-3 ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border/80 hover:border-muted-foreground/40 bg-muted/10"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Drop your photo here, or browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Supports JPEG, PNG, and WebP (up to 20 MB)
                    </p>
                  </div>

                  <label className="cursor-pointer mt-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                    <span className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition">
                      Choose file
                    </span>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
