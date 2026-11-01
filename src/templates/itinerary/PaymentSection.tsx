"use client";

import React from "react";
import { agencyDefaults } from "@/config/agency";
import { ClientPricingView } from "@/lib/schema/client-view";
import PriceTable from "./PriceTable";
import { PageFooter, PageWatermark } from "./PageHeaderFooter";
import { ShieldCheck, CreditCard, Clock } from "lucide-react";

interface PaymentSectionProps {
  pricing: ClientPricingView;
  pageNumber?: number;
  totalPages?: number;
}

export default function PaymentSection({ pricing, pageNumber, totalPages }: PaymentSectionProps) {
  const { companyDetails } = agencyDefaults.pdf;

  return (
    <section className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body">
      <PageWatermark />
      <div className="relative z-10">
        {/* Top Dark Navy Commercial Summary */}
        <PriceTable pricing={pricing} showSectionTitle={true} />

        {/* 2-Column Booking Guidelines & Payment Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* 1. Booking & Reservation Steps */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#c92229]">
                <Clock className="w-3.5 h-3.5 text-[#c92229]" />
                <span>Reservation Process</span>
              </div>
              <h3 className="text-lg font-bold text-[#091c3e] mt-1 font-serif-luxury text-xl">
                How to Confirm Your Trip
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Simple and transparent booking steps to secure your travel arrangements.
              </p>

              <div className="space-y-3 mt-4 pt-3 border-t border-slate-100 text-left text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#091c3e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Token Deposit</strong>
                    <span className="text-slate-500 text-[11.5px] leading-snug block">
                      Lock flights, room inventory, and promotional supplier rates.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#091c3e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Voucher & Ticket Issuance</strong>
                    <span className="text-slate-500 text-[11.5px] leading-snug block">
                      Confirmed hotel vouchers, flight tickets, and day plan delivered.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#091c3e] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block">Balance Clearance</strong>
                    <span className="text-slate-500 text-[11.5px] leading-snug block">
                      Complete final balance prior to departure per agreed payment schedule.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Accepted Remittance Methods */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#1556a6]">
                <CreditCard className="w-3.5 h-3.5 text-[#1556a6]" />
                <span>Payment Options</span>
              </div>
              <h3 className="text-lg font-bold text-[#091c3e] mt-1 font-serif-luxury text-xl">
                Accepted Payment Modes
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Secure payment channels with instant verification and official booking receipts.
              </p>

              <div className="space-y-2.5 mt-4 pt-3 border-t border-slate-100 text-left text-xs">
                <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#091c3e] block">
                    Online & Digital Payments
                  </span>
                  <span className="text-[11.5px] text-slate-600 block mt-0.5">
                    UPI (Google Pay, PhonePe, Paytm), Net Banking, and Credit / Debit Cards via secure gateway.
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#091c3e] block">
                    Direct Corporate Wire Transfer
                  </span>
                  <span className="text-[11.5px] text-slate-600 block mt-0.5">
                    NEFT / RTGS / IMPS wire transfers directly to our authorized agency accounts.
                  </span>
                </div>

                <p className="text-[10.5px] text-slate-400 italic pt-1">
                  * Official payment link and invoice will be shared directly by your dedicated travel specialist.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation & Assurance Note */}
        <div className="mt-4 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#c92229] shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900 font-semibold">Booking Assurance:</strong> All reservations are backed by <strong>TrippyGo by Friends Travels</strong> operational guarantee. Please share your transaction reference or remittance UTR with your travel specialist ({companyDetails.email}) for instant receipt generation.
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}
