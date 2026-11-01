"use client";

import React from "react";
import { SalespersonContact } from "@/lib/schema/itinerary";
import { UserCheck } from "lucide-react";
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
          <UserCheck className="w-5 h-5 text-brand-navy shrink-0" aria-hidden="true" /> Sales Specialist & Agency Info
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-700 mb-1">
            Trip Specialist Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={salesperson?.name || ""}
            onChange={(e) => onChange({ ...salesperson, name: e.target.value })}
            placeholder="e.g. Rahul Sharma"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          />
        </div>

        <div>
          <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone</label>
          <input
            id="contact-phone"
            type="text"
            value={salesperson?.phone || ""}
            onChange={(e) => onChange({ ...salesperson, phone: e.target.value })}
            placeholder="e.g. +91 98765 12345"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
          <input
            id="contact-email"
            type="email"
            value={salesperson?.email || ""}
            onChange={(e) => onChange({ ...salesperson, email: e.target.value })}
            placeholder="e.g. rahul@trippygo.com"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
          />
        </div>
      </div>
    </div>
  );
}
