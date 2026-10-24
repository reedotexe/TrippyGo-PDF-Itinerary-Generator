import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { User, Calendar, Users, Plane, MapPin } from "lucide-react";

interface CoverPageProps {
  clientView: ClientItineraryView;
}

export default function CoverPage({ clientView }: CoverPageProps) {
  const { package: pkg, days } = clientView;

  // Primary destination for headline
  const primaryDest = pkg.destinations[0] || "Your Destination";

  // Hero image: first available day photo, or destination fallback
  const heroImage =
    days.find((d) => d.image?.imageUrl)?.image?.imageUrl ||
    "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80";

  // Formatted date string
  const dateRange =
    pkg.startDate && pkg.endDate
      ? `${days[0]?.calendarDate || pkg.startDate} – ${pkg.endDate}`
      : pkg.startDate
      ? `From ${days[0]?.calendarDate || pkg.startDate}`
      : "Flexible Dates";

  // Guest Name (use package title or default to Valued Guest)
  const guestName =
    pkg.title.includes("-")
      ? pkg.title.split("-")[0].trim().toUpperCase()
      : "VALUED TRAVELLER";

  return (
    <header className="relative min-h-[920px] md:min-h-[1050px] flex flex-col justify-between p-6 md:p-10 rounded-2xl print:rounded-none overflow-hidden text-white avoid-break page-break">
      {/* 1. Full-Bleed Background Image with Dark Vignette Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt={pkg.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-900/50 to-[#091c3e]/95" />
      </div>

      {/* 2. Top Bar: Brand Monogram / Badge */}
      <div className="relative z-10 flex justify-end">
        <div className="bg-white/95 backdrop-blur-sm p-2 rounded-2xl shadow-xl flex items-center justify-center w-20 h-20 md:w-24 md:h-24 border border-white/40">
          <img
            src="/brand/trippygo-logo.png"
            alt="TrippyGo Logo"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* 3. Center/Lower Third: Dramatic Hero Typography */}
      <div className="relative z-10 my-auto pt-24 pb-12">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#c92229] text-white px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 shadow">
            Curated Travel Experience
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-display drop-shadow-lg">
            The essence of {primaryDest} , beyond the ordinary.
          </h1>
          <p className="text-blue-100 text-sm md:text-base mt-3 font-medium flex items-center gap-2 drop-shadow">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pkg.destinations.join(" • ")}</span>
          </p>
        </div>
      </div>

      {/* 4. Bottom Floating Client Card */}
      <div className="relative z-10 bg-white text-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-100">
        {/* Guest Avatar & Name */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <User className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Itinerary Prepared For
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-wide font-display">
              {guestName}
            </h2>
          </div>
        </div>

        {/* 2x2 Information Grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-5">
          {/* Duration */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Duration
              </div>
              <div className="text-sm md:text-base font-bold text-slate-900 mt-0.5 font-display">
                {pkg.nights} Nights / {pkg.days} Days
              </div>
            </div>
          </div>

          {/* Travelers */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Travelers
              </div>
              <div className="text-sm md:text-base font-bold text-slate-900 mt-0.5 font-display">
                {pkg.travellers.adults} Adults
                {pkg.travellers.children > 0 ? `, ${pkg.travellers.children} Children` : ""}
              </div>
            </div>
          </div>

          {/* Destinations */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Destinations
              </div>
              <div className="text-sm md:text-base font-bold text-slate-900 mt-0.5 font-display">
                {pkg.destinations.join(", ")}
              </div>
            </div>
          </div>

          {/* Travel Date */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1556a6] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Travel Date
              </div>
              <div className="text-sm md:text-base font-bold text-slate-900 mt-0.5 font-display">
                {dateRange}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
