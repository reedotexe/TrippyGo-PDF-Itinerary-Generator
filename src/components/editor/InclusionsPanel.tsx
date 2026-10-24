"use client";

import React, { useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

interface InclusionsPanelProps {
  inclusions: string[];
  exclusions: string[];
  onChange: (updated: { inclusions: string[]; exclusions: string[] }) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

export default function InclusionsPanel({
  inclusions,
  exclusions,
  onChange,
  reviewFlags = [],
}: InclusionsPanelProps) {
  const [newInc, setNewInc] = useState("");
  const [newExc, setNewExc] = useState("");

  const handleAddInclusion = () => {
    if (!newInc.trim()) return;
    onChange({ inclusions: [...inclusions, newInc.trim()], exclusions });
    setNewInc("");
  };

  const handleRemoveInclusion = (index: number) => {
    onChange({
      inclusions: inclusions.filter((_, i) => i !== index),
      exclusions,
    });
  };

  const handleUpdateInclusion = (index: number, text: string) => {
    const copy = [...inclusions];
    copy[index] = text;
    onChange({ inclusions: copy, exclusions });
  };

  const handleAddExclusion = () => {
    if (!newExc.trim()) return;
    onChange({ inclusions, exclusions: [...exclusions, newExc.trim()] });
    setNewExc("");
  };

  const handleRemoveExclusion = (index: number) => {
    onChange({
      inclusions,
      exclusions: exclusions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateExclusion = (index: number, text: string) => {
    const copy = [...exclusions];
    copy[index] = text;
    onChange({ inclusions, exclusions: copy });
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>⚖️</span> Inclusions & Exclusions
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INCLUSIONS COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Inclusions ({inclusions.length})
            </label>
          </div>

          <div className="space-y-2">
            {inclusions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateInclusion(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveInclusion(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newInc}
              onChange={(e) => setNewInc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInclusion();
                }
              }}
              placeholder="Add inclusion..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={handleAddInclusion}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* EXCLUSIONS COLUMN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-red-800 uppercase flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-600" />
              Exclusions ({exclusions.length})
            </label>
          </div>

          <div className="space-y-2">
            {exclusions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleUpdateExclusion(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveExclusion(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={newExc}
              onChange={(e) => setNewExc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExclusion();
                }
              }}
              placeholder="Add exclusion..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="button"
              onClick={handleAddExclusion}
              className="px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-medium hover:bg-red-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
