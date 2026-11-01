"use client";

import React, { useState } from "react";
import { Terms, CancellationRow } from "@/lib/schema/itinerary";
import {
  Plus,
  Trash2,
  ScrollText,
  Sparkles,
  CalendarCheck,
  ShieldAlert,
  Check,
} from "lucide-react";

interface TermsPanelProps {
  terms: Terms;
  onChange: (updatedTerms: Terms) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

const DEFAULT_STANDARD_PAYMENT_TERMS = [
  "25% advance deposit to confirm booking & lock hotel reservations",
  "50% payment 30 days prior to travel departure",
  "Balance 25% payment 15 days prior to arrival",
];

const DEFAULT_STANDARD_CANCELLATION_SLABS: CancellationRow[] = [
  { window: "30+ days prior to departure", charge: "10% retention fee" },
  { window: "15 to 29 days prior to departure", charge: "25% retention fee" },
  { window: "07 to 14 days prior to departure", charge: "50% retention fee" },
  { window: "Within 07 days or No Show", charge: "100% non-refundable" },
];

const QUICK_PAYMENT_PRESETS = [
  "25% advance deposit to confirm booking",
  "50% payment 30 days prior to travel",
  "Balance 25% payment 15 days prior",
  "100% full payment upon booking confirmation",
];

export default function TermsPanel({
  terms,
  onChange,
  reviewFlags = [],
}: TermsPanelProps) {
  const [newPay, setNewPay] = useState("");
  const [newWindow, setNewWindow] = useState("");
  const [newCharge, setNewCharge] = useState("");

  const handleAddPayment = (customText?: string) => {
    const text = (customText || newPay).trim();
    if (!text) return;
    const current = terms.payment || [];
    if (!current.includes(text)) {
      onChange({
        ...terms,
        payment: [...current, text],
      });
    }
    setNewPay("");
  };

  const handleRemovePayment = (index: number) => {
    onChange({
      ...terms,
      payment: (terms.payment || []).filter((_, i) => i !== index),
    });
  };

  const handleAddCancellation = (customRow?: CancellationRow) => {
    const windowText = (customRow ? customRow.window : newWindow).trim();
    const chargeText = (customRow ? customRow.charge : newCharge).trim();
    if (!windowText || !chargeText) return;

    onChange({
      ...terms,
      cancellation: [
        ...(terms.cancellation || []),
        { window: windowText, charge: chargeText },
      ],
    });
    setNewWindow("");
    setNewCharge("");
  };

  const handleRemoveCancellation = (index: number) => {
    onChange({
      ...terms,
      cancellation: (terms.cancellation || []).filter((_, i) => i !== index),
    });
  };

  const handleUpdateCancellation = (
    index: number,
    updated: Partial<CancellationRow>
  ) => {
    const copy = [...(terms.cancellation || [])];
    copy[index] = { ...copy[index], ...updated };
    onChange({ ...terms, cancellation: copy });
  };

  // FIX 5.3: 1-Click Load Standard TrippyGo Policy
  const handleLoadStandardPolicy = () => {
    onChange({
      ...terms,
      payment: [...DEFAULT_STANDARD_PAYMENT_TERMS],
      cancellation: [...DEFAULT_STANDARD_CANCELLATION_SLABS],
    });
  };

  const paymentItems = terms.payment || [];
  const cancellationItems = terms.cancellation || [];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 font-body">
      {/* 1. MAIN HEADER BAR: Title, Badge & 1-Click Standard Policy Loader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#091c3e] text-white shadow-2xs">
              <ScrollText className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Payment Milestones & Cancellation Policy
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {paymentItems.length} Milestones • {cancellationItems.length} Slabs
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Renders legal booking terms and cancellation slabs on Page 4 of the proposal.
              </p>
            </div>
          </div>
        </div>

        {/* FIX 5.3: 1-Click Standard Policy Loader Button */}
        <button
          type="button"
          onClick={handleLoadStandardPolicy}
          className="px-3.5 py-2 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Populate standard TrippyGo booking deposit milestones and cancellation slabs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load Standard Policy</span>
        </button>
      </div>

      {/* 2. PAYMENT MILESTONES SECTION */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Payment Schedule Milestones ({paymentItems.length})
            </span>
          </div>
          <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
            Booking Milestones
          </span>
        </div>

        {/* Quick Payment Presets */}
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Quick Add Milestones:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_PAYMENT_PRESETS.map((preset) => {
              const isAdded = paymentItems.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddPayment(preset)}
                  disabled={isAdded}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition flex items-center gap-1 ${
                    isAdded
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default opacity-60"
                      : "bg-white text-slate-700 hover:text-blue-800 hover:bg-blue-50/70 border-slate-200 hover:border-blue-300 shadow-2xs"
                  }`}
                >
                  {isAdded ? (
                    <Check className="w-2.5 h-2.5 text-blue-600" />
                  ) : (
                    <span className="text-blue-600 font-bold">+</span>
                  )}
                  <span>{preset}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Milestone List */}
        <div className="space-y-1.5 min-h-[80px]">
          {paymentItems.length === 0 ? (
            <div className="py-5 text-center text-xs text-slate-400 italic">
              No payment terms specified. Click &quot;Load Standard Policy&quot; or add milestones below.
            </div>
          ) : (
            paymentItems.map((item, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
              >
                <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 ml-1">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={item}
                  aria-label={`Payment term ${idx + 1}`}
                  onChange={(e) => {
                    const copy = [...paymentItems];
                    copy[idx] = e.target.value;
                    onChange({ ...terms, payment: copy });
                  }}
                  className="flex-1 px-1 py-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePayment(idx)}
                  aria-label={`Remove payment term ${idx + 1}`}
                  className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-80 group-hover:opacity-100 mr-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Inline Add Payment Input */}
        <div className="flex gap-2 pt-1 border-t border-slate-200/60">
          <input
            id="new-payment-term"
            type="text"
            value={newPay}
            onChange={(e) => setNewPay(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPayment();
              }
            }}
            placeholder="Type custom milestone (e.g. 50% deposit on booking) and press Enter..."
            className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
          />
          <button
            type="button"
            onClick={() => handleAddPayment()}
            className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 3. FIX 5.4: CANCELLATION SLABS TABLE WITH CLEAR COLUMN HEADERS */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cancellation Slabs Table ({cancellationItems.length})
            </span>
          </div>
          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
            Deduction Tiers
          </span>
        </div>

        {/* FIX 5.4: Professional Table with Clear Column Headers */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 text-left w-1/2">
                  Cancellation Window
                </th>
                <th className="py-2.5 px-3.5 text-left w-2/5">
                  Deduction Amount / Fee
                </th>
                <th className="py-2.5 px-2 text-center w-12">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cancellationItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-slate-400 italic">
                    No cancellation slabs defined. Click &quot;Load Standard Policy&quot; above to populate standard tiers.
                  </td>
                </tr>
              ) : (
                cancellationItems.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition group">
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={row.window}
                        aria-label={`Cancellation window for slab ${idx + 1}`}
                        onChange={(e) =>
                          handleUpdateCancellation(idx, { window: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 focus:border-blue-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 bg-white"
                        placeholder="e.g. 30+ days prior"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={row.charge}
                        aria-label={`Cancellation charge for slab ${idx + 1}`}
                        onChange={(e) =>
                          handleUpdateCancellation(idx, { charge: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-rose-700 bg-white focus:border-red-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500"
                        placeholder="e.g. 10% retention fee"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCancellation(idx)}
                        aria-label={`Remove cancellation slab ${idx + 1}`}
                        className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition opacity-80 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add New Cancellation Row Form */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-slate-200/60">
          <div className="sm:col-span-2">
            <input
              id="new-slab-window"
              type="text"
              value={newWindow}
              onChange={(e) => setNewWindow(e.target.value)}
              placeholder="Window (e.g. 15-29 days prior)"
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              id="new-slab-charge"
              type="text"
              value={newCharge}
              onChange={(e) => setNewCharge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCancellation();
                }
              }}
              placeholder="Fee (e.g. 25% non-refundable)"
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => handleAddCancellation()}
            className="sm:col-span-1 px-3 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Slab</span>
          </button>
        </div>
      </div>
    </div>
  );
}
