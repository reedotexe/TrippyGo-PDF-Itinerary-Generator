import React from "react";
import { ClientDayView } from "@/lib/schema/client-view";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface StaysTableProps {
  days: ClientDayView[];
  pageNumber?: number;
  totalPages?: number;
  showFooter?: boolean;
}

export interface ConsolidatedStay {
  hotel: string;
  city: string;
  roomType: string;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  meal: string;
}

/**
 * Computes check-out date from the arrival/stay dates.
 * If next day exists in the itinerary, its calendar date is the check-out date.
 * If final day of itinerary, adds 1 day to the last stay date.
 */
function computeCheckOutDate(
  checkInDate: string,
  lastStayDayDate: string,
  nights: number,
  nextDayDate?: string | null
): string {
  if (nextDayDate) {
    return nextDayDate;
  }

  const baseDateStr = lastStayDayDate || checkInDate;
  if (!baseDateStr) return "";

  // Check if it's "Day X"
  const dayMatch = baseDateStr.match(/^Day\s+(\d+)$/i);
  if (dayMatch) {
    return `Day ${parseInt(dayMatch[1], 10) + 1}`;
  }

  // Parse calendar date e.g. "7 Feb 2027" or "2027-02-07"
  const parsed = new Date(baseDateStr);
  if (!isNaN(parsed.getTime())) {
    parsed.setDate(parsed.getDate() + 1);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${parsed.getDate()} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return baseDateStr;
}

export function getConsolidatedStays(days: ClientDayView[]): ConsolidatedStay[] {
  const staysWithHotelIndices: { day: ClientDayView; originalIndex: number }[] = [];
  days.forEach((d, i) => {
    if (d.stay?.hotel || d.stay?.city) {
      staysWithHotelIndices.push({ day: d, originalIndex: i });
    }
  });

  if (staysWithHotelIndices.length === 0) return [];

  const consolidatedStays: ConsolidatedStay[] = [];
  let currentGroup: {
    hotel: string;
    city: string;
    roomType: string;
    meal: string;
    firstDay: ClientDayView;
    lastDay: ClientDayView;
    lastOriginalIndex: number;
    nights: number;
  } | null = null;

  for (let k = 0; k < staysWithHotelIndices.length; k++) {
    const item = staysWithHotelIndices[k];
    const d = item.day;
    const hotelName = d.stay?.hotel || "Hotel to be confirmed";
    const cityName = d.stay?.city || "Destination";
    const roomType = d.stay?.roomType || "Standard Base Category";
    const meal = d.meals && d.meals.length > 0 ? d.meals.join(", ") : "Breakfast Included";

    if (!currentGroup || currentGroup.hotel !== hotelName) {
      if (currentGroup) {
        const nextDayInItinerary = days[currentGroup.lastOriginalIndex + 1];
        const checkInDate = currentGroup.firstDay.calendarDate || `Day ${currentGroup.firstDay.dayNumber}`;
        const lastStayDayDate = currentGroup.lastDay.calendarDate || `Day ${currentGroup.lastDay.dayNumber}`;
        const checkOutDate = computeCheckOutDate(
          checkInDate,
          lastStayDayDate,
          currentGroup.nights,
          nextDayInItinerary?.calendarDate
        );

        consolidatedStays.push({
          hotel: currentGroup.hotel,
          city: currentGroup.city,
          roomType: currentGroup.roomType,
          nights: currentGroup.nights,
          checkInDate,
          checkOutDate,
          meal: currentGroup.meal,
        });
      }

      currentGroup = {
        hotel: hotelName,
        city: cityName,
        roomType: roomType,
        meal: meal,
        firstDay: d,
        lastDay: d,
        lastOriginalIndex: item.originalIndex,
        nights: 1,
      };
    } else {
      currentGroup.nights += 1;
      currentGroup.lastDay = d;
      currentGroup.lastOriginalIndex = item.originalIndex;
      if (roomType && roomType !== "Standard Base Category" && currentGroup.roomType === "Standard Base Category") {
        currentGroup.roomType = roomType;
      }
    }
  }

  if (currentGroup) {
    const nextDayInItinerary = days[currentGroup.lastOriginalIndex + 1];
    const checkInDate = currentGroup.firstDay.calendarDate || `Day ${currentGroup.firstDay.dayNumber}`;
    const lastStayDayDate = currentGroup.lastDay.calendarDate || `Day ${currentGroup.lastDay.dayNumber}`;
    const checkOutDate = computeCheckOutDate(
      checkInDate,
      lastStayDayDate,
      currentGroup.nights,
      nextDayInItinerary?.calendarDate
    );

    consolidatedStays.push({
      hotel: currentGroup.hotel,
      city: currentGroup.city,
      roomType: currentGroup.roomType,
      nights: currentGroup.nights,
      checkInDate,
      checkOutDate,
      meal: currentGroup.meal,
    });
  }

  return consolidatedStays;
}

export function StayCard({ stay }: { stay: ConsolidatedStay }) {
  return (
    <article className="stay-editorial-block avoid-break pb-5 mb-5 border-b border-slate-200/80 last:border-b-0 last:pb-0 last:mb-0">
      {/* 1. Header: Hotel Name, City & Refined Duration Badge */}
      <div className="flex items-start justify-between gap-4 pb-3">
        <div>
          <h3 className="text-2xl md:text-[26px] font-bold text-[#091c3e] font-serif-luxury tracking-tight leading-snug">
            {stay.hotel}
          </h3>
          <p className="text-xs font-bold text-[#c92229] uppercase tracking-[0.16em] font-body mt-0.5">
            {stay.city}
          </p>
        </div>

        <span className="shrink-0 border border-slate-300 bg-slate-50 text-slate-800 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md font-body">
          {stay.nights} {stay.nights === 1 ? "Night" : "Nights"}
        </span>
      </div>

      {/* 2. Structured Schedule & Amenities Grid (Asymmetric Ratios - ZERO Truncation) */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 pt-3.5 border-t border-slate-100 text-left font-body items-start">
        {/* Check-In: 2 cols */}
        <div className="col-span-1 md:col-span-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-slate-400 block">
            Check-In
          </span>
          <span className="text-sm font-bold text-slate-900 mt-1 block whitespace-nowrap">
            {stay.checkInDate}
          </span>
        </div>

        {/* Check-Out: 2 cols */}
        <div className="col-span-1 md:col-span-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-slate-400 block">
            Check-Out
          </span>
          <span className="text-sm font-bold text-slate-900 mt-1 block whitespace-nowrap">
            {stay.checkOutDate}
          </span>
        </div>

        {/* Room Category: 5 cols (Generous width, wraps naturally without ANY truncation) */}
        <div className="col-span-2 md:col-span-5 md:pr-2">
          <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-slate-400 block">
            Room Category
          </span>
          <span className="text-sm font-semibold text-slate-900 mt-1 block leading-snug break-words">
            {stay.roomType}
          </span>
        </div>

        {/* Meal Plan: 3 cols (Generous width, wraps cleanly) */}
        <div className="col-span-2 md:col-span-3">
          <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-slate-400 block">
            Meal Plan
          </span>
          <span className="text-sm font-semibold text-[#091c3e] mt-1 block leading-snug break-words">
            {stay.meal}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function StaysTable({
  days,
  pageNumber,
  totalPages,
  showFooter = false,
}: StaysTableProps) {
  const consolidatedStays = getConsolidatedStays(days);
  if (consolidatedStays.length === 0) return null;

  return (
    <section className="avoid-break mb-6">
      <SectionTitle kicker="ACCOMMODATION // PORTFOLIO" title="Accommodations" />
      <div className="space-y-2 mt-5">
        {consolidatedStays.map((stay, idx) => (
          <StayCard key={idx} stay={stay} />
        ))}
      </div>
      {showFooter && <PageFooter pageNumber={pageNumber} totalPages={totalPages} />}
    </section>
  );
}
