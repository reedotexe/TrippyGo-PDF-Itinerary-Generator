const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/app/itineraries/[id]/edit/page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update imports
const oldImports = `import {
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
} from "lucide-react";`;

const newImports = `import {
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
  RotateCcw,
  X,
  ClipboardList,
  Plane,
  CalendarDays,
  ListChecks,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

// --- Workflow Stepper Navigation Types ---
export type EditorTabId = "overview" | "flights" | "days" | "inclusions" | "pricing";

export interface EditorTabItem {
  id: EditorTabId;
  label: string;
  stepNumber: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const EDITOR_TABS: EditorTabItem[] = [
  { id: "overview", label: "Overview", stepNumber: 1, icon: ClipboardList, description: "Title, dates, pax & cover photo" },
  { id: "flights", label: "Flights", stepNumber: 2, icon: Plane, description: "Carrier, times & baggage" },
  { id: "days", label: "Day Plan", stepNumber: 3, icon: CalendarDays, description: "Daily schedules, stays & day photos" },
  { id: "inclusions", label: "Inclusions", stepNumber: 4, icon: ListChecks, description: "What is covered & cancellation policy" },
  { id: "pricing", label: "Pricing", stepNumber: 5, icon: IndianRupee, description: "Commercials, markup & final quotation" },
];`;

content = content.replace(oldImports, newImports);

// 2. Add Tab State and Navigation Logic inside ItineraryEditorContent
const targetStatePoint = `  const [iframeKey, setIframeKey] = useState(Date.now());`;
const tabStateCode = `  const [iframeKey, setIframeKey] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<EditorTabId>("overview");

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
      window.history.replaceState(null, "", \`#\${newTab}\`);
    }
  };

  // Keyboard navigation: Ctrl+1..5 to switch tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditingText =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && !isEditingText) {
        if (e.key === "1") { e.preventDefault(); handleTabChange("overview"); }
        else if (e.key === "2") { e.preventDefault(); handleTabChange("flights"); }
        else if (e.key === "3") { e.preventDefault(); handleTabChange("days"); }
        else if (e.key === "4") { e.preventDefault(); handleTabChange("inclusions"); }
        else if (e.key === "5") { e.preventDefault(); handleTabChange("pricing"); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentTabIndex = EDITOR_TABS.findIndex((t) => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === EDITOR_TABS.length - 1;

  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      handleTabChange(EDITOR_TABS[currentTabIndex - 1].id);
    }
  };

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
      if (tabId === "overview") return f.startsWith("package") || f.startsWith("title") || f.startsWith("destinations");
      if (tabId === "flights") return f.startsWith("flights");
      if (tabId === "days") return f.startsWith("days");
      if (tabId === "inclusions") return f.startsWith("inclusions") || f.startsWith("exclusions");
      if (tabId === "pricing") return f.startsWith("pricing") || f.startsWith("terms");
      return false;
    }).length;
  };`;

content = content.replace(targetStatePoint, tabStateCode);

// 3. Update the JSX return statement
// Find where `<div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-800">` starts
const jsxStartPoint = `  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-800">`;

// Let's replace the whole JSX from `jsxStartPoint` down to `      {/* VERSION HISTORY MODAL */}`
const oldJsxUpToModal = content.slice(content.indexOf(jsxStartPoint), content.indexOf(`      {/* VERSION HISTORY MODAL */}`));

const newJsxUpToModal = `  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased text-slate-800">
      {/* TOP COMMAND BAR */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="min-h-[38px] min-w-[38px] p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-xs uppercase bg-[#c92229] px-2 py-0.5 rounded text-white">
                TrippyGo
              </span>
              <h1 className="text-sm md:text-base font-bold truncate max-w-xs md:max-w-md">
                {itinerary.package.title}
              </h1>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {itinerary.package.nights}N / {itinerary.package.days}D •{" "}
              {itinerary.package.destinations.join(", ")}
            </div>
          </div>
        </div>

        {/* Center: Calm Autosave Status & Undo/Redo */}
        <div className="hidden md:flex items-center gap-3 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700/60">
          {/* Calm Autosave Status (Zero distracting ping) */}
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-slate-200">Saving changes...</span>
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
              aria-label="Undo last change"
              className="min-h-[34px] min-w-[34px] p-1.5 rounded hover:bg-slate-700 text-slate-200 disabled:opacity-30 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => dispatch({ type: "REDO" })}
              disabled={history.future.length === 0}
              title="Redo (Ctrl+Y)"
              aria-label="Redo change"
              className="min-h-[34px] min-w-[34px] p-1.5 rounded hover:bg-slate-700 text-slate-200 disabled:opacity-30 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: View Mode Toggle, Versions & Primary PDF Button */}
        <div className="flex items-center gap-2">
          {/* Mobile view switchers */}
          <div className="flex lg:hidden bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveViewMode("form")}
              aria-label="Switch to editor form view"
              className={\`min-h-[36px] min-w-[36px] p-2 rounded text-xs flex items-center justify-center \${
                activeViewMode === "form" ? "bg-blue-600 text-white" : "text-slate-400"
              }\`}
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveViewMode("preview")}
              aria-label="Switch to live preview"
              className={\`min-h-[36px] min-w-[36px] p-2 rounded text-xs flex items-center justify-center \${
                activeViewMode === "preview" ? "bg-blue-600 text-white" : "text-slate-400"
              }\`}
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
            aria-label="View itinerary versions and history"
            className="hidden sm:flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>Versions</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            aria-label="Generate Client PDF"
            className="min-h-[38px] px-4 py-2 bg-[#c92229] hover:bg-[#b01d23] text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            {isGeneratingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin motion-reduce:animate-none"></div>
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

      {/* STICKY WORKFLOW TAB STEPPER BAR */}
      <nav
        aria-label="Itinerary Workflow Stepper"
        className="sticky top-[57px] z-30 bg-white border-b border-slate-200/90 px-4 md:px-6 shadow-2xs"
      >
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" role="tablist">
            {EDITOR_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const flagCount = getTabFlagCount(tab.id);

              return (
                <button
                  key={tab.id}
                  id={\`tab-\${tab.id}\`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={\`panel-\${tab.id}\`}
                  onClick={() => handleTabChange(tab.id)}
                  className={\`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 \${
                    isActive
                      ? "bg-[#091c3e] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }\`}
                >
                  <Icon className={\`w-4 h-4 \${isActive ? "text-amber-400" : "text-slate-400"}\`} />
                  <span>{tab.stepNumber}. {tab.label}</span>
                  {flagCount > 0 && (
                    <span
                      title={\`\${flagCount} field(s) require verification\`}
                      className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      {flagCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stepper progress & keyboard shortcut hints */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-slate-400">
            <span>
              Step <strong>{currentTabIndex + 1}</strong> of <strong>{EDITOR_TABS.length}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-medium text-slate-500">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">Ctrl+1</kbd>–<kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-700">5</kbd>
            </span>
          </div>
        </div>
      </nav>

      {/* REVIEW FLAGS NOTICE BANNER (Compact, non-disruptive) */}
      {reviewFlags.length > 0 && (
        <div className="bg-amber-500/10 border-b border-amber-300/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Review Flags:</strong> Found {reviewFlags.length} extracted field(s) needing
              salesperson verification. Fields are highlighted with gold borders and auto-clear as you edit.
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            Auto-clears
          </span>
        </div>
      )}

      {/* FLOATING PDF RESULT TOAST (Zero layout shift / CLS = 0) */}
      {pdfResult && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 border border-slate-700/80 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">Client PDF Ready</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                v{pdfResult.version}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              Itinerary version generated successfully with verified layout.
            </p>
            <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-slate-800">
              <a
                href={pdfResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[34px] px-3.5 py-1.5 bg-[#c92229] hover:bg-[#b01d23] text-white rounded-lg text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <FileDown className="w-3.5 h-3.5" /> Open PDF Document
              </a>
              <button
                onClick={() => setPdfResult(null)}
                className="min-h-[34px] px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setPdfResult(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN TWO-PANE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANE: WORKFLOW FORM PANELS (60%) */}
        <div
          className={\`flex-1 overflow-y-auto p-4 md:p-6 \${
            activeViewMode === "preview" ? "hidden lg:block" : "block"
          }\`}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* TAB 1: OVERVIEW & LOGISTICS */}
            {activeTab === "overview" && (
              <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="space-y-6">
                <BasicsPanel
                  packageData={itinerary.package}
                  onChange={(pkg) => handleUpdate((prev) => ({ ...prev, package: pkg }))}
                  reviewFlags={reviewFlags}
                  extractedSnapshot={itinerary.meta.extractedSnapshot}
                />
                <ContactPanel
                  salesperson={itinerary.salesperson}
                  onChange={(salesperson) => handleUpdate((prev) => ({ ...prev, salesperson }))}
                />
              </div>
            )}

            {/* TAB 2: FLIGHTS & BOARDING PASSES */}
            {activeTab === "flights" && (
              <div id="panel-flights" role="tabpanel" aria-labelledby="tab-flights" className="space-y-6">
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
              <div id="panel-days" role="tabpanel" aria-labelledby="tab-days" className="space-y-6">
                <DaysPanel
                  days={itinerary.days}
                  onChange={(days) => handleUpdate((prev) => ({ ...prev, days }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* TAB 4: INCLUSIONS, EXCLUSIONS & POLICIES */}
            {activeTab === "inclusions" && (
              <div id="panel-inclusions" role="tabpanel" aria-labelledby="tab-inclusions" className="space-y-6">
                <InclusionsPanel
                  inclusions={itinerary.inclusions}
                  exclusions={itinerary.exclusions}
                  onChange={({ inclusions, exclusions }) =>
                    handleUpdate((prev) => ({ ...prev, inclusions, exclusions }))
                  }
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* TAB 5: COMMERCIALS, PRICING & TERMS */}
            {activeTab === "pricing" && (
              <div id="panel-pricing" role="tabpanel" aria-labelledby="tab-pricing" className="space-y-6">
                <PricingPanel
                  pricing={itinerary.pricing}
                  passengerCount={
                    (itinerary.package.travellers?.adults || 0) +
                      (itinerary.package.travellers?.children || 0) || 2
                  }
                  onChange={(pricing) => handleUpdate((prev) => ({ ...prev, pricing }))}
                  reviewFlags={reviewFlags}
                />
                <TermsPanel
                  terms={itinerary.terms}
                  onChange={(terms) => handleUpdate((prev) => ({ ...prev, terms }))}
                  reviewFlags={reviewFlags}
                />
              </div>
            )}

            {/* BOTTOM WORKFLOW STEPPER NAVIGATION FOOTER */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-200 mt-6 bg-slate-100 py-3 sticky bottom-0 z-20">
              <button
                type="button"
                disabled={isFirstTab}
                onClick={goToPrevTab}
                className="min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1.5 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>

              <div className="text-xs text-slate-500 font-medium hidden sm:flex items-center gap-2">
                <span>
                  Step <strong>{currentTabIndex + 1}</strong> of <strong>{EDITOR_TABS.length}</strong>:
                </span>
                <span className="font-bold text-slate-800">{EDITOR_TABS[currentTabIndex].label}</span>
              </div>

              {!isLastTab ? (
                <button
                  type="button"
                  onClick={goToNextTab}
                  className="min-h-[40px] px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#091c3e] hover:bg-blue-900 transition flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span>Next: {EDITOR_TABS[currentTabIndex + 1].label}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="min-h-[40px] px-5 py-2 bg-[#c92229] hover:bg-[#b01d23] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Generate Client PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANE: LIVE PREVIEW IFRAME (40%) */}
        <div
          className={\`w-full lg:w-[45%] xl:w-[40%] bg-slate-200 border-l border-slate-300 flex flex-col \${
            activeViewMode === "form" ? "hidden lg:flex" : "flex"
          }\`}
        >
          {/* Live Preview Header */}
          <div className="bg-slate-300 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs text-slate-800">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-reduce:animate-none"></span>
              Live Client HTML Preview
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-medium text-xs">Updates on keystroke</span>
              <button
                onClick={() => setIframeKey(Date.now())}
                className="hover:text-slate-900 p-1 rounded focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                title="Reload Frame"
                aria-label="Reload frame"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Preview iFrame */}
          <div className="flex-1 p-2 md:p-3 overflow-hidden">
            <iframe
              key={iframeKey}
              src={\`/print/\${id}?preview=1\`}
              className="w-full h-full bg-white rounded-lg shadow-inner border border-slate-300"
              title="Itinerary Client Live Preview"
            />
          </div>
        </div>
      </div>
`;

content = content.replace(oldJsxUpToModal, newJsxUpToModal);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated src/app/itineraries/[id]/edit/page.tsx with Phase 1 improvements!');
