import React from "react";
import { ClientDayView } from "@/lib/schema/client-view";
import { Building2, Calendar, Utensils, BedDouble } from "lucide-react";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface StaysTableProps {
  days: ClientDayView[];
  pageNumber?: number;
  showFooter?: boolean;
}

interface ConsolidatedStay {
  hotel: string;
  city: string;
  roomType: string;
  nights: number;
  checkInDate: string;
  checkOutDate: string;
  meal: string;
}

export default function StaysTable({ days, pageNumber, showFooter = false }: StaysTableProps) {
  // Consolidate consecutive days at the same hotel into voucher blocks
  const staysWithHotel = days.filter((d) => d.stay?.hotel || d.stay?.city);

  if (staysWithHotel.length === 0) {
    return null;
  }

  const consolidatedStays: ConsolidatedStay[] = [];
  let currentStay: ConsolidatedStay | null = null;

  staysWithHotel.forEach((d, idx) => {
    const hotelName = d.stay?.hotel || "Hotel to be confirmed";
    const cityName = d.stay?.city || "Destination";
    const roomType = d.stay?.roomType || "Standard Base Category";
    const meal = d.meals && d.meals.length > 0 ? d.meals.join(", ") : "Breakfast Included";
    const date = d.calendarDate || `Day ${d.dayNumber}`;

    if (!currentStay || currentStay.hotel !== hotelName) {
      if (currentStay) {
        consolidatedStays.push(currentStay);
      }
      currentStay = {
        hotel: hotelName,
        city: cityName,
        roomType: roomType,
        nights: 1,
        checkInDate: date,
        checkOutDate: date,
        meal: meal,
      };
    } else {
      currentStay.nights += 1;
      currentStay.checkOutDate = date;
    }

    if (idx === staysWithHotel.length - 1 && currentStay) {
      consolidatedStays.push(currentStay);
    }
  });

  return (
    <section className="avoid-break mb-6">
      <SectionTitle title="Accommodations" />

      <div className="space-y-4 mt-6">
        {consolidatedStays.map((stay, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm avoid-break"
          >
            {/* Header: Hotel Name, City & Night Badge */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 font-display">
                    {stay.hotel}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {stay.city}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs shadow-xs font-display shrink-0">
                {stay.nights} {stay.nights === 1 ? "Night" : "Nights"}
              </span>
            </div>

            {/* Room Details & Schedule */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700">
                <BedDouble className="w-4 h-4 text-[#1556a6] shrink-0" />
                <span>
                  <strong className="text-slate-900">Room:</strong> {stay.roomType}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 text-xs md:text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Check In</span>
                    <span className="font-semibold text-slate-900">{stay.checkInDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Check Out</span>
                    <span className="font-semibold text-slate-900">{stay.checkOutDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs md:text-sm">
                <div className="text-slate-600">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rooms</span>
                  <span className="font-semibold text-slate-900">1 Room (Double / Twin)</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Meal Plan</span>
                    <span className="font-semibold text-emerald-800">{stay.meal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showFooter && <PageFooter pageNumber={pageNumber} />}
    </section>
  );
}
