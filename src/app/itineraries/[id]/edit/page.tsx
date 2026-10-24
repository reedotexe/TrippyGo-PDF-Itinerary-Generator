"use client";

import React, { useEffect, useState, useReducer, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Itinerary } from "@/lib/schema/itinerary";
import BasicsPanel from "@/components/editor/BasicsPanel";
import FlightsPanel from "@/components/editor/FlightsPanel";
import DaysPanel from "@/components/editor/DaysPanel";
import InclusionsPanel from "@/components/editor/InclusionsPanel";
import PricingPanel from "@/components/editor/PricingPanel";
import TermsPanel from "@/components/editor/TermsPanel";
import ContactPanel from "@/components/editor/ContactPanel";
import {
  Undo,
  Redo,
  RefreshCw,
  FileDown,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Sliders,
  Sparkles,
  History,
  Download,
  RotateCcw,
  X,
} from "lucide-react";

// --- Undo / Redo Reducer (50-step max history) ---
interface HistoryState {
  past: Itinerary[];
  present: Itinerary | null;
  future: Itinerary[];
}

type Action =
  | { type: "SET"; payload: Itinerary }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: Itinerary };

function historyReducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "SET":
      if (!state.present) return { past: [], present: action.payload, future: [] };
      return {
        past: [...state.past.slice(-49), state.present],
        present: action.payload,
        future: [],
      };
    case "UNDO":
      if (state.past.length === 0 || !state.present) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0 || !state.present) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    case "RESET":
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    default:
      return state;
  }
}

export default function ItineraryEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-base font-medium text-slate-300">Loading Itinerary Editor...</div>
        </div>
      }
    >
      <ItineraryEditorContent />
    </Suspense>
  );
}

function ItineraryEditorContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: null,
    future: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [activeViewMode, setActiveViewMode] = useState<"split" | "form" | "preview">("split");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ url: string; version: number } | null>(null);
  const [iframeKey, setIframeKey] = useState(Date.now());

  // Version History Modal State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/itineraries/${id}/versions`);
      const json = await res.json();
      if (json.versions) setVersions(json.versions);
    } catch (e) {
      console.error("Failed to fetch versions:", e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (vNum: number) => {
    if (!confirm(`Restore Version ${vNum}? Current draft will be overwritten with this snapshot.`)) return;
    try {
      const res = await fetch(`/api/itineraries/${id}/versions/${vNum}/restore`, { method: "POST" });
      const json = await res.json();
      if (json.itinerary) {
        dispatch({ type: "RESET", payload: json.itinerary });
        setShowVersionModal(false);
        setIframeKey(Date.now());
      } else {
        alert("Failed to restore version: " + (json.error || "Unknown"));
      }
    } catch (e) {
      alert("Failed to restore version: " + (e as Error).message);
    }
  };

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewReloadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Itinerary from API
  useEffect(() => {
    async function loadItinerary() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/itineraries/${id}`);
        if (!res.ok) throw new Error("Failed to load itinerary");
        const json = await res.json();
        dispatch({ type: "RESET", payload: json.itinerary });
      } catch (err) {
        console.error("Error loading itinerary:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      loadItinerary();
    }
  }, [id]);

  // Keyboard Shortcuts for Undo (Ctrl+Z) & Redo (Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (e.shiftKey) {
          dispatch({ type: "REDO" });
        } else {
          dispatch({ type: "UNDO" });
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        dispatch({ type: "REDO" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update Itinerary State and schedule Debounced Autosave (800ms) & Preview Refresh (1200ms)
  const handleUpdate = (updater: (prev: Itinerary) => Itinerary) => {
    if (!history.present) return;
    const nextState = updater(history.present);
    dispatch({ type: "SET", payload: nextState });
    setSaveStatus("unsaved");

    // 1. Debounced Autosave (800ms)
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const res = await fetch(`/api/itineraries/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ data: nextState }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    }, 800);

    // 2. Debounced Live Preview Refresh (1200ms)
    if (previewReloadTimerRef.current) clearTimeout(previewReloadTimerRef.current);
    previewReloadTimerRef.current = setTimeout(() => {
      setIframeKey(Date.now());
    }, 1200);
  };

  // Generate PDF Handler
  const handleGeneratePdf = async () => {
    if (!history.present) return;
    setIsGeneratingPdf(true);
    try {
      // Flush save first
      await fetch(`/api/itineraries/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: history.present }),
      });

      const res = await fetch(`/api/itineraries/${id}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setPdfResult({ url: data.pdfUrl, version: data.versionNumber });
        setIframeKey(Date.now());
      } else {
        alert("Failed to generate PDF: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error generating PDF: " + (err as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading || !history.present) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-base font-medium text-slate-300">Loading Itinerary Editor...</div>
      </div>
    );
  }

  const itinerary = history.present;
  const reviewFlags = itinerary.meta?.reviewFlags || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-800">
      {/* TOP COMMAND BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-xs uppercase bg-red-600 px-2 py-0.5 rounded">
                TrippyGo
              </span>
              <h1 className="text-sm md:text-base font-bold truncate max-w-xs md:max-w-md">
                {itinerary.package.title}
              </h1>
            </div>
            <div className="text-[11px] text-slate-400">
              {itinerary.package.nights}N / {itinerary.package.days}D •{" "}
              {itinerary.package.destinations.join(", ")}
            </div>
          </div>
        </div>

        {/* Center: Save Indicator & Undo/Redo */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          {/* Autosave Status */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                <span className="text-slate-300">Autosaving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-emerald-400 font-medium">All changes saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-400">Unsaved edits</span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={history.past.length === 0}
              title="Undo (Ctrl+Z)"
              className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch({ type: "REDO" })}
              disabled={history.future.length === 0}
              title="Redo (Ctrl+Y)"
              className="p-1 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: View Mode Toggle & Generate PDF Button */}
        <div className="flex items-center gap-2">
          {/* Mobile view switchers */}
          <div className="flex lg:hidden bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveViewMode("form")}
              className={`p-1.5 rounded text-xs ${
                activeViewMode === "form" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveViewMode("preview")}
              className={`p-1.5 rounded text-xs ${
                activeViewMode === "preview" ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              fetchVersions();
              setShowVersionModal(true);
            }}
            title="Version History & PDF Downloads"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Versions</span>
          </button>

          <button
            onClick={() => setIframeKey(Date.now())}
            title="Refresh Preview"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Preview
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Rendering PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Generate Client PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* REVIEW FLAGS NOTICE BANNER */}
      {reviewFlags.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-300 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Review Flags:</strong> Found {reviewFlags.length} extracted field(s) needing
              salesperson verification. Fields are highlighted with gold borders.
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            Auto-clears as you edit
          </span>
        </div>
      )}

      {/* PDF RESULT MODAL BANNER */}
      {pdfResult && (
        <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle className="w-5 h-5 text-white" />
            <span>
              Itinerary Version {pdfResult.version} generated successfully! Ready to deliver to client.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1 rounded text-xs font-bold transition shadow-sm"
            >
              Open PDF Document
            </a>
            <button
              onClick={() => setPdfResult(null)}
              className="text-white hover:text-emerald-200 text-xs px-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-PANE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: FORM PANELS (60%) */}
        <div
          className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 ${
            activeViewMode === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {/* 1. Basics Panel */}
          <BasicsPanel
            packageData={itinerary.package}
            onChange={(pkg) => handleUpdate((prev) => ({ ...prev, package: pkg }))}
            reviewFlags={reviewFlags}
            extractedSnapshot={itinerary.meta.extractedSnapshot}
          />

          {/* 2. Flights & Boarding Passes Panel */}
          <FlightsPanel
            flights={itinerary.flights || []}
            packageData={itinerary.package}
            days={itinerary.days}
            onChange={(flights) => handleUpdate((prev) => ({ ...prev, flights }))}
            reviewFlags={reviewFlags}
          />

          {/* 3. Days Panel */}
          <DaysPanel
            days={itinerary.days}
            onChange={(days) => handleUpdate((prev) => ({ ...prev, days }))}
            reviewFlags={reviewFlags}
          />

          {/* 3. Inclusions & Exclusions */}
          <InclusionsPanel
            inclusions={itinerary.inclusions}
            exclusions={itinerary.exclusions}
            onChange={({ inclusions, exclusions }) =>
              handleUpdate((prev) => ({ ...prev, inclusions, exclusions }))
            }
            reviewFlags={reviewFlags}
          />

          {/* 4. Commercials & Pricing */}
          <PricingPanel
            pricing={itinerary.pricing}
            onChange={(pricing) => handleUpdate((prev) => ({ ...prev, pricing }))}
            reviewFlags={reviewFlags}
          />

          {/* 5. Payment & Cancellation Terms */}
          <TermsPanel
            terms={itinerary.terms}
            onChange={(terms) => handleUpdate((prev) => ({ ...prev, terms }))}
            reviewFlags={reviewFlags}
          />

          {/* 6. Contact & Specialist */}
          <ContactPanel
            salesperson={itinerary.salesperson}
            onChange={(salesperson) => handleUpdate((prev) => ({ ...prev, salesperson }))}
          />
        </div>

        {/* RIGHT PANE: LIVE PREVIEW IFRAME (40%) */}
        <div
          className={`w-full lg:w-[45%] xl:w-[40%] bg-slate-200 border-l border-slate-300 flex flex-col ${
            activeViewMode === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Live Preview Header */}
          <div className="bg-slate-300/80 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Client HTML Preview
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Updates on keystroke</span>
              <button
                onClick={() => setIframeKey(Date.now())}
                className="hover:text-slate-900"
                title="Reload Frame"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preview iFrame */}
          <div className="flex-1 p-2 md:p-3 overflow-hidden">
            <iframe
              key={iframeKey}
              src={`/print/${id}?preview=1`}
              className="w-full h-full bg-white rounded-lg shadow-inner border border-slate-300"
              title="Itinerary Client Live Preview"
            />
          </div>
        </div>
      </div>

      {/* VERSION HISTORY MODAL */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Itinerary Version History & Audit Trail</h3>
              </div>
              <button
                onClick={() => setShowVersionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {loadingVersions ? (
                <div className="py-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading versions...</span>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <p>No generated versions found yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click &quot;Generate Client PDF&quot; in the editor to record an immutable version snapshot with SHA-256 verification.
                  </p>
                </div>
              ) : (
                versions.map((ver) => (
                  <div
                    key={ver.id || ver.versionNumber}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-600/80 text-white text-xs font-bold px-2 py-0.5 rounded">
                          Version {ver.versionNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(ver.changedAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        {ver.data?.package?.title || "Itinerary Snapshot"} • {ver.data?.package?.nights}N/{ver.data?.package?.days}D
                      </div>
                      {ver.pdfJsonHash && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          SHA256: {ver.pdfJsonHash.slice(0, 16)}...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {ver.downloadUrl && (
                        <a
                          href={ver.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>PDF</span>
                        </a>
                      )}

                      <button
                        onClick={() => handleRestoreVersion(ver.versionNumber)}
                        className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Restore this version into editor"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              Every PDF generation records an immutable snapshot with cryptographic hash for full B2B auditing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
