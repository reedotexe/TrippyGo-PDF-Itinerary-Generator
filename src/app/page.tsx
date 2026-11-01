"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WorkbenchHeader } from "@/components/dashboard/WorkbenchHeader";
import { WorkbenchMetrics } from "@/components/dashboard/WorkbenchMetrics";
import { ItineraryTable } from "@/components/dashboard/ItineraryTable";
import { WorkbenchEmptyState } from "@/components/dashboard/WorkbenchEmptyState";
import { NewItineraryModal } from "@/components/dashboard/NewItineraryModal";
import { ItinerarySummary } from "@/lib/db/itineraries";

export default function HomePage() {
  const router = useRouter();
  const [itineraries, setItineraries] = useState<ItinerarySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch proposals list
  useEffect(() => {
    let ignore = false;
    fetch("/api/itineraries")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load itineraries");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setItineraries(data.itineraries || []);
        }
      })
      .catch((err) => {
        console.error("Error loading itineraries:", err);
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filtered Itineraries
  const filteredItineraries = useMemo(() => {
    let result = itineraries;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          (item.guestName && item.guestName.toLowerCase().includes(term)) ||
          item.destinations.some((d) => d.toLowerCase().includes(term))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [itineraries, searchQuery, statusFilter]);

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalCount = itineraries.length;
    const generatedCount = itineraries.filter((i) => i.status === "generated").length;
    const draftCount = itineraries.filter((i) => i.status === "draft").length;
    const totalPipelinePaise = itineraries.reduce(
      (sum, item) => sum + (item.sellingPricePaise || 0),
      0
    );

    return {
      totalCount,
      generatedCount,
      draftCount,
      totalPipelinePaise,
    };
  }, [itineraries]);

  // Handle Extraction and immediate redirect to editor
  const handleExtract = async (overrideText?: string, fileToUse?: File) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let res: Response;

      if (fileToUse) {
        const formData = new FormData();
        formData.append("file", fileToUse);

        res = await fetch("/api/extract", {
          method: "POST",
          body: formData,
        });
      } else {
        const textContent = overrideText;
        if (!textContent?.trim()) {
          setErrorMsg("Please paste supplier quotation text or select a file.");
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

  // Create Blank Itinerary
  const handleCreateBlank = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/itineraries", { method: "POST" });
      const data = await res.json();
      router.push(`/itineraries/${data.id}/edit`);
    } catch {
      setErrorMsg("Failed to initialize blank itinerary.");
      setIsProcessing(false);
    }
  };

  // Delete Proposal
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItineraries((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete proposal:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Sample Kashmir Quick Load
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

    handleExtract(kashmirText);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-[#c92229] selection:text-white">
      {/* Top Workbench Navigation */}
      <WorkbenchHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewModal={() => {
          setErrorMsg(null);
          setIsNewModalOpen(true);
        }}
        isProcessing={isProcessing}
        searchInputRef={searchInputRef}
      />

      {/* Metrics Bar */}
      <WorkbenchMetrics
        totalCount={metrics.totalCount}
        draftCount={metrics.draftCount}
        generatedCount={metrics.generatedCount}
        totalPipelinePaise={metrics.totalPipelinePaise}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {itineraries.length === 0 && !isLoading ? (
          <WorkbenchEmptyState
            isSearchEmpty={false}
            onClearSearch={() => setSearchQuery("")}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onLoadSample={handleLoadKashmirSample}
            isProcessing={isProcessing}
          />
        ) : filteredItineraries.length === 0 && !isLoading ? (
          <WorkbenchEmptyState
            isSearchEmpty={true}
            searchQuery={searchQuery}
            onClearSearch={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onLoadSample={handleLoadKashmirSample}
            isProcessing={isProcessing}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#091c3e]">
                  Active Proposals & Client Itineraries
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {filteredItineraries.length} of {itineraries.length} proposals
                </p>
              </div>
            </div>

            <ItineraryTable
              itineraries={filteredItineraries}
              isLoading={isLoading}
              onDelete={handleDelete}
              isDeletingId={deletingId}
            />
          </div>
        )}
      </main>

      {/* New Itinerary Intake Modal */}
      <NewItineraryModal
        isOpen={isNewModalOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsNewModalOpen(false);
            setErrorMsg(null);
          }
        }}
        onExtract={handleExtract}
        onCreateBlank={handleCreateBlank}
        isProcessing={isProcessing}
        errorMsg={errorMsg}
      />
    </div>
  );
}
