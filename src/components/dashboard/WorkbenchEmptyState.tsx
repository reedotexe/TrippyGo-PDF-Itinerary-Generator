"use client";

import React from "react";
import { FileUp, SearchX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkbenchEmptyStateProps {
  isSearchEmpty: boolean;
  searchQuery?: string;
  onClearSearch: () => void;
  onOpenNewModal: () => void;
  onLoadSample?: () => void;
  isProcessing?: boolean;
}

export function WorkbenchEmptyState({
  isSearchEmpty,
  searchQuery,
  onClearSearch,
  onOpenNewModal,
  isProcessing = false,
}: WorkbenchEmptyStateProps) {
  if (isSearchEmpty) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center max-w-md mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          No matching itineraries
        </h3>
        <p className="text-xs text-muted-foreground mb-6">
          No proposals found matching &ldquo;{searchQuery}&rdquo;.
        </p>
        <Button
          variant="outline"
          onClick={onClearSearch}
        >
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
        <FileUp className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">
        Welcome to TrippyGo
      </h3>
      <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
        Create your first itinerary to generate luxury, client-ready proposals in minutes.
      </p>

      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          onClick={onOpenNewModal}
          disabled={isProcessing}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          New itinerary
        </Button>
      </div>
    </div>
  );
}
