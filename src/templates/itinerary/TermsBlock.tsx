import React from "react";
import { Terms } from "@/lib/schema/itinerary";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface TermsBlockProps {
  terms: Terms;
  pageNumber?: number;
}

export default function TermsBlock({ terms, pageNumber }: TermsBlockProps) {
  const hasPayment = terms.payment && terms.payment.length > 0;
  const hasCancellation = terms.cancellation && terms.cancellation.length > 0;

  // Standard payment rules matching Reference Page 15
  const paymentPoints = hasPayment
    ? terms.payment
    : [
        "Token Amount: We require a token amount starting from INR 10,000 (non-refundable) or as advised by your travel specialist to initiate bookings.",
        "Booking Advance: 30% of the total package cost + 100% of flight and visa charges upon hotel & service confirmation.",
        "Balance Payment: Remaining 70% package balance to be paid at least 30 days prior to departure date.",
        "Last-Minute Bookings: For bookings confirmed within 30 days of departure, 100% full payment is required at the time of confirmation.",
      ];

  // Standard cancellation slabs matching Reference Pages 15 & 16
  const cancellationSlabs = hasCancellation
    ? terms.cancellation
    : [
        { window: "30+ days before departure", charge: "25% of the tour cost" },
        { window: "30–15 days before departure", charge: "50% of the tour cost" },
        { window: "15–7 days before departure", charge: "75% of the tour cost" },
        { window: "Less than 7 days / No Show", charge: "100% of the tour cost (No Refund)" },
      ];

  return (
    <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
      <div className="space-y-6">
        <SectionTitle title="Terms & Conditions" />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          {/* 1. Payment Structure */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              Payment Structure:
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {paymentPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0 mt-2" />
                  <span className="leading-relaxed font-body">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. Cancellation Policy Slabs Table */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              Cancellation Policy – Time Slabs:
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-4 font-bold text-xs uppercase tracking-wider font-display">
                      Cancellation Window
                    </th>
                    <th className="py-2.5 px-4 font-bold text-xs uppercase tracking-wider font-display">
                      Retention Charge
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancellationSlabs.map((slab, i) => (
                    <tr key={i} className="bg-white hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {slab.window}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#c92229]">
                        {slab.charge}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Additional Operational Notes */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 font-display mb-3">
              Additional Notes:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <strong className="text-slate-900 block mb-1">Flight Cancellation:</strong>
                <span>Air tickets are strictly subject to individual airline cancellation and date-change policies.</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <strong className="text-slate-900 block mb-1">Hotel Policies:</strong>
                <span>Room cancellation or modifications are governed by each hotel's contractual terms.</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <strong className="text-slate-900 block mb-1">Peak Season Clause:</strong>
                <span>Special event and peak holiday dates may attract 100% non-refundable conditions.</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                <strong className="text-slate-900 block mb-1">Refund Timeline:</strong>
                <span>Eligible refunds are processed within approximately 10 working days following written confirmation.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}
