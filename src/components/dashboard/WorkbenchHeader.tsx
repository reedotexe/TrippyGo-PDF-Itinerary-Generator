"use client";

import React from "react";
import Link from "next/link";
import { Search, Plus, Settings, X } from "lucide-react";

interface WorkbenchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewModal: () => void;
  isProcessing?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function WorkbenchHeader({
  searchQuery,
  onSearchChange,
  onOpenNewModal,
  isProcessing = false,
  searchInputRef,
}: WorkbenchHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#091c3e] flex items-center justify-center font-serif font-black text-xl text-white shadow-sm ring-1 ring-black/5">
            T
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-[#091c3e] leading-tight flex items-center gap-2">
              TrippyGo
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                Operations
              </span>
            </div>
            <div className="text-xs text-slate-500 font-medium">B2B Proposal & Itinerary Engine</div>
          </div>
        </div>

        {/* Global Search Bar (Center / Flexible) */}
        <div className="flex-1 max-w-lg mx-2 hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by client, destination, or title... (⌘K)"
              aria-label="Search proposals"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-[#091c3e] rounded-lg text-slate-900 placeholder:text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]/20"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/settings"
            className="min-h-[38px] px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#091c3e] focus-visible:outline-none"
            title="Configure Agency Settings"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <button
            type="button"
            onClick={onOpenNewModal}
            disabled={isProcessing}
            className="min-h-[38px] px-4 py-2 rounded-lg bg-[#c92229] hover:bg-[#b01d23] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#c92229] focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Itinerary</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search proposals..."
            aria-label="Search proposals on mobile"
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#091c3e]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear mobile search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
