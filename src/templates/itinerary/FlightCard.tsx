import React from "react";
import { Plane, Luggage, Briefcase, AlertCircle } from "lucide-react";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { FlightLeg } from "@/lib/schema/itinerary";

export type { FlightLeg };

interface FlightCardProps {
  flight: FlightLeg;
}

export function FlightCard({ flight }: FlightCardProps) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm avoid-break mb-5">
      {/* 1. Header Band */}
      <div className="bg-[#091c3e] px-5 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
            <Plane className="w-3.5 h-3.5" />
            <span>{flight.airline}</span>
          </span>
          {flight.flightNumber && (
            <span className="text-xs text-slate-300 font-mono">
              {flight.flightNumber}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-slate-200">
          {flight.date}
        </div>
      </div>

      {/* 2. Main Ticket Body + Stub Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 relative">
        {/* Main Departure / Arrival Area (3 Cols) */}
        <div className="md:col-span-3 p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            {/* Departure */}
            <div className="text-left flex-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Departure
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-display mt-0.5">
                {flight.departureTime}
              </div>
              <div className="text-sm font-bold text-[#c92229] mt-0.5">
                {flight.departureCode}{" "}
                <span className="text-slate-800 font-semibold">{flight.departureCity}</span>
              </div>
              {flight.departureAirport && (
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {flight.departureAirport}
                </div>
              )}
              {flight.date && (
                <div className="text-[11px] text-slate-400 mt-1 font-medium">
                  {flight.date}
                </div>
              )}
            </div>

            {/* Flight Path Indicator */}
            <div className="flex flex-col items-center px-2 shrink-0">
              <div className="flex items-center gap-1">
                <span className="w-8 md:w-14 border-t-2 border-dashed border-slate-300" />
                <div className="w-6 h-6 rounded-full bg-blue-50 text-[#1556a6] flex items-center justify-center shadow-xs">
                  <Plane className="w-3.5 h-3.5" />
                </div>
                <span className="w-8 md:w-14 border-t-2 border-dashed border-slate-300" />
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {flight.stops}
              </span>
            </div>

            {/* Arrival */}
            <div className="text-right flex-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Arrival
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-display mt-0.5">
                {flight.arrivalTime}
              </div>
              <div className="text-sm font-bold text-[#1556a6] mt-0.5">
                <span className="text-slate-800 font-semibold">{flight.arrivalCity} </span>
                {flight.arrivalCode}
              </div>
              {flight.arrivalAirport && (
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {flight.arrivalAirport}
                </div>
              )}
              {flight.date && (
                <div className="text-[11px] text-slate-400 mt-1 font-medium">
                  {flight.date}
                </div>
              )}
            </div>
          </div>

          {/* Layover Bar if applicable */}
          {flight.layover && (
            <div className="mt-4 pt-2.5 border-t border-amber-100 bg-amber-50/70 -mx-5 -mb-6 p-3 px-5 flex items-center gap-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{flight.layover}</span>
            </div>
          )}
        </div>

        {/* Perforated Divider Ticket Stub (1 Col) */}
        <div className="relative border-t md:border-t-0 md:border-l-2 border-dashed border-slate-200 p-5 bg-slate-50/60 flex flex-col justify-between">
          {/* Top & Bottom Circular Notches for desktop/print */}
          <div className="hidden md:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-white border border-slate-200 z-10" />
          <div className="hidden md:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-white border border-slate-200 z-10" />

          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Route
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1 flex items-center gap-1 font-display">
              <span>{flight.departureCode}</span>
              <Plane className="w-3.5 h-3.5 text-amber-500" />
              <span>{flight.arrivalCode}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Luggage className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Check-in</span>
                <span className="font-bold text-slate-900">{flight.checkInBaggage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Cabin</span>
                <span className="font-bold text-slate-900">{flight.cabinBaggage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FlightsSectionProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
}

export function FlightsSection({ clientView, pageNumber = 3 }: FlightsSectionProps) {
  const { flights } = clientView;

  if (!flights || flights.length === 0) {
    return null;
  }

  return (
    <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
      <div>
        <SectionTitle title="Flights" />
        <div className="mt-6 space-y-4">
          {flights.map((flight, i) => (
            <FlightCard key={flight.id || i} flight={flight} />
          ))}
        </div>
      </div>
      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}

export default FlightsSection;

