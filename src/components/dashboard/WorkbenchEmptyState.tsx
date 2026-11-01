"use client";

import React from "react";
import { FileUp, Sparkles, Plus, SearchX } from "lucide-react";

interface WorkbenchEmptyStateProps {
  isSearchEmpty: boolean;
  searchQuery?: string;
  onClearSearch: () => void;
  onOpenNewModal: () => void;
  onLoadSample: () => void;
  isProcessing?: boolean;
}

export function WorkbenchEmptyState({
  isSearchEmpty,
  searchQuery,
  onClearSearch,
  onOpenNewModal,
  onLoadSample,
  isProcessing = false,
}: WorkbenchEmptyStateProps) {
  if (isSearchEmpty) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <SearchX className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#091c3e] mb-1">No matching itineraries</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          No proposals found matching &ldquo;{searchQuery}&rdquo;. Check for typos or clear your search
          to view all proposals.
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition focus-visible:ring-2 focus-visible:ring-[#091c3e]"
        >
          Clear Search Filter
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 rounded-2xl bg-[#091c3e]/5 border border-[#091c3e]/10 flex items-center justify-center mx-auto mb-4 text-[#091c3e]">
        <FileUp className="w-7 h-7" />
      </div>

      <h3 className="text-xl font-serif font-bold text-[#091c3e] mb-2">
        Welcome to TrippyGo Itinerary Workbench
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        Transform unbranded supplier quotes (PDF, WhatsApp chats, or email text) into luxury,
        client-ready A4 PDF proposals in under 5 minutes.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenNewModal}
          disabled={isProcessing}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#c92229] hover:bg-[#b01d23] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#c92229]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Create First Itinerary
        </button>

        <button
          type="button"
          onClick={onLoadSample}
          disabled={isProcessing}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#091c3e]"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Load Kashmir 7-Day Sample Tour
        </button>
      </div>
    </div>
  );
}
