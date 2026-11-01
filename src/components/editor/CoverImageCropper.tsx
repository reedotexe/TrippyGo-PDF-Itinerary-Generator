"use client";

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Area, getCroppedImg } from "@/lib/images/crop-canvas";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  X,
  Eye,
  Loader2,
  Sparkles,
  Layers,
  Crop,
} from "lucide-react";

interface CoverImageCropperProps {
  imageSrc: string;
  mode?: "cover" | "day";
  dayNumber?: number;
  onApplyCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function CoverImageCropper({
  imageSrc,
  mode = "cover",
  dayNumber = 1,
  onApplyCrop,
  onCancel,
}: CoverImageCropperProps) {
  const isCoverMode = mode === "cover";

  // Aspect ratio: 1:1.414 (0.7071) for A4 Cover; 1:1 for Day square
  const aspect = isCoverMode ? 1 / 1.414 : 1;

  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
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
      // High-res output: up to 2000px on the longest edge with 90% quality JPEG
      const maxDim = isCoverMode ? 2480 : 1200;
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels, maxDim, 0.90);
      onApplyCrop(croppedDataUrl);
    } catch (err) {
      console.error("Cropping failed:", err);
      setError("Failed to crop image. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleResetZoom = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full bg-slate-950 text-white select-none">
      {/* 1. Header Toolbar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">
              <Crop className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isCoverMode
                ? "Interactive A4 Portrait Cropper (1:1.414)"
                : `Interactive Square Cropper for Day ${dayNumber} (1:1)`}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isCoverMode
              ? "Drag and zoom photo. Keep the key subject in the center 45% safe focal window."
              : "Drag and zoom photo to frame the hotel, view, or activity perfectly for the PDF proposal."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Safe Zone Toggle (especially for Cover mode) */}
          <button
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            title="Toggle PDF safe-zone layout guide"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
              showSafeZone
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Safe Zone {showSafeZone ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset Zoom & Position"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Cropper Canvas Area */}
      <div className="relative flex-1 min-h-[300px] bg-slate-950 overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid={!showSafeZone}
          style={{
            containerStyle: { background: "#020617" },
            cropAreaStyle: {
              border: "2px solid #38bdf8",
              boxShadow: "0 0 0 9999em rgba(2, 6, 23, 0.78)",
            },
          }}
        />

        {/* Live Safe Zone Ghost Overlay */}
        {showSafeZone && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* The cropped area dimensions mirror the active crop box */}
            <div
              className={`relative pointer-events-none border-2 border-dashed border-amber-400/80 shadow-2xl flex flex-col justify-between overflow-hidden ${
                isCoverMode ? "aspect-[1/1.414] h-[82%]" : "aspect-square h-[82%]"
              }`}
            >
              {isCoverMode ? (
                <>
                  {/* Top 20%: TrippyGo Trust Bar & Logo Safe Zone */}
                  <div className="h-[20%] bg-blue-950/60 border-b border-blue-400/50 flex flex-col items-center justify-center p-2 text-center backdrop-blur-2xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
                      ★ TrippyGo Header Zone (0 - 20%)
                    </span>
                    <span className="text-[8px] text-white/80">
                      Top trust badges & logo will sit here
                    </span>
                  </div>

                  {/* Center 45%: Unobstructed Focal Window */}
                  <div className="flex-1 border-2 border-emerald-400/70 m-1.5 rounded-lg flex flex-col items-center justify-center bg-emerald-500/10">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-300 drop-shadow">
                      ◎ Primary Focal Window (20 - 65%)
                    </span>
                    <span className="text-[8.5px] text-emerald-200/90 mt-0.5">
                      Keep mountains, monuments, or landmarks centered here
                    </span>
                  </div>

                  {/* Bottom 35%: Title Card & Vignette Area */}
                  <div className="h-[35%] bg-slate-950/75 border-t border-slate-400/50 flex flex-col justify-end p-2.5 backdrop-blur-2xs">
                    <span className="text-[10px] font-black uppercase text-amber-300 drop-shadow">
                      Title Card Vignette (65 - 100%)
                    </span>
                    <span className="text-[8px] text-slate-300">
                      Destination, nights, and client name are placed here
                    </span>
                  </div>
                </>
              ) : (
                /* Day Mode Square Safe Zone */
                <div className="w-full h-full border border-emerald-400/60 p-2 flex flex-col justify-between bg-emerald-500/5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-emerald-300">
                    <span>1:1 Square Framing</span>
                    <span>PDF Right-Side Preview</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-white drop-shadow">
                      Day {dayNumber} Editorial Photo
                    </span>
                  </div>
                  <div className="text-[8.5px] text-slate-300 text-center">
                    Subject will be centered beside day narrative
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Controls Bar */}
      <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        {/* Zoom Slider */}
        <div className="flex items-center gap-3 w-full sm:w-72">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
            className="text-slate-400 hover:text-white transition"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            aria-label="Zoom level"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="text-slate-400 hover:text-white transition"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {error && <div className="text-xs text-red-400 font-medium">{error}</div>}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing || !croppedAreaPixels}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cropping & Slicing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isCoverMode ? "Apply A4 Cover Photo" : `Apply Day ${dayNumber} Photo`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
