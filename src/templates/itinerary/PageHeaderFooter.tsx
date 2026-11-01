import React from "react";
import { agencyDefaults } from "@/config/agency";
import { TRIPPYGO_LOGO_DATA_URI } from "./brand-assets";
import { Phone, Mail, Globe, MapPin } from "lucide-react";

// ============================================================================
// Social Media Vector Icons (Pixel-Perfect Official Marks)
// ============================================================================

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export interface PageWatermarkProps {
  className?: string;
  opacityClassName?: string;
}

/**
 * PageWatermark:
 * High-end, larger diagonal monochrome TrippyGo logo watermark placed in the background
 * of itinerary pages (all pages except cover). Scaled and rotated -30deg for authentic
 * branded stationery appearance without visual clutter.
 */
export function PageWatermark({
  className = "",
  opacityClassName = "opacity-[0.038]",
}: PageWatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className={`page-watermark pointer-events-none select-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden ${className}`}
    >
      <img
        src="/brand/trippygo-logo.png"
        alt=""
        style={{ transform: "rotate(-30deg)" }}
        className={`w-[640px] max-w-[85%] h-auto grayscale object-contain ${opacityClassName}`}
        onError={(e) => {
          if (TRIPPYGO_LOGO_DATA_URI && e.currentTarget.src !== TRIPPYGO_LOGO_DATA_URI) {
            e.currentTarget.src = TRIPPYGO_LOGO_DATA_URI;
          }
        }}
      />
    </div>
  );
}

export interface PageFooterProps {
  pageNumber?: number;
  totalPages?: number;
  className?: string;
}

/**
 * Universal Luxury PageFooter:
 * Full-bleed dark navy (#091c3e) architectural footer with signature gold hairline top border (#FFDE59).
 * Features direct communication touchpoints, official social media channel links (Instagram & Facebook),
 * office address, and live page counter indicator.
 */
export function PageFooter({ pageNumber, totalPages, className = "" }: PageFooterProps) {
  const { companyDetails } = agencyDefaults.pdf;

  return (
    <footer
      className={`page-footer-element mt-auto -mx-6 md:-mx-10 -mb-6 md:-mb-10 bg-[#091c3e] text-white p-3.5 md:px-10 border-t-2 border-[#FFDE59] flex flex-col gap-2.5 text-xs shrink-0 font-body avoid-break z-20 ${className}`}
    >
      {/* Tier 1: Direct Inquiries (Left) & Social Media Badges (Right) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Direct Contact Inquiries */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start gap-3.5 md:gap-5 font-medium text-[11px]">
          <a
            href="tel:+919941000075"
            className="flex items-center gap-1.5 text-slate-200 hover:text-white transition group whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5 text-[#FFDE59] group-hover:scale-110 transition-transform shrink-0" />
            <span>+91 9941000075 • +91 7557500007</span>
          </a>

          <a
            href={`mailto:${companyDetails.email}`}
            className="flex items-center gap-1.5 text-slate-200 hover:text-white transition group whitespace-nowrap"
          >
            <Mail className="w-3.5 h-3.5 text-[#FFDE59] group-hover:scale-110 transition-transform shrink-0" />
            <span>{companyDetails.email}</span>
          </a>

          <a
            href={companyDetails.website || "https://www.trippygo.in/"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-200 hover:text-white transition group whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-[#FFDE59] group-hover:scale-110 transition-transform shrink-0" />
            <span>trippygo.in</span>
          </a>
        </div>

        {/* Social Media Connections */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Instagram Link */}
          <a
            href="https://instagram.com/trippygo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10.5px] font-semibold transition group shadow-2xs whitespace-nowrap"
            title="Follow TrippyGo on Instagram (@trippygo.co)"
          >
            <InstagramIcon className="w-3.5 h-3.5 text-[#FFDE59] group-hover:scale-110 transition-transform shrink-0" />
            <span className="tracking-wide">@trippygo.co</span>
          </a>

          {/* Facebook Link */}
          <a
            href="https://www.facebook.com/people/Trippygo/61565266851736/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[10.5px] font-semibold transition group shadow-2xs whitespace-nowrap"
            title="Connect with TrippyGo on Facebook"
          >
            <FacebookIcon className="w-3.5 h-3.5 text-[#FFDE59] group-hover:scale-110 transition-transform shrink-0" />
            <span className="tracking-wide">Trippygo</span>
          </a>
        </div>
      </div>

      {/* Tier 2: Office Address, Brand Rights (Left) & Editorial Page Folio (Right) */}
      <div className="pt-2.5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10.5px]">
        {/* Left: Physical Location & Legal Brand Rights */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FFDE59] shrink-0" />
            <span>Eden Tower, Phase 8B, Sector 91, Mohali, Punjab</span>
          </div>

          <span className="hidden sm:inline text-white/20 select-none">•</span>

          <span className="text-slate-400 text-[10px]">
            <strong className="text-white font-bold">Trippy<span className="text-[#3b82f6]">Go</span></strong> by Friends Travels • All Rights Reserved
          </span>
        </div>

        {/* Right: Dedicated Architectural Page Folio */}
        {pageNumber && (
          <div className="flex items-center gap-1.5 shrink-0 select-none font-body">
            <span className="text-[9px] uppercase font-bold tracking-[0.22em] text-slate-400">Page</span>
            <span className="text-[#FFDE59] font-bold text-xs tabular-nums">
              {String(pageNumber).padStart(2, "0")}
            </span>
            {totalPages && (
              <>
                <span className="text-white/25 font-light text-[11px]">/</span>
                <span className="text-slate-300 font-medium text-xs tabular-nums">
                  {String(totalPages).padStart(2, "0")}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}

export interface SectionTitleProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
}

export function SectionTitle({
  title,
  subtitle,
  kicker,
  className = "",
}: SectionTitleProps) {
  return (
    <div className={`mb-6 pb-3 border-b border-slate-200/80 text-left avoid-break ${className}`}>
      {kicker && (
        <div className="text-[11px] uppercase font-bold tracking-[0.22em] text-[#c92229] mb-1.5 font-body">
          {kicker}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-[#091c3e] font-serif-luxury tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] md:text-sm text-slate-500 mt-1.5 font-body leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
