"use client";

import React from "react";
import { SalespersonContact } from "@/lib/schema/itinerary";
import { agencyDefaults } from "@/config/agency";

interface ContactPanelProps {
  salesperson?: SalespersonContact;
  onChange: (updatedContact: SalespersonContact) => void;
}

export default function ContactPanel({
  salesperson,
  onChange,
}: ContactPanelProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>👤</span> Sales Specialist & Agency Info
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Trip Specialist Name
          </label>
          <input
            type="text"
            value={salesperson?.name || ""}
            onChange={(e) => onChange({ ...salesperson, name: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone</label>
          <input
            type="text"
            value={salesperson?.phone || ""}
            onChange={(e) => onChange({ ...salesperson, phone: e.target.value })}
            placeholder="e.g. +91 98765 12345"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
          <input
            type="email"
            value={salesperson?.email || ""}
            onChange={(e) => onChange({ ...salesperson, email: e.target.value })}
            placeholder="e.g. rahul@trippygo.com"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
          />
        </div>
      </div>

      {/* Agency Verified Credentials Banner */}
      <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <strong>Brand:</strong> {agencyDefaults.brand.name} | <strong>GSTIN:</strong>{" "}
          <span className="font-mono text-slate-800">{agencyDefaults.tax.gstin}</span>
        </div>
        <div>
          <strong>Support Desk:</strong> {agencyDefaults.pdf.companyDetails.phone} |{" "}
          <span className="text-blue-600">{agencyDefaults.pdf.companyDetails.email}</span>
        </div>
      </div>
    </div>
  );
}
