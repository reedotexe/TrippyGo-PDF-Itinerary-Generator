"use client";

import React from "react";
import { formatInr } from "@/lib/pricing";

interface WorkbenchMetricsProps {
  totalCount: number;
  draftCount: number;
  generatedCount: number;
  totalPipelinePaise: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export function WorkbenchMetrics({
  totalCount,
  draftCount,
  generatedCount,
  totalPipelinePaise,
  statusFilter,
  onStatusFilterChange,
}: WorkbenchMetricsProps) {
  const formattedPipeline = totalPipelinePaise > 0 ? formatInr(totalPipelinePaise) : "₹0";

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Key Metrics Strip */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Total Proposals
              </div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#091c3e]">
                {totalCount}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                PDFs Ready
              </div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-emerald-800 flex items-center gap-1.5">
                {generatedCount}
                <span className="text-xs font-sans font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  Active
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                In Draft
              </div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-slate-800">
                {draftCount}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="hidden lg:block">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Total Pipeline Quoted
              </div>
              <div className="text-xl sm:text-2xl font-serif font-bold text-[#091c3e]">
                {formattedPipeline}
              </div>
            </div>
          </div>

          {/* Quick Filter Segmented Control */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === "all"
                  ? "bg-white text-[#091c3e] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("generated")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === "generated"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              PDF Ready ({generatedCount})
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("draft")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                statusFilter === "draft"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
