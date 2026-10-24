"use client";

import React, { useState } from "react";
import { Terms, CancellationRow } from "@/lib/schema/itinerary";
import { Plus, Trash2 } from "lucide-react";

interface TermsPanelProps {
  terms: Terms;
  onChange: (updatedTerms: Terms) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

export default function TermsPanel({ terms, onChange, reviewFlags = [] }: TermsPanelProps) {
  const [newPay, setNewPay] = useState("");
  const [newWindow, setNewWindow] = useState("");
  const [newCharge, setNewCharge] = useState("");

  const handleAddPayment = () => {
    if (!newPay.trim()) return;
    onChange({
      ...terms,
      payment: [...(terms.payment || []), newPay.trim()],
    });
    setNewPay("");
  };

  const handleRemovePayment = (index: number) => {
    onChange({
      ...terms,
      payment: terms.payment.filter((_, i) => i !== index),
    });
  };

  const handleAddCancellation = () => {
    if (!newWindow.trim() || !newCharge.trim()) return;
    onChange({
      ...terms,
      cancellation: [
        ...(terms.cancellation || []),
        { window: newWindow.trim(), charge: newCharge.trim() },
      ],
    });
    setNewWindow("");
    setNewCharge("");
  };

  const handleRemoveCancellation = (index: number) => {
    onChange({
      ...terms,
      cancellation: terms.cancellation.filter((_, i) => i !== index),
    });
  };

  const handleUpdateCancellation = (index: number, updated: Partial<CancellationRow>) => {
    const copy = [...terms.cancellation];
    copy[index] = { ...copy[index], ...updated };
    onChange({ ...terms, cancellation: copy });
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>📜</span> Payment Schedule & Cancellation Terms
        </h3>
      </div>

      {/* Payment Terms */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Payment Milestone Rows ({terms.payment?.length || 0})
        </label>
        <div className="space-y-2">
          {terms.payment?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const copy = [...terms.payment];
                  copy[idx] = e.target.value;
                  onChange({ ...terms, payment: copy });
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="button"
                onClick={() => handleRemovePayment(idx)}
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
            value={newPay}
            onChange={(e) => setNewPay(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPayment();
              }
            }}
            placeholder="e.g. 25% deposit to confirm booking"
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300"
          />
          <button
            type="button"
            onClick={handleAddPayment}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Cancellation Policy Table */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Cancellation Slabs Table
        </label>

        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3 text-left">Time Window</th>
                <th className="py-2 px-3 text-left">Charge / Retention</th>
                <th className="py-2 px-2 text-center w-10">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {terms.cancellation?.map((row, idx) => (
                <tr key={idx}>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.window}
                      onChange={(e) => handleUpdateCancellation(idx, { window: e.target.value })}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.charge}
                      onChange={(e) => handleUpdateCancellation(idx, { charge: e.target.value })}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 text-red-700 font-medium"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveCancellation(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Cancellation Row Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
          <input
            type="text"
            value={newWindow}
            onChange={(e) => setNewWindow(e.target.value)}
            placeholder="Window (e.g. > 30 days prior)"
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300"
          />
          <input
            type="text"
            value={newCharge}
            onChange={(e) => setNewCharge(e.target.value)}
            placeholder="Charge (e.g. 10% non-refundable)"
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300"
          />
          <button
            type="button"
            onClick={handleAddCancellation}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slab
          </button>
        </div>
      </div>
    </div>
  );
}
