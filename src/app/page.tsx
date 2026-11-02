"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { WorkbenchHeader } from "@/components/dashboard/WorkbenchHeader";
import { WorkbenchMetrics } from "@/components/dashboard/WorkbenchMetrics";
import { ItineraryTable } from "@/components/dashboard/ItineraryTable";
import { WorkbenchEmptyState } from "@/components/dashboard/WorkbenchEmptyState";
import { NewItineraryModal } from "@/components/dashboard/NewItineraryModal";
import { ItinerarySummary } from "@/lib/db/itineraries";
import { KASHMIR_SAMPLE_TOUR } from "@/lib/constants/sample-tour";

const PAGE_SIZE = 20;

export default function HomePage() {
  const router = useRouter();
  const { data: sessionData } = useSession();
  const isAdmin = sessionData?.user?.role === "admin";

  const [itineraries, setItineraries] = useState<ItinerarySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch proposals list
  const loadItineraries = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/itineraries");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to load proposals (status ${res.status})`);
      }
      const data = await res.json();
      setItineraries(data.itineraries || []);
    } catch (err: unknown) {
      console.error("Error loading itineraries:", err);
      setFetchError(
        (err as Error)?.message ||
          "Failed to load proposals. Please check your network and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

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

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

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

  // Paginated Itineraries
  const totalPages = Math.max(1, Math.ceil(filteredItineraries.length / PAGE_SIZE));
  const paginatedItineraries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredItineraries.slice(start, start + PAGE_SIZE);
  }, [filteredItineraries, currentPage]);

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

  // Duplicate Proposal
  const handleDuplicate = async (id: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/itineraries/${id}`);
      if (!res.ok) throw new Error("Failed to load itinerary to duplicate");
      const json = await res.json();
      const origData = json.itinerary;
      const duplicatedData = {
        ...origData,
        title: `Copy of ${origData.title || "Itinerary"}`,
      };
      const createRes = await fetch("/api/itineraries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: duplicatedData }),
      });
      if (!createRes.ok) throw new Error("Failed to duplicate itinerary");
      const created = await createRes.json();
      router.push(`/itineraries/${created.id}/edit`);
    } catch (err) {
      console.error("Duplicate error:", err);
      setErrorMsg((err as Error).message || "Failed to duplicate itinerary.");
      setIsProcessing(false);
    }
  };

  // Soft Delete Proposal
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
    handleExtract(KASHMIR_SAMPLE_TOUR);
  };

  return (
    <div className="app-shell min-h-screen bg-background text-foreground font-sans">
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
        isAdmin={isAdmin}
      />

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {fetchError && !isLoading ? (
          <div className="bg-card rounded-lg border border-destructive/20 p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs space-y-4">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Unable to load proposals
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {fetchError}
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={loadItineraries}
                className="gap-2"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </div>
          </div>
        ) : itineraries.length === 0 && !isLoading ? (
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
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                Proposals
              </h1>
            </div>

            <ItineraryTable
              itineraries={paginatedItineraries}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isDeletingId={deletingId}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItineraries.length}
              onPageChange={setCurrentPage}
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
