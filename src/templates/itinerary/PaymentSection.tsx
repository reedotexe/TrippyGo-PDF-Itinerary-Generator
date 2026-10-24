import React from "react";
import QRCode from "qrcode";
import { QrCode, Landmark, User, CreditCard, Shield, Lock, Info } from "lucide-react";
import { agencyDefaults } from "@/config/agency";
import { ClientPricingView } from "@/lib/schema/client-view";
import PriceTable from "./PriceTable";
import { PageFooter } from "./PageHeaderFooter";

interface PaymentSectionProps {
  pricing: ClientPricingView;
  pageNumber?: number;
}

export default async function PaymentSection({ pricing, pageNumber }: PaymentSectionProps) {
  const { paymentDetails } = agencyDefaults.pdf;

  const upiId = paymentDetails?.upiId || "7982578247@okbizaxis";
  const upiPayee = agencyDefaults.brand.name || "TrippyGo Holidays";
  const amount = pricing.finalPriceRupees > 0 ? pricing.finalPriceRupees : "";

  // UPI deep link URI standard
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiPayee)}${amount ? `&am=${amount}` : ""}&cu=INR`;

  let qrSvgString = "";
  try {
    qrSvgString = await QRCode.toString(upiUri, {
      type: "svg",
      margin: 1,
      width: 150,
      color: {
        dark: "#091c3e",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate UPI QR code SVG:", err);
  }

  return (
    <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
      <div>
        {/* Top Dark Navy Commercial Summary Card */}
        <PriceTable pricing={pricing} showSectionTitle={true} />

        {/* 2-Column Payment Options matching Reference Page 11 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* 1. Instant Payment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 font-display">
                Instant Payment
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2 font-display">
                <QrCode className="w-5 h-5 text-[#c92229]" />
                <span>Scan to Pay via UPI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Open any UPI app (GPay, PhonePe, Paytm) and scan the QR code to make the payment.
              </p>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center my-6">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  {qrSvgString ? (
                    <div
                      className="w-36 h-36"
                      dangerouslySetInnerHTML={{ __html: qrSvgString }}
                    />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                      QR Code
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    UPI ID
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md inline-block mt-0.5">
                    {upiId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Bank Transfer Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500 font-display">
                Bank Transfer
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2 font-display">
                <Landmark className="w-5 h-5 text-[#1556a6]" />
                <span>NEFT / IMPS / RTGS</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                You can also transfer directly to our corporate bank account using internet banking.
              </p>

              {/* Bank Details List */}
              <div className="space-y-4 mt-6 divide-y divide-slate-100">
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Name</span>
                    <span className="text-sm font-bold text-slate-900">{paymentDetails.bankName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Holder</span>
                    <span className="text-sm font-bold text-slate-900">{paymentDetails.accountHolder}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Number</span>
                    <span className="text-sm font-bold text-slate-900 font-mono tracking-wide">{paymentDetails.accountNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">IFSC Code</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{paymentDetails.ifscCode}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Payment Terms Alerts */}
        <div className="space-y-3 mt-6">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-center gap-3 text-xs text-amber-900 font-medium">
            <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900">Secure & Hassle-Free Payments:</strong> Your payment information is safe with us. All transactions are encrypted and processed securely.
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-center gap-3 text-xs text-blue-900 font-medium">
            <div className="w-7 h-7 rounded-full bg-[#1556a6] text-white flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900">Note:</strong> Full payment or advance token payment is required to confirm your booking. For any payment related queries, please contact our support desk.
            </div>
          </div>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}
