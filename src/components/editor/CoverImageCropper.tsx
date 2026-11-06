"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area, getCroppedImg } from "@/lib/images/crop-canvas";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface CoverImageCropperProps {
  imageSrc: string;
  mode?: "cover" | "day";
  dayNumber?: number;
  packageTitle?: string;
  guestName?: string;
  onApplyCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function CoverImageCropper({
  imageSrc,
  mode = "cover",
  dayNumber = 1,
  packageTitle,
  guestName,
  onApplyCrop,
  onCancel,
}: CoverImageCropperProps) {
  const isCoverMode = mode === "cover";

  // Aspect ratio: 1:1.414 for A4 Cover; 1:1 for Day square
  const aspect = isCoverMode ? 1 / 1.414 : 1;

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, currentCroppedAreaPixels: Area) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleApply = async () => {
    if (!croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      setError(null);
      // High-res output optimized for PDF print (1600px A4 / 1000px square at 0.85 quality prevents multi-MB memory bloat)
      const maxDim = isCoverMode ? 1600 : 1000;
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, maxDim, 0.85);
      onApplyCrop(croppedDataUrl);
    } catch (err) {
      console.error("Cropping failed:", err);
      setError("Failed to crop image. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full bg-background text-foreground select-none">
      {/* 1. Header Toolbar */}
      <div className="px-6 py-3 pr-12 border-b border-border bg-card flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">
              {isCoverMode ? "Adjust cover photo" : `Adjust photo for Day ${dayNumber}`}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCoverMode
              ? "Drag to position. Keep the main subject between the shaded areas."
              : "Drag to frame the subject for the itinerary proposal."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Guides Toggle */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              id="cropper-guides-toggle"
              size="sm"
              checked={showGuides}
              onCheckedChange={setShowGuides}
              aria-label="Show framing guides"
            />
            <label htmlFor="cropper-guides-toggle" className="cursor-pointer font-medium">
              Guides
            </label>
          </div>

          {/* Reset Position */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="Reset position and zoom"
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* 2. Interactive Cropper Canvas */}
      <div className="relative flex-1 min-h-[340px] bg-neutral-950 overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={!showGuides}
          style={{
            containerStyle: { background: "#0a0a0a" },
            cropAreaStyle: {
              border: "2px solid var(--primary)",
              boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.75)",
            },
          }}
        />

        {/* Framing Guides Overlay */}
        {showGuides && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`relative pointer-events-none border border-border/40 shadow-2xl flex flex-col justify-between overflow-hidden ${
                isCoverMode ? "aspect-[1/1.414] h-[82%]" : "aspect-square h-[82%]"
              }`}
            >
              {isCoverMode ? (
                <>
                  {/* Top Shaded Area: Logo Area (0 - 20%) */}
                  <div className="h-[20%] bg-neutral-900/60 border-b border-border/30 flex items-center justify-center p-2 text-center backdrop-blur-2xs">
                    <span className="text-xs font-medium text-white/80 tracking-wide select-none">
                      Logo area
                    </span>
                  </div>

                  {/* Center Clear Window: Unobstructed focal subject */}
                  <div className="flex-1" />

                  {/* Bottom Shaded Area: Live Title & Guest Overlay (65 - 100%) */}
                  <div className="h-[35%] bg-neutral-900/65 border-t border-border/30 flex flex-col items-center justify-center p-3 text-center backdrop-blur-2xs">
                    {packageTitle ? (
                      <div className="w-full px-2 text-center select-none">
                        <div className="text-xs sm:text-sm font-serif font-bold text-white line-clamp-2 leading-tight drop-shadow-sm">
                          {packageTitle}
                        </div>
                        {guestName && (
                          <div className="text-[10px] text-white/80 mt-0.5 uppercase tracking-wider font-sans font-medium line-clamp-1 drop-shadow-sm">
                            Prepared for {guestName}
                          </div>
                        )}
                        <span className="text-[9px] text-white/45 tracking-wider uppercase mt-1 block">
                          Title area
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-white/80 tracking-wide select-none">
                        Title area
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center border border-border/40">
                  <span className="text-xs font-medium text-white/80">Photo frame</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Controls Bar */}
      <div className="px-6 py-3.5 bg-card border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        {/* Zoom Control with shadcn Slider */}
        <div className="flex items-center gap-3 w-full sm:w-72">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <div className="flex-1">
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(vals) => {
                const nextVal = Array.isArray(vals) ? vals[0] : Number(vals);
                if (!isNaN(nextVal)) setZoom(nextVal);
              }}
              aria-label="Zoom level"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-9 text-right shrink-0">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {error && <div className="text-xs text-destructive font-medium">{error}</div>}

        {/* Action Buttons: Cancel/Back and Single Primary Action */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isProcessing}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            Back to photos
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleApply}
            disabled={isProcessing || !croppedAreaPixels}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isCoverMode ? "Use as cover" : "Use photo"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
