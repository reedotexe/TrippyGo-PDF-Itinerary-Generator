"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  FileUp,
  FileText,
  FilePlus,
  UploadCloud,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck,
} from "lucide-react";

interface NewItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtract: (overrideText?: string, fileToUse?: File) => Promise<void>;
  onCreateBlank: () => Promise<void>;
  isProcessing: boolean;
  errorMsg: string | null;
}

export function NewItineraryModal({
  isOpen,
  onClose,
  onExtract,
  onCreateBlank,
  isProcessing,
  errorMsg,
}: NewItineraryModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "paste" | "blank">("upload");
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".txt") || file.name.endsWith(".pdf"))) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLoadKashmirSample = () => {
    const kashmirText = `SUPPLIER: Royal Kashmir Holidays
Package: Kashmir Paradise Tour
Duration: 6 Nights / 7 Days

DAY 1: ARRIVAL SRINAGAR - LOCAL SIGHTSEEING
Meet & greet at Srinagar airport. Transfer to luxury houseboat at Dal Lake.
Afternoon Shikara ride visiting Floating Gardens and Char Chinar.
Dinner & overnight stay at Houseboat (Dal Lake).

DAY 2: SRINAGAR TO SONAMARG DAY EXCURSION
Drive to Sonamarg (Meadow of Gold). Enjoy Thajiwas Glacier pony ride.
Dinner & overnight stay at Hotel Grand Boulevard, Srinagar.

DAY 3: SRINAGAR - GULMARG
Board Gulmarg Gondola Phase 1 & 2 up to Apharwat Peak.
Dinner & overnight stay at Hotel Pine Spring, Gulmarg.

DAY 4: GULMARG TO PAHALGAM
Drive to Pahalgam via Pampore saffron fields.
Dinner & overnight stay at Hotel Heevan, Pahalgam.

DAY 5: PAHALGAM VALLEY SIGHTSEEING
Visit Betaab Valley, Aru Valley, and Chandanwari.
Dinner & overnight stay at Hotel Heevan, Pahalgam.

DAY 6: PAHALGAM TO SRINAGAR
Mughal Gardens: Nishat Bagh and Shalimar Bagh.
Dinner & overnight stay at Hotel Grand Boulevard, Srinagar.

DAY 7: DEPARTURE SRINAGAR AIRPORT
Breakfast and transfer to Srinagar Airport.

INCLUSIONS:
- 01 Night Houseboat Srinagar
- 02 Nights Grand Boulevard Srinagar
- 01 Night Pine Spring Gulmarg
- 02 Nights Heevan Pahalgam
- Daily Breakfast and Dinner (MAP plan)
- All transfers by private Innova Crysta

EXCLUSIONS:
- Airfare
- Gondola tickets Phase 1 & 2
- Personal expenses

NET SUPPLIER PRICE:
INR 52,000/- Total for couple net.`;

    setPastedText(kashmirText);
    setActiveTab("paste");
  };

  const handleSubmit = () => {
    if (activeTab === "upload") {
      if (!selectedFile) return;
      onExtract(undefined, selectedFile);
    } else if (activeTab === "paste") {
      if (!pastedText.trim()) return;
      onExtract(pastedText);
    } else {
      onCreateBlank();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-[#091c3e]">
              Create New Itinerary
            </h2>
            <p className="text-xs text-slate-500">
              Parse raw supplier notes into a client-ready proposal with AI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "upload"
                ? "border-[#c92229] text-[#c92229]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileUp className="w-4 h-4" />
            Upload PDF / Doc
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "paste"
                ? "border-[#c92229] text-[#c92229]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste WhatsApp / Text
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("blank")}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
              activeTab === "blank"
                ? "border-[#c92229] text-[#c92229]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FilePlus className="w-4 h-4" />
            Start Blank
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {activeTab === "upload" && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  isDragOver
                    ? "border-[#c92229] bg-red-50/40"
                    : selectedFile
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  aria-label="Upload supplier quote PDF or text file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">{selectedFile.name}</div>
                    <div className="text-xs text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to extract
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="text-xs text-red-600 hover:underline pt-1"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-700">
                      Drop supplier PDF here or click to browse
                    </div>
                    <div className="text-xs text-slate-500">Supports PDF or TXT up to 50 MB</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "paste" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Paste WhatsApp or DMC Supplier Quotation:
                </span>
                <button
                  type="button"
                  onClick={handleLoadKashmirSample}
                  className="text-[#c92229] hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Sample Kashmir Tour
                </button>
              </div>

              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste itinerary text, inclusions, day plans, or net rates here..."
                aria-label="Pasted supplier itinerary quotation"
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#091c3e] focus-visible:ring-2 focus-visible:ring-[#091c3e]/20 leading-relaxed font-sans"
              />
            </div>
          )}

          {activeTab === "blank" && (
            <div className="p-6 text-center bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FilePlus className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#091c3e]">Create from scratch</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Initialize an empty proposal. You can manually enter days, hotel selections,
                pricing, and flight legs in the live editor.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/75 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              (activeTab === "upload" && !selectedFile) ||
              (activeTab === "paste" && !pastedText.trim())
            }
            className="px-5 py-2.5 bg-[#c92229] hover:bg-[#b01d23] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition flex items-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#c92229]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Parsing with Claude AI...
              </>
            ) : activeTab === "blank" ? (
              <>
                Open Blank Editor
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Extract & Open Editor
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
