"use client";

import React from "react";

interface WorkbenchMetricsProps {
  draftCount: number;
  generatedCount: number;
  isAdmin?: boolean;
}

export function WorkbenchMetrics({
  draftCount,
  generatedCount,
  isAdmin = false,
}: WorkbenchMetricsProps) {
  if (!isAdmin) return null;

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-6 sm:gap-8">
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              PDFs ready
            </div>
            <div className="text-2xl font-semibold text-success">
              {generatedCount}
            </div>
          </div>

          <div className="h-8 w-px bg-border" />

          <div>
            <div className="text-xs font-medium text-muted-foreground">
              Drafts
            </div>
            <div className="text-2xl font-semibold text-foreground">
              {draftCount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
