import React from "react";
import { ClientDayView } from "@/lib/schema/client-view";
import { BedDouble, Utensils, MapPin } from "lucide-react";

interface DayBlockProps {
  day: ClientDayView;
}

export default function DayBlock({ day }: DayBlockProps) {
  // Destination name from stay or title
  const destination = day.stay?.city || "";

  // Date label
  const dateLabel = day.calendarDate
    ? `${day.weekday ? day.weekday.slice(0, 3) + " • " : ""}${day.calendarDate}`
    : null;

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm avoid-break mb-8">
      {/* 1. Day Header: Badge, Date & Destination */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="bg-[#091c3e] text-white px-3.5 py-1 rounded-full text-xs font-bold font-display shadow-xs">
            Day {day.dayNumber}
          </span>
          {dateLabel && (
            <span className="text-xs md:text-sm font-semibold text-slate-500">
              {dateLabel}
            </span>
          )}
        </div>

        {destination && (
          <span className="text-sm font-bold text-[#c92229] font-display flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{destination}</span>
          </span>
        )}
      </div>

      {/* 2. Day Title */}
      <h3 className="text-xl md:text-2xl font-bold text-[#091c3e] mt-4 font-display tracking-tight">
        {day.title}
      </h3>

      {/* 3. Narrative Description */}
      <div className="text-slate-600 text-sm md:text-base leading-relaxed mt-3 space-y-3 whitespace-pre-line font-body">
        {day.description}
      </div>

      {/* 4. Badges: Stay & Meals */}
      <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-3 border-t border-slate-100 text-xs">
        {day.stay && (day.stay.hotel || day.stay.city) && (
          <span className="inline-flex items-center gap-1.5 border border-amber-300 bg-amber-50/60 text-amber-900 px-3 py-1 rounded-full font-semibold shadow-2xs">
            <BedDouble className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Stay: <strong>{day.stay.hotel || day.stay.city}</strong>
            </span>
          </span>
        )}

        {day.meals && day.meals.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {day.meals.map((meal, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 text-slate-800 px-3 py-1 rounded-full font-medium"
              >
                <Utensils className="w-3 h-3 text-slate-500" />
                <span>{meal}</span>
              </span>
            ))}
          </div>
        )}

        {/* If no meals explicitly provided, show standard breakfast tag */}
        {(!day.meals || day.meals.length === 0) && (
          <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1 rounded-full font-medium">
            <Utensils className="w-3 h-3 text-slate-500" />
            <span>Breakfast</span>
          </span>
        )}
      </div>

      {/* 5. High-Impact Photo Showcase matching Reference 2-Photo Spreads */}
      {day.image && day.image.imageUrl && (
        <div className="mt-5 rounded-xl overflow-hidden border border-slate-200 shadow-xs avoid-break">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-100">
            <div className="relative h-56 md:h-64 overflow-hidden">
              <img
                src={day.image.imageUrl}
                alt={day.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {/* Secondary companion angle/photo or scenic backdrop */}
            <div className="relative h-56 md:h-64 overflow-hidden hidden md:block">
              <img
                src={day.image.thumbnailUrl || day.image.imageUrl}
                alt={`${day.title} scenic view`}
                className="w-full h-full object-cover filter brightness-95"
                loading="eager"
              />
            </div>
          </div>
          <div className="bg-[#091c3e] text-slate-300 text-[10px] px-3 py-1 flex items-center justify-between">
            <span>Destination Spotlight</span>
            <span>
              Photo by {day.image.photographerName} on {day.image.provider}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
