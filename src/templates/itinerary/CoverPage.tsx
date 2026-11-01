"use client";

import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { TRIPPYGO_LOGO_DATA_URI } from "./brand-assets";

interface CoverPageProps {
  clientView: ClientItineraryView;
}

export default function CoverPage({ clientView }: CoverPageProps) {
  const { package: pkg, days } = clientView;

  // Primary destination for headline
  const primaryDest = pkg.destinations[0] || "Your Destination";

  // Hero image: package cover image, first available day photo, or destination fallback
  const heroImage =
    pkg.coverImage?.imageUrl ||
    days.find((d) => d.image?.imageUrl)?.image?.imageUrl ||
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80";

  // Formatted date string
  const dateRange =
    pkg.startDate && pkg.endDate
      ? `${days[0]?.calendarDate || pkg.startDate} – ${pkg.endDate}`
      : pkg.startDate
      ? `From ${days[0]?.calendarDate || pkg.startDate}`
      : "Flexible Dates";

  // Guest Name (use package guestName if available, or fallback to VALUED TRAVELLER)
  const guestName =
    pkg.guestName?.trim().toUpperCase() ||
    "VALUED TRAVELLER";

  return (
    <header className="cover-page relative min-h-[920px] md:min-h-[1050px] flex flex-col justify-between p-8 md:p-12 rounded-2xl print:rounded-none overflow-hidden text-white avoid-break page-break font-body">
      {/* 1. Full-Bleed Background Image with Dark Cinematic Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={pkg.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/35 to-[#091c3e]/95" />
      </div>

      {/* 2. Top Header Trust & Brand Bar (Pinned Layout: 1M+ Travellers | Center Logo | 18+ Years Trophy) */}
      <div className="relative z-10 w-full grid grid-cols-3 items-center pt-1 pb-4">
        {/* Left: 1M+ Travellers */}
        <div className="flex items-center justify-start gap-2.5 md:gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          <svg className="w-11 h-11 md:w-12 md:h-12 shrink-0" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            {/* Left person */}
            <circle cx="12" cy="16" r="5" fill="#FFDE59" />
            <path d="M4 35 C4 29 8 25 14 25 C16.5 25 18.8 26 20.3 27.6 C17.2 29.5 15.2 32 15 35 Z" fill="#FFDE59" opacity="0.95" />
            {/* Right person */}
            <circle cx="36" cy="16" r="5" fill="#FFDE59" />
            <path d="M44 35 C44 29 40 25 34 25 C31.5 25 29.2 26 27.7 27.6 C30.8 29.5 32.8 32 33 35 Z" fill="#FFDE59" opacity="0.95" />
            {/* Center person (front) */}
            <circle cx="24" cy="13" r="6" fill="#FFDE59" />
            <path d="M13 35 C13 27.5 18 22.5 24 22.5 C30 22.5 35 27.5 35 35 Z" fill="#FFDE59" />
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black text-[#FFDE59] tracking-tight leading-none drop-shadow">
              1M+
            </span>
            <span className="text-xs font-black text-white tracking-wider uppercase mt-1 drop-shadow leading-tight">
              TRAVELLERS
            </span>
          </div>
        </div>

        {/* Center: TrippyGo Brand Logo */}
        <div className="flex flex-col items-center justify-center px-2 py-1">
          <img
            src="/brand/trippygo-logo.png"
            alt="TrippyGo - A unit of Friends Travels"
            className="h-16 md:h-20 print:h-20 w-auto max-w-[270px] object-contain"
            style={{
              filter:
                "drop-shadow(0 0 10px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 22px rgba(255, 255, 255, 0.35)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))",
            }}
            onError={(e) => {
              if (TRIPPYGO_LOGO_DATA_URI && e.currentTarget.src !== TRIPPYGO_LOGO_DATA_URI) {
                e.currentTarget.src = TRIPPYGO_LOGO_DATA_URI;
              }
            }}
          />
          <span className="text-[10.5px] md:text-[11px] print:text-[11px] font-bold tracking-wider text-white uppercase drop-shadow mt-1">
            A unit of Friends Travels
          </span>
        </div>

        {/* Right: 18+ Years of Experience with 3D Gold Trophy */}
        <div className="flex items-center justify-end gap-2.5 md:gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          <svg className="h-12 md:h-13 w-auto shrink-0" viewBox="0 0 52 56" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="trophyGoldBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFF2A3" />
                <stop offset="20%" stopColor="#FFD338" />
                <stop offset="55%" stopColor="#E69500" />
                <stop offset="85%" stopColor="#FFDE59" />
                <stop offset="100%" stopColor="#C27400" />
              </linearGradient>
              <linearGradient id="trophyGoldHandle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF6B8" />
                <stop offset="50%" stopColor="#FFC820" />
                <stop offset="100%" stopColor="#A86000" />
              </linearGradient>
              <linearGradient id="trophyGoldBase" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFE066" />
                <stop offset="40%" stopColor="#D98200" />
                <stop offset="100%" stopColor="#8A4800" />
              </linearGradient>
              <linearGradient id="trophyGoldRim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFDE6" />
                <stop offset="50%" stopColor="#FFDF59" />
                <stop offset="100%" stopColor="#CC7A00" />
              </linearGradient>
            </defs>
            {/* Left Handle */}
            <path d="M16 11 C6 11 3 18 4 24 C5 29 13 30 20 26 C13 27 8 26 7 22 C6 18 8 15 16 14.5 Z" fill="url(#trophyGoldHandle)" />
            {/* Right Handle */}
            <path d="M36 11 C46 11 49 18 48 24 C47 29 39 30 32 26 C39 27 44 26 45 22 C46 18 44 15 36 14.5 Z" fill="url(#trophyGoldHandle)" />
            {/* Cup Body / Bowl */}
            <path d="M14 9 L38 9 C38 21 34 31 26 31 C18 31 14 21 14 9 Z" fill="url(#trophyGoldBody)" />
            {/* Bowl Interior Shading & Rim */}
            <ellipse cx="26" cy="9" rx="12" ry="2.8" fill="url(#trophyGoldRim)" />
            <ellipse cx="26" cy="8.6" rx="10.8" ry="2" fill="#E69500" />
            {/* Vertical Specular Highlight */}
            <path d="M17 10 C17 19 20 26 22 28 C20 26 18 19 18 10 Z" fill="#FFFFFF" opacity="0.5" />
            {/* Stem */}
            <path d="M23.5 31 L28.5 31 L27.5 40 L24.5 40 Z" fill="url(#trophyGoldBody)" />
            {/* Stem Connector Ring */}
            <ellipse cx="26" cy="40" rx="4.5" ry="1.5" fill="url(#trophyGoldRim)" />
            {/* Pedestal */}
            <path d="M19 41 L33 41 L35 47 L17 47 Z" fill="url(#trophyGoldBody)" />
            {/* Base Plinth */}
            <rect x="14" y="47" width="24" height="4" rx="1.5" fill="url(#trophyGoldBase)" />
            <rect x="15" y="47" width="22" height="1.2" rx="0.6" fill="#FFF2A3" />
          </svg>
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black text-[#FFDE59] tracking-tight leading-none drop-shadow">
              18+
            </span>
            <span className="text-[10px] font-black text-white tracking-wider uppercase mt-1 leading-tight drop-shadow">
              YEARS OF EXPERIENCE
            </span>
            <span className="text-[8.5px] font-black text-white/95 tracking-wider uppercase mt-0.5 leading-tight drop-shadow">
              YOUR TRUSTED TRAVEL
            </span>
            <span className="text-[8.5px] font-black text-white/95 tracking-wider uppercase leading-tight drop-shadow">
              PARTNER
            </span>
          </div>
        </div>
      </div>

      {/* 3. Center/Lower Third: Dramatic Editorial Hero Typography */}
      <div className="relative z-10 my-auto pt-14 pb-8">
        <div className="max-w-4xl">
          <div
            className="inline-flex items-center gap-3 text-white/90 text-xs md:text-[13px] font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.85)" }}
          >
            <span className="w-8 h-px bg-[#FFDE59] shadow-sm" />
            <span>Curated Private Itinerary</span>
          </div>

          <h1
            className="text-5xl md:text-6xl lg:text-7xl xl:text-[74px] font-bold text-white tracking-tight leading-[1.08] font-serif-luxury"
            style={{
              textShadow:
                "0 2px 6px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0, 0, 0, 0.6), 0 16px 48px rgba(0, 0, 0, 0.4)",
            }}
          >
            {pkg.title || `The essence of ${primaryDest}, beyond the ordinary.`}
          </h1>

          <div
            className="flex items-center gap-2.5 mt-5 text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-amber-200"
            style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.85)" }}
          >
            <span>{pkg.destinations.join("  •  ")}</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Client Card — Frosted Architectural Luxury */}
      <div className="relative z-10 bg-slate-950/75 backdrop-blur-xl text-white rounded-xl p-6 md:p-8 shadow-2xl border border-white/15">
        {/* Guest Title & Verification Badge */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <div>
            <span className="text-[9.5px] uppercase font-bold tracking-[0.28em] text-[#FFDE59] block">
              Specially Prepared For
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide mt-1 font-serif-luxury">
              {guestName}
            </h2>
          </div>
          <div className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold tracking-[0.2em] uppercase text-white/90">
            Curated Edition
          </div>
        </div>

        {/* 3 Trip Essentials Grid with Architectural Hairline Dividers */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 pt-5">
          {/* Duration */}
          <div className="space-y-1">
            <span className="text-white/50 text-[9.5px] font-bold uppercase tracking-[0.2em] block">
              Duration
            </span>
            <div className="text-sm md:text-base font-bold text-white tracking-tight">
              {pkg.nights} Nights • {pkg.days} Days
            </div>
          </div>

          {/* Travelers */}
          <div className="space-y-1 border-l border-white/10 pl-4 md:pl-8">
            <span className="text-white/50 text-[9.5px] font-bold uppercase tracking-[0.2em] block">
              Travelers
            </span>
            <div className="text-sm md:text-base font-bold text-white tracking-tight">
              {pkg.travellers.adults} {pkg.travellers.adults === 1 ? "Adult" : "Adults"}
              {pkg.travellers.children > 0
                ? `, ${pkg.travellers.children} ${pkg.travellers.children === 1 ? "Child" : "Children"}`
                : ""}
              {(pkg.travellers.infants || 0) > 0
                ? `, ${pkg.travellers.infants} ${pkg.travellers.infants === 1 ? "Infant" : "Infants"}`
                : ""}
            </div>
          </div>

          {/* Travel Date */}
          <div className="space-y-1 border-l border-white/10 pl-4 md:pl-8">
            <span className="text-white/50 text-[9.5px] font-bold uppercase tracking-[0.2em] block">
              Travel Date
            </span>
            <div className="text-sm md:text-base font-bold text-white tracking-tight">
              {dateRange}
            </div>
          </div>
        </div>

        {/* Subtle Photo Attribution if coverImage photographer exists */}
        {pkg.coverImage?.photographerName && (
          <div className="pt-3 mt-4 border-t border-white/10 flex justify-end">
            <span className="text-[8px] uppercase tracking-widest text-white/40 font-mono">
              Cover Photography © {pkg.coverImage.photographerName}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
