"use client";

import React, { useEffect, useState, useReducer, useRef, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Itinerary } from "@/lib/schema/itinerary";
import BasicsPanel from "@/components/editor/BasicsPanel";
import FlightsPanel from "@/components/editor/FlightsPanel";
import DaysPanel from "@/components/editor/DaysPanel";
import InclusionsPanel from "@/components/editor/InclusionsPanel";
import PricingPanel from "@/components/editor/PricingPanel";
import TermsPanel from "@/components/editor/TermsPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  History,
  Download,
  RotateCcw,
  X,
  ClipboardList,
  Plane,
  CalendarDays,
  ListChecks,
  IndianRupee,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Keyboard,
} from "lucide-react";

// --- Workflow Stepper Navigation Types ---
export type EditorTabId = "overview" | "flights" | "days" | "inclusions" | "pricing";

export interface EditorTabItem {
  id: EditorTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const EDITOR_TABS: EditorTabItem[] = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "days", label: "Days", icon: CalendarDays },
  { id: "inclusions", label: "Inclusions", icon: ListChecks },
  { id: "pricing", label: "Pricing", icon: IndianRupee },
];

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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
          <div className="text-sm font-medium text-muted-foreground">Loading editor…</div>
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
  const id = (params?.id as string) || (typeof window !== "undefined" ? window.location.pathname.split("/")[2] : "");

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
  const [activeTab, setActiveTab] = useState<EditorTabId>("overview");

  // Version History Modal State
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Keyboard Shortcuts Modal State
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Review Flag Navigation State
  const [reviewFlagIndex, setReviewFlagIndex] = useState(0);

  // Stable Refs for Autosave and Live Preview Iframe Preservation
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewReloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Soft preview reloader (retains iframe DOM element, preventing flash & unmount thrashing)
  const reloadPreview = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.location.reload();
        return;
      } catch {
        // Fallback for cross-domain or strict security origins
        iframeRef.current.src = `/print/${id}?preview=1&t=${Date.now()}`;
        return;
      }
    }
    if (iframeRef.current) {
      iframeRef.current.src = `/print/${id}?preview=1&t=${Date.now()}`;
    }
  }, [id]);

  // Flush pending save immediately (e.g. before back navigation, PDF generation, or on Ctrl+S)
  const flushSave = useCallback(async (): Promise<boolean> => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (!history.present) return true;
    try {
      setSaveStatus("saving");
      const res = await fetch(`/api/itineraries/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: history.present }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        return true;
      } else {
        setSaveStatus("unsaved");
        return false;
      }
    } catch (err) {
      console.error("Flush save failed:", err);
      setSaveStatus("unsaved");
      return false;
    }
  }, [history.present, id]);

  // Read initial hash on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as EditorTabId;
      if (["overview", "flights", "days", "inclusions", "pricing"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (newTab: EditorTabId) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${newTab}`);
    }
  };

  // Safe navigation back to dashboard (flushes pending save to prevent silent data loss)
  const handleBack = async () => {
    if (saveStatus === "unsaved" || autosaveTimerRef.current) {
      await flushSave();
    }
    router.push("/");
  };

  // Browser exit guard (warns user if unsaved edits are in-flight)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved" || autosaveTimerRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  const currentTabIndex = EDITOR_TABS.findIndex((t) => t.id === activeTab);
  const isLastTab = currentTabIndex === EDITOR_TABS.length - 1;

  const goToNextTab = () => {
    if (currentTabIndex < EDITOR_TABS.length - 1) {
      handleTabChange(EDITOR_TABS[currentTabIndex + 1].id);
    }
  };

  const getTabFlagCount = (tabId: EditorTabId): number => {
    if (!history.present?.meta?.reviewFlags) return 0;
    const flags = history.present.meta.reviewFlags;
    return flags.filter((flag: any) => {
      const f = flag.field || "";
      if (tabId === "overview") return f.startsWith("package") || f.startsWith("title") || f.startsWith("destinations") || f.startsWith("guest");
      if (tabId === "flights") return f.startsWith("flights");
      if (tabId === "days") return f.startsWith("days");
      if (tabId === "inclusions") return f.startsWith("inclusions") || f.startsWith("exclusions");
      if (tabId === "pricing") return f.startsWith("pricing") || f.startsWith("terms");
      return false;
    }).length;
  };

  const getTabForField = (field: string): EditorTabId => {
    if (field.startsWith("flights")) return "flights";
    if (field.startsWith("days")) return "days";
    if (field.startsWith("inclusions") || field.startsWith("exclusions")) return "inclusions";
    if (field.startsWith("pricing") || field.startsWith("terms")) return "pricing";
    return "overview";
  };

  // Sequential Review Cycler (cycles sequentially through flags and focuses target element)
  const handleReviewNext = () => {
    const flags = history.present?.meta?.reviewFlags || [];
    if (flags.length === 0) return;

    const currentIdx = reviewFlagIndex % flags.length;
    const flag = flags[currentIdx];
    const targetTab = getTabForField(flag.field);

    if (activeTab !== targetTab) {
      handleTabChange(targetTab);
    }

    setTimeout(() => {
      const panel = document.getElementById(`panel-${targetTab}`);
      if (!panel) return;

      const specificMatches = Array.from(
        panel.querySelectorAll<HTMLElement>(
          `[id*="${flag.field}"], [name*="${flag.field}"], [data-field*="${flag.field}"]`
        )
      );

      let targetEl = specificMatches[0];

      if (!targetEl) {
        const allFlagged = Array.from(
          panel.querySelectorAll<HTMLElement>(
            `.border-amber-400, .border-amber-500, [data-review-flag], [class*="border-amber"]`
          )
        );
        if (allFlagged.length > 0) {
          targetEl = allFlagged[currentIdx % allFlagged.length];
        }
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof targetEl.focus === "function") {
          targetEl.focus();
        }
      }
    }, 120);

    setReviewFlagIndex((prev) => (prev + 1) % flags.length);
  };

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

  useEffect(() => {
    if (showVersionModal && id) {
      fetchVersions();
    }
  }, [showVersionModal, id]);

  const handleRestoreVersion = async (vNum: number) => {
    if (!confirm(`Restore Version ${vNum}? Current draft will be overwritten with this snapshot.`)) return;
    try {
      const res = await fetch(`/api/itineraries/${id}/versions/${vNum}/restore`, { method: "POST" });
      const json = await res.json();
      if (json.itinerary) {
        dispatch({ type: "RESET", payload: json.itinerary });
        setShowVersionModal(false);
        reloadPreview();
      } else {
        alert("Failed to restore version: " + (json.error || "Unknown"));
      }
    } catch (e) {
      alert("Failed to restore version: " + (e as Error).message);
    }
  };

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
      } finally {
        autosaveTimerRef.current = null;
      }
    }, 800);

    // 2. Debounced Live Preview Refresh (1200ms) using soft reload without iframe unmount
    if (previewReloadTimerRef.current) clearTimeout(previewReloadTimerRef.current);
    previewReloadTimerRef.current = setTimeout(() => {
      reloadPreview();
      previewReloadTimerRef.current = null;
    }, 1200);
  };

  // Generate PDF Handler
  const handleGeneratePdf = useCallback(async () => {
    if (!history.present) return;
    setIsGeneratingPdf(true);
    try {
      // Flush save first
      await flushSave();

      const res = await fetch(`/api/itineraries/${id}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setPdfResult({ url: data.pdfUrl, version: data.versionNumber });
        reloadPreview();
      } else {
        alert("Failed to generate PDF: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error generating PDF: " + (err as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [flushSave, history.present, id, reloadPreview]);

  // Keyboard Shortcuts (Ctrl+S flush, Ctrl+Enter generate, Ctrl+1..5 tabs, Ctrl+Z/Y undo/redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMetaOrCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Application shortcuts (work even when typing in form fields)
      if (isMetaOrCtrl && key === "s" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        flushSave();
        return;
      }

      if (isMetaOrCtrl && e.key === "Enter" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleGeneratePdf();
        return;
      }

      const target = e.target as HTMLElement | null;
      const isEditingText =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // Workflow Tab Switching (Ctrl+1..5) - ignore when typing
      if (isMetaOrCtrl && !e.shiftKey && !e.altKey && !isEditingText) {
        if (e.key === "1") { e.preventDefault(); handleTabChange("overview"); return; }
        if (e.key === "2") { e.preventDefault(); handleTabChange("flights"); return; }
        if (e.key === "3") { e.preventDefault(); handleTabChange("days"); return; }
        if (e.key === "4") { e.preventDefault(); handleTabChange("inclusions"); return; }
        if (e.key === "5") { e.preventDefault(); handleTabChange("pricing"); return; }
      }

      // Undo / Redo for entire itinerary state when not directly typing in an input
      if (isMetaOrCtrl && !isEditingText) {
        if (key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            dispatch({ type: "REDO" });
          } else {
            dispatch({ type: "UNDO" });
          }
        } else if (key === "y") {
          e.preventDefault();
          dispatch({ type: "REDO" });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flushSave, handleGeneratePdf]);

  if (isLoading || !history.present) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
        <div className="text-sm font-medium text-muted-foreground">Loading editor…</div>
      </div>
    );
  }

  const itinerary = history.present;
  const reviewFlags = itinerary.meta?.reviewFlags || [];
  const clientName = itinerary.package?.guestName;
  const estimatedPages = Math.max(2, Math.min(8, Math.ceil((itinerary.package.days || 3) / 2) + 1));

  return (
    <div className="app-shell min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
      {/* TOP COMMAND BAR */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border text-foreground px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            title="Back to dashboard"
            aria-label="Back to dashboard"
            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md">
              {itinerary.package.title || "Untitled Itinerary"}
            </h1>
            <div className="text-xs text-muted-foreground truncate max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md">
              {clientName ? (
                <>
                  <span className="font-medium text-foreground">{clientName}</span>
                  <span className="text-muted-foreground/60 mx-1">•</span>
                </>
              ) : null}
              {itinerary.package.nights}N / {itinerary.package.days}D •{" "}
              {itinerary.package.destinations.join(", ")}
            </div>
          </div>
        </div>

        {/* Center: Calm Autosave Status & Undo/Redo (Desktop only) */}
        <div className="hidden lg:flex items-center gap-3 bg-muted/40 px-2.5 py-1 rounded-md border border-border text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving…</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-muted-foreground font-medium">All changes saved</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                <span className="text-muted-foreground">Unsaved edits</span>
              </>
            )}
          </div>

          <Separator orientation="vertical" className="h-3" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={history.past.length === 0}
              title="Undo (Ctrl+Z)"
              aria-label="Undo last change"
              className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: "REDO" })}
              disabled={history.future.length === 0}
              title="Redo (Ctrl+Y)"
              aria-label="Redo change"
              className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right: View Mode Toggle, More Menu & Primary Action */}
        <div className="flex items-center gap-2">
          {/* Mobile view switchers */}
          <div className="flex lg:hidden rounded-lg p-0.5 border border-border bg-muted">
            <Button
              variant={activeViewMode === "form" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setActiveViewMode("form")}
              aria-label="Switch to editor form view"
              className="h-7 w-7"
            >
              <Sliders className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={activeViewMode === "preview" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setActiveViewMode("preview")}
              aria-label="Switch to live preview"
              className="h-7 w-7"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Overflow Menu: PDF History & Keyboard Shortcuts */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  title="More options"
                  aria-label="More options"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  fetchVersions();
                  setShowVersionModal(true);
                }}
              >
                <History className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>PDF history</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowShortcutsModal(true)}>
                <Keyboard className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>Keyboard shortcuts</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Single Primary Action: Generate Client PDF */}
          <Button
            variant="default"
            size="sm"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            aria-label="Generate Client PDF"
            className="h-8 text-xs font-semibold gap-1.5"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Rendering…</span>
              </>
            ) : (
              <>
                <FileDown className="h-3.5 w-3.5" />
                <span>Generate Client PDF</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* STICKY WORKFLOW TAB BAR */}
      <nav
        aria-label="Itinerary Workflow Stepper"
        className="sticky top-[53px] z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 md:px-6 py-2 shadow-2xs"
      >
        <div className="flex items-center overflow-x-auto no-scrollbar">
          <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as EditorTabId)}>
            <TabsList variant="line" className="h-9 gap-1 sm:gap-2">
              {EDITOR_TABS.map((tab) => {
                const Icon = tab.icon;
                const flagCount = getTabFlagCount(tab.id);

                return (
                  <TabsTrigger
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    value={tab.id}
                    aria-controls={`panel-${tab.id}`}
                    className="gap-2 text-xs font-medium px-3 py-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {flagCount > 0 && (
                      <span
                        title={`${flagCount} field(s) require verification`}
                        className="h-1.5 w-1.5 rounded-full bg-warning shrink-0"
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* REVIEW FLAGS NOTICE BANNER (Semantic tokens & verified WCAG AA contrast) */}
      {reviewFlags.length > 0 && (
        <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-foreground">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-transparent bg-transparent py-0 px-0 flex items-center justify-between shadow-none">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <AlertDescription className="text-xs text-foreground font-medium">
                  {reviewFlags.length} {reviewFlags.length === 1 ? "field" : "fields"} to review
                </AlertDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReviewNext}
                className="h-7 text-xs border-warning/40 hover:bg-warning/20 text-foreground font-medium shrink-0"
              >
                Review next ({((reviewFlagIndex) % reviewFlags.length) + 1}/{reviewFlags.length})
              </Button>
            </Alert>
          </div>
        </div>
      )}

      {/* FLOATING PDF RESULT TOAST (Variant outline to prevent dual primary conflict) */}
      {pdfResult && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-card border border-border text-card-foreground p-4 rounded-xl shadow-lg flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-success/15 border border-success/30 text-success-text flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground tracking-tight">Client PDF Ready</h4>
              <Badge variant="secondary" className="text-xs font-semibold">
                v{pdfResult.version}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Itinerary proposal generated successfully with verified layout.
            </p>
            <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                render={
                  <a href={pdfResult.url} target="_blank" rel="noopener noreferrer">
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Open PDF</span>
                  </a>
                }
                className="h-7 text-xs font-semibold gap-1.5"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPdfResult(null)}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPdfResult(null)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* MAIN TWO-PANE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: WORKFLOW FORM PANELS (60%) */}
        <div
          className={`flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20 ${
            activeViewMode === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* TAB 1: OVERVIEW & LOGISTICS */}
            {activeTab === "overview" && (
              <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabIndex={0} className="space-y-6 focus-visible:outline-none">
                <BasicsPanel
                  packageData={itinerary.package}
                  salesperson={itinerary.salesperson}
                  onChange={(pkg) => handleUpdate((prev) => ({ ...prev, package: pkg }))}
                  onSalespersonChange={(salesperson) => handleUpdate((prev) => ({ ...prev, salesperson }))}
                  reviewFlags={reviewFlags}
                  extractedSnapshot={itinerary.meta.extractedSnapshot}
                />
              </div>
            )}

            {/* TAB 2: FLIGHTS & BOARDING PASSES */}
            {activeTab === "flights" && (
              <div id="panel-flights" role="tabpanel" aria-labelledby="tab-flights" tabIndex={0} className="space-y-6 focus-visible:outline-none">
                <FlightsPanel
                  flights={itinerary.flights || []}
                  packageData={itinerary.package}
                  days={itinerary.days}
                  onChange={(flights) => handleUpdate((prev) => ({ ...prev, flights }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* TAB 3: DAY-BY-DAY ITINERARY PLAN */}
            {activeTab === "days" && (
              <div id="panel-days" role="tabpanel" aria-labelledby="tab-days" tabIndex={0} className="space-y-6 focus-visible:outline-none">
                <DaysPanel
                  days={itinerary.days}
                  onChange={(days) => handleUpdate((prev) => ({ ...prev, days }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* TAB 4: INCLUSIONS, EXCLUSIONS & POLICIES */}
            {activeTab === "inclusions" && (
              <div id="panel-inclusions" role="tabpanel" aria-labelledby="tab-inclusions" tabIndex={0} className="space-y-6 focus-visible:outline-none">
                <InclusionsPanel
                  inclusions={itinerary.inclusions}
                  exclusions={itinerary.exclusions}
                  onChange={({ inclusions, exclusions }) =>
                    handleUpdate((prev) => ({ ...prev, inclusions, exclusions }))
                  }
                  reviewFlags={reviewFlags}
                />
                <TermsPanel
                  terms={itinerary.terms}
                  onChange={(terms) => handleUpdate((prev) => ({ ...prev, terms }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* TAB 5: COMMERCIALS & PRICING WORKBENCH */}
            {activeTab === "pricing" && (
              <div id="panel-pricing" role="tabpanel" aria-labelledby="tab-pricing" tabIndex={0} className="space-y-6 focus-visible:outline-none">
                <PricingPanel
                  pricing={itinerary.pricing}
                  passengerCount={
                    (itinerary.package.travellers?.adults || 0) +
                      (itinerary.package.travellers?.children || 0) || 2
                  }
                  onChange={(pricing) => handleUpdate((prev) => ({ ...prev, pricing }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* BOTTOM WORKFLOW STEPPER NAVIGATION FOOTER */}
            <div className="flex items-center justify-end pt-4 border-t border-border mt-6 py-3 sticky bottom-0 z-20 bg-background/95 backdrop-blur-md">
              {!isLastTab && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNextTab}
                  className="text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <span>Next: {EDITOR_TABS[currentTabIndex + 1].label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW IFRAME (40%) */}
        <div
          className={`w-full lg:w-[45%] xl:w-[40%] bg-muted/30 border-l border-border flex flex-col ${
            activeViewMode === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Live Preview Header */}
          <div className="bg-muted/40 px-4 py-2 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>Live preview</span>
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground bg-background/50 border-border hidden sm:inline-flex"
              >
                Est. A4: ~{estimatedPages} pages
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Updates on keystroke</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={reloadPreview}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Reload preview"
                aria-label="Reload preview"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Preview iFrame with preserved DOM reference */}
          <div className="flex-1 p-2 md:p-3 overflow-hidden">
            <iframe
              ref={iframeRef}
              src={`/print/${id}?preview=1`}
              className="w-full h-full bg-white rounded-lg border border-border shadow-2xs"
              title="Itinerary Client Live Preview"
            />
          </div>
        </div>
      </div>

      {/* PDF HISTORY MODAL (SHADCN DIALOG - Plain travel domain language) */}
      <Dialog open={showVersionModal} onOpenChange={setShowVersionModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <History className="h-4 w-4 text-primary" />
              <span>PDF history</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Saved PDF versions generated for this itinerary.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-3 flex-1">
            {loadingVersions ? (
              <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading PDF history…</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs flex flex-col items-center">
                <p className="font-medium text-foreground text-sm">No saved PDF versions yet</p>
                <p className="text-muted-foreground mt-1 max-w-sm">
                  Render a client proposal to create a saved version you can download or restore at any time.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowVersionModal(false);
                    handleGeneratePdf();
                  }}
                  className="mt-4 gap-1.5 text-xs font-semibold"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Generate client PDF</span>
                </Button>
              </div>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id || ver.versionNumber}
                  className="p-3.5 rounded-lg bg-card border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="font-semibold text-xs">
                        v{ver.versionNumber}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(ver.changedAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {ver.data?.salesperson?.name && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-muted-foreground">Saved by {ver.data.salesperson.name}</span>
                        </>
                      )}
                    </div>
                    <div className="font-medium text-foreground">
                      {ver.data?.package?.title || "Itinerary Snapshot"} • {ver.data?.package?.nights || 0}N/{ver.data?.package?.days || 0}D
                    </div>
                    {ver.pdfJsonHash && (
                      <details className="mt-1 text-xs text-muted-foreground group">
                        <summary className="cursor-pointer text-muted-foreground/80 hover:text-foreground inline-flex items-center gap-1 select-none">
                          <span>Technical details</span>
                        </summary>
                        <div className="mt-1 p-1.5 rounded bg-muted/50 border border-border font-mono text-xs break-all">
                          Checksum: {ver.pdfJsonHash}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ver.downloadUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <a href={ver.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" />
                            <span>PDF</span>
                          </a>
                        }
                        className="h-7 text-xs gap-1"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreVersion(ver.versionNumber)}
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Restore</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* KEYBOARD SHORTCUTS MODAL (SHADCN DIALOG) */}
      <Dialog open={showShortcutsModal} onOpenChange={setShowShortcutsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Keyboard className="h-4 w-4" />
              <span>Keyboard shortcuts</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Shortcuts for navigating and editing the itinerary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-xs py-2">
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Switch tabs</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">1–5</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Save changes</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">S</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Generate client PDF</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Enter</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Undo change</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Z</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-border">
              <span className="text-muted-foreground">Redo change</span>
              <div className="flex items-center gap-1 font-mono text-xs">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">Y</kbd>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
