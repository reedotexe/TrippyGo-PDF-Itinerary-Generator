"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileUp,
  FileText,
  Sparkles,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Clock,
  Layers,
  FilePlus,
  Settings,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Extraction and immediate redirect to editor
  const handleExtract = async (overrideText?: string, fileToUse?: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let res: Response;

      if (fileToUse || selectedFile) {
        const file = fileToUse || selectedFile!;
        const formData = new FormData();
        formData.append("file", file);

        res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });
      } else {
        const textContent = overrideText || pastedText;
        if (!textContent.trim()) {
          setErrorMsg("Please paste supplier text or select a PDF file.");
          setIsProcessing(false);
          return;
        }

        res = await fetch("/api/extract", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: textContent }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${res.status}`);
      }

      const extractionData = await res.json();
      const extractedItinerary = extractionData.itinerary;

      // Save into DB/local store
      const saveRes = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: extractedItinerary }),
      });
      const saveJson = await saveRes.json();

      // Redirect immediately to editor
      router.push(`/itineraries/${saveJson.id}/edit`);
    } catch (err) {
      console.error("Extraction error:", err);
      setErrorMsg((err as Error).message || "Extraction failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleCreateBlank = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/itineraries", { method: "POST" });
      const data = await res.json();
      router.push(`/itineraries/${data.id}/edit`);
    } catch (err) {
      setErrorMsg("Failed to initialize blank itinerary.");
      setIsProcessing(false);
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
    handleExtract(kashmirText);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-red-500 selection:text-white">
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/20 via-red-600/10 to-transparent blur-3xl pointer-events-none"></div>

      {/* NAVBAR */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center font-black text-lg shadow-lg">
            T
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-lg text-white">TrippyGo</div>
            <div className="text-[11px] text-slate-400 font-medium">B2B PDF Itinerary Engine</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5"
            title="Configure Agency Settings"
          >
            <Settings className="w-3.5 h-3.5 text-red-400" /> Settings
          </Link>
          <button
            onClick={handleCreateBlank}
            disabled={isProcessing}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-1.5"
          >
            <FilePlus className="w-3.5 h-3.5 text-blue-400" /> Blank Itinerary
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" /> Turn Supplier Quotes Into Branded PDFs in Seconds
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Generate Client-Ready Travel Itineraries with Ease.
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Upload any supplier PDF or paste WhatsApp/DMC text. The Claude LLM pipeline strips supplier
            branding, parses day plans, computes your profit markup, and produces a print-perfect PDF.
          </p>
        </div>

        {/* EXTRACTION INPUT CONTAINER */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPTION 1: DRAG & DROP PDF UPLOAD */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-red-400" />
                Upload Supplier PDF or Text Document
              </label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-950/60 transition group cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setSelectedFile(f);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-blue-400 mx-auto mb-2 transition" />
                <div className="text-xs font-semibold text-slate-300">
                  {selectedFile ? selectedFile.name : "Drop PDF here or click to browse"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Up to 10 MB (PDF or TXT)</div>
              </div>
            </div>

            {/* OPTION 2: PASTE TEXT */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                Or Paste WhatsApp / DMC Quotation
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (selectedFile) setSelectedFile(null); // Clear file if text typed
                }}
                placeholder="Paste day-wise details, inclusions, hotel names, or DMC rates here..."
                className="w-full p-3 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed font-mono"
              />
            </div>
          </div>

          {/* ACTION BUTTONS & SAMPLE SHORTCUTS */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={handleLoadKashmirSample}
                disabled={isProcessing}
                className="text-blue-400 hover:text-blue-300 underline font-medium"
              >
                Load Sample Kashmir 7-Day Tour
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleExtract()}
              disabled={isProcessing}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting Itinerary with Claude...
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

        {/* THREE VALUE PROPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-3">
              🛡️
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Zero Supplier Leaks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Supplier net rates, B2B markup formulas, phone numbers, and DMC contacts are stripped
              before the client PDF renders.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center font-bold mb-3">
              ⚡
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Two-Pane Live Editor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Edit day titles, add meals, change start dates, adjust markup, and watch the client PDF
              preview update in real time.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-3">
              🇮🇳
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Indian GST & Pricing Ready</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built-in SAC 998552, 5% inclusive tax calculations, Indian Rupee comma formatting, and
              customizable cancellation window slabs.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
