"use client";

import React from "react";

interface PrintActionBarProps {
  version?: string;
}

export default function PrintActionBar({ version }: PrintActionBarProps) {
  return (
    <div className="no-print sticky top-0 z-50 flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 text-xs shadow-md">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold uppercase tracking-wider text-slate-300">Live Client Preview</span>
        {version && <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">v{version}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-slate-400">Est. A4 Print Pages: ~3–4</span>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-3 py-1 rounded shadow transition cursor-pointer"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
