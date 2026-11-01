import React from "react";
import { Terms } from "@/lib/schema/itinerary";
import { SectionTitle, PageFooter, PageWatermark } from "./PageHeaderFooter";

interface TermsBlockProps {
  terms: Terms;
  pageNumber?: number;
  totalPages?: number;
}

export default function TermsBlock({ terms, pageNumber, totalPages }: TermsBlockProps) {
  const hasPayment = terms.payment && terms.payment.length > 0;
  const hasCancellation = terms.cancellation && terms.cancellation.length > 0;

  // Standard payment rules
  const paymentPoints = hasPayment
    ? terms.payment
    : [
        "Token Amount: We require a token amount starting from INR 10,000 (non-refundable) to initiate partner reservations.",
        "Booking Advance: 30% of total package cost + 100% of airfare and visa fees upon hotel confirmation.",
        "Balance Payment: Remaining 70% package balance payable at least 30 days prior to departure date.",
        "Last-Minute Bookings: Bookings made within 30 days of departure require 100% payment upon confirmation.",
      ];

  // Standard cancellation slabs
  const cancellationSlabs = hasCancellation
    ? terms.cancellation
    : [
        { window: "30+ days before departure", charge: "25% of the tour cost" },
        { window: "30–15 days before departure", charge: "50% of the tour cost" },
        { window: "15–7 days before departure", charge: "75% of the tour cost" },
        { window: "Less than 7 days / No Show", charge: "100% of the tour cost (No Refund)" },
      ];

  return (
    <section className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body">
      <PageWatermark />
      <div className="relative z-10 space-y-5">
        <SectionTitle kicker="POLICIES // BOOKING CONDITIONS" title="Terms & Conditions" />

        {/* 1. Payment Schedule */}
        <div className="avoid-break">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#091c3e] mb-2 font-body">
            Payment Schedule & Milestones
          </h3>
          <ul className="space-y-2 text-[13px] md:text-sm text-slate-700 font-body">
            {paymentPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c92229] shrink-0 mt-2" />
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Cancellation Policy Slabs Table */}
        <div className="pt-3 border-t border-slate-200/80 avoid-break">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#091c3e] mb-2.5 font-body">
            Cancellation Policy & Retention Slabs
          </h3>
          <div className="border border-slate-200/90 rounded-lg overflow-hidden font-body">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#091c3e] text-white">
                  <th className="py-2.5 px-4 font-bold text-xs uppercase tracking-[0.18em] text-slate-300">
                    Cancellation Window
                  </th>
                  <th className="py-2.5 px-4 font-bold text-xs uppercase tracking-[0.18em] text-slate-300">
                    Retention Fee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cancellationSlabs.map((slab, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fafaf7]"}>
                    <td className="py-2.5 px-4 font-medium text-slate-800 text-[13px]">
                      {slab.window}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#c92229] text-[13px]">
                      {slab.charge}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Operational Notes Grid */}
        <div className="pt-3 border-t border-slate-200/80 avoid-break">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#091c3e] mb-2.5 font-body">
            Important Operational Disclaimers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 font-body">
            <div className="bg-[#fafaf7] p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-0.5">Airfare Conditions:</strong>
              <span>Flight tickets follow respective airline refund and rescheduling rules.</span>
            </div>
            <div className="bg-[#fafaf7] p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-0.5">Hotel Policies:</strong>
              <span>Modifications or early checkouts abide by individual property contracts.</span>
            </div>
            <div className="bg-[#fafaf7] p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-0.5">Peak Season Dates:</strong>
              <span>High-demand holiday dates and festivals may carry 100% non-refundable clauses.</span>
            </div>
            <div className="bg-[#fafaf7] p-3 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 block mb-0.5">Refund Processing:</strong>
              <span>Approved credit notes or refunds process in 10 business days after cancellation.</span>
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}
