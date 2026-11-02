"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkbenchMetricsProps {
  totalCount: number;
  draftCount: number;
  generatedCount: number;
  totalPipelinePaise: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  isAdmin?: boolean;
}

export function WorkbenchMetrics({
  totalCount,
  draftCount,
  generatedCount,
  statusFilter,
  onStatusFilterChange,
  isAdmin = false,
}: WorkbenchMetricsProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Admin-only KPI strip: reduced to "PDFs ready" and "Drafts" */}
          {isAdmin ? (
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
          ) : (
            <div />
          )}

          {/* Quick Filter Segmented Control: All / Drafts / PDF ready */}
          <Tabs
            value={statusFilter}
            onValueChange={onStatusFilterChange}
            className="self-start sm:self-auto"
          >
            <TabsList variant="default">
              <TabsTrigger value="all">
                All ({totalCount})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Drafts ({draftCount})
              </TabsTrigger>
              <TabsTrigger value="generated">
                PDF ready ({generatedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
