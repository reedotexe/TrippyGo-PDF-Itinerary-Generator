import React from "react";
import { ClientDayView } from "@/lib/schema/client-view";

interface DayBlockProps {
  day: ClientDayView;
  isSpacious?: boolean;
}

export default function DayBlock({ day, isSpacious = false }: DayBlockProps) {
  // Destination name from stay or city
  const destination = day.stay?.city || "";

  // Date label formatted cleanly
  const dateLabel = day.calendarDate
    ? `${day.weekday ? day.weekday.slice(0, 3) + ", " : ""}${day.calendarDate}`
    : null;

  // Formatted meal list or default breakfast
  const mealString =
    day.meals && day.meals.length > 0
      ? day.meals.join(" • ")
      : "Breakfast Included";

  const hasImage = Boolean(day.image && day.image.imageUrl);

  return (
    <article
      className={`day-editorial-block avoid-break border-b border-slate-200/80 last:border-b-0 last:pb-0 last:mb-0 ${
        isSpacious ? "pb-5 mb-5" : "pb-3.5 mb-3.5"
      }`}
    >
      {/* 1. Chronological Kicker & Destination Bar */}
      <div className="flex items-baseline justify-between gap-3 pb-1 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-serif-luxury font-bold text-[#091c3e] tracking-tight ${
              isSpacious ? "text-xl md:text-2xl" : "text-lg md:text-xl"
            }`}
          >
            Day {String(day.dayNumber).padStart(2, "0")}
          </span>
          {dateLabel && (
            <span className="text-[11px] font-semibold text-slate-500 font-body uppercase tracking-wider">
              / {dateLabel}
            </span>
          )}
        </div>

        {destination && (
          <span className="text-[11px] font-bold text-[#c92229] font-body uppercase tracking-[0.16em]">
            {destination}
          </span>
        )}
      </div>

      {/* 2. Main Content: Two-column layout with right square photo when image is present */}
      <div className={`mt-2 ${hasImage ? "flex items-start gap-4 sm:gap-5" : ""}`}>
        {/* Left Column: Title, Description, Activities, Stay & Meals */}
        <div className="flex-1 min-w-0">
          {/* Day Title */}
          <h3
            className={`font-bold text-[#091c3e] font-body tracking-tight ${
              isSpacious ? "text-base md:text-lg" : "text-[15px] md:text-base"
            }`}
          >
            {day.title}
          </h3>

          {/* Narrative Description */}
          <div
            className={`text-slate-700 leading-relaxed whitespace-pre-line font-body ${
              isSpacious ? "text-[12.5px] md:text-[13px] mt-1 space-y-0.5" : "text-[12px] md:text-[12.5px] mt-0.5 space-y-0.5"
            }`}
          >
            {day.description}
          </div>

          {/* Experience Highlights & Key Activities (Curated Top 4) */}
          {day.activities && day.activities.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-100/90">
              <div className="text-[9px] uppercase font-bold tracking-[0.18em] text-[#c92229] mb-1 font-body">
                Daily Highlights & Activities
              </div>
              <div className="flex flex-wrap gap-1.5">
                {day.activities.slice(0, 4).map((act, aIdx) => (
                  <span
                    key={aIdx}
                    className="inline-flex items-center text-[10.5px] font-semibold text-[#091c3e] bg-slate-50 border border-slate-200/90 rounded-md px-2 py-0.5 font-body"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c92229] mr-1.5 shrink-0" />
                    <span className="truncate max-w-[260px]">{act}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Metadata Strip (Stay & Meals) */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 pt-1.5 border-t border-slate-100 text-[10.5px] uppercase tracking-wider font-semibold font-body">
            {day.stay && (day.stay.hotel || day.stay.city) && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-normal">Stay:</span>
                <span className="text-[#091c3e] font-bold text-xs">{day.stay.hotel || day.stay.city}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-normal">Meals:</span>
              <span className="text-slate-700 font-bold text-xs">{mealString}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Square Cropped Photography with Minimalist Caption */}
        {hasImage && day.image && day.image.imageUrl && (
          <div className="shrink-0 flex flex-col items-end">
            <div
              className={`relative aspect-square rounded-xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-xs ${
                isSpacious ? "w-40 sm:w-44 h-40 sm:h-44" : "w-32 sm:w-36 h-32 sm:h-36"
              }`}
            >
              <img
                src={day.image.imageUrl}
                alt={day.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
            {day.image.photographerName && (
              <div
                className={`text-[8.5px] text-slate-400 italic text-right mt-1 font-body truncate ${
                  isSpacious ? "max-w-[176px]" : "max-w-[144px]"
                }`}
              >
                Photo: {day.image.photographerName} {day.image.provider ? `(${day.image.provider})` : ""}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
