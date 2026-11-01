import React from "react";
import { AlertCircle, Plane, Clock, PlaneTakeoff, PlaneLanding } from "lucide-react";
import { SectionTitle, PageFooter, PageWatermark } from "./PageHeaderFooter";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { FlightLeg } from "@/lib/schema/itinerary";
import {
  paginateFlightJourneys,
  LayoverInfo,
  FlightJourneyGroup,
} from "@/lib/flights/journey";

export type { FlightLeg };

export interface EnrichedFlightLeg extends FlightLeg {
  legSequenceIndex?: number;
  totalLegsInJourney?: number;
  isFirstLeg?: boolean;
  isLastLeg?: boolean;
  nextLegLayover?: LayoverInfo;
}

interface FlightCardProps {
  flight: EnrichedFlightLeg;
}

export function FlightCard({ flight }: FlightCardProps) {
  const isMultiSector = Boolean(flight.totalLegsInJourney && flight.totalLegsInJourney > 1);

  return (
    <div className="avoid-break mb-4">
      {/* 1. Main Ticket Container */}
      <div className="relative bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs font-body">
        {/* Header Band */}
        <div className="bg-[#091c3e] px-5 py-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold tracking-[0.16em] uppercase text-white">
              {flight.airline}
            </span>
            {flight.flightNumber && (
              <span className="text-[11px] text-slate-300 font-mono tracking-wider">
                • {flight.flightNumber}
              </span>
            )}
            {isMultiSector && flight.legSequenceIndex && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-900 tracking-wider">
                Leg {flight.legSequenceIndex} of {flight.totalLegsInJourney}
              </span>
            )}
          </div>
          <div className="text-xs font-medium text-slate-300 tracking-wider">
            {flight.date}
          </div>
        </div>

        {/* Ticket Body + Perforated Stub Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 relative">
          {/* Main Departure / Arrival Area (3 Cols) */}
          <div className="md:col-span-3 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-4">
              {/* Departure */}
              <div className="text-left flex-1">
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 block">
                  Departure
                </span>
                <div className="text-3xl font-extrabold text-[#091c3e] tracking-tight mt-0.5">
                  {flight.departureCode}
                </div>
                <div className="text-xs font-bold text-[#c92229] mt-0.5">
                  {flight.departureTime}
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {flight.departureCity}
                </div>
                {flight.departureAirport && (
                  <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                    {flight.departureAirport}
                  </div>
                )}
              </div>

              {/* Flight Path Indicator */}
              <div className="flex flex-col items-center px-2 shrink-0">
                <span className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                  {flight.stops || "Direct"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-8 md:w-12 border-t-2 border-dashed border-slate-300" />
                  <span className="text-slate-400 text-xs">✈</span>
                  <span className="w-8 md:w-12 border-t-2 border-dashed border-slate-300" />
                </div>
              </div>

              {/* Arrival */}
              <div className="text-right flex-1">
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 block">
                  Arrival
                </span>
                <div className="text-3xl font-extrabold text-[#091c3e] tracking-tight mt-0.5">
                  {flight.arrivalCode}
                </div>
                <div className="text-xs font-bold text-[#091c3e] mt-0.5">
                  {flight.arrivalTime}
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-0.5">
                  {flight.arrivalCity}
                </div>
                {flight.arrivalAirport && (
                  <div className="text-[10.5px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                    {flight.arrivalAirport}
                  </div>
                )}
              </div>
            </div>

            {/* In-ticket Layover note if explicitly set on a single consolidated leg */}
            {!flight.nextLegLayover && flight.layover && (
              <div className="mt-4 pt-2 border-t border-amber-200/60 bg-amber-50/60 -mx-5 -mb-5 p-2.5 px-5 flex items-center gap-2 text-xs text-amber-900 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{flight.layover}</span>
              </div>
            )}
          </div>

          {/* Perforated Divider Ticket Stub (1 Col) */}
          <div className="relative border-t md:border-t-0 md:border-l-2 border-dashed border-slate-200 p-5 bg-slate-50/70 flex flex-col justify-between">
            {/* Top & Bottom Circular Notches */}
            <div className="hidden md:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-white border border-slate-200 z-10" />
            <div className="hidden md:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-white border border-slate-200 z-10" />

            <div>
              <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-slate-400 block">
                Route
              </span>
              <div className="text-sm font-extrabold text-slate-900 mt-1 flex items-center gap-1.5 font-mono">
                <span>{flight.departureCode}</span>
                <span className="text-slate-400 text-xs">→</span>
                <span>{flight.arrivalCode}</span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-200/60">
              <div>
                <span className="text-[8.5px] uppercase font-bold tracking-[0.16em] text-slate-400 block">
                  Check-in
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {flight.checkInBaggage || "Included"}
                </span>
              </div>
              <div>
                <span className="text-[8.5px] uppercase font-bold tracking-[0.16em] text-slate-400 block">
                  Cabin
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {flight.cabinBaggage || "Included"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Seamless Connecting Layover Bar between Legs */}
      {flight.nextLegLayover && (
        <div className="relative my-3 px-4 py-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-800 shrink-0">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider font-heading">
                <span>Layover in {flight.nextLegLayover.airportCity} ({flight.nextLegLayover.airportCode})</span>
                <span className="text-amber-500 font-bold">•</span>
                <span className="text-amber-900 font-extrabold">
                  {flight.nextLegLayover.durationFormatted} Connection
                </span>
              </div>
              <div className="text-[11px] text-amber-900/80 font-medium mt-0.5">
                {flight.nextLegLayover.transitNote}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[10.5px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300/70 px-2.5 py-1 rounded-md uppercase tracking-wider">
            <span>Connecting Transit</span>
          </div>
        </div>
      )}
    </div>
  );
}

function JourneyHeaderBanner({ journey }: { journey: FlightJourneyGroup }) {
  const isOutbound = journey.direction === "outbound";
  const isInbound = journey.direction === "inbound";

  return (
    <div className="flex items-center justify-between border-b border-slate-200/90 pb-3 mb-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs ${
            isOutbound
              ? "bg-[#091c3e] text-white"
              : isInbound
              ? "bg-[#c92229] text-white"
              : "bg-slate-700 text-white"
          }`}
        >
          {isOutbound ? (
            <PlaneTakeoff className="w-4 h-4 text-amber-400" />
          ) : isInbound ? (
            <PlaneLanding className="w-4 h-4 text-white" />
          ) : (
            <Plane className="w-4 h-4 text-white" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-extrabold tracking-tight text-[#091c3e] uppercase">
            {isOutbound
              ? "Onward Journey • Going Flights"
              : isInbound
              ? "Return Journey • Inbound Flights"
              : "Inter-City Flight Schedule"}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            {journey.originCity} ({journey.originCode}) ➔ {journey.destinationCity} ({journey.destinationCode})
            {journey.isConnecting
              ? ` • ${journey.legs.length} Flight Sectors with ${journey.layovers.length} Layover`
              : " • Direct Non-Stop Flight"}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
            isOutbound
              ? "bg-blue-50 text-blue-900 border-blue-200"
              : isInbound
              ? "bg-red-50 text-[#c92229] border-red-200"
              : "bg-slate-100 text-slate-800 border-slate-200"
          }`}
        >
          {isOutbound ? `Dep: ${journey.departureDate}` : `Return: ${journey.departureDate}`}
        </span>
      </div>
    </div>
  );
}

interface FlightsSectionProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
  totalPages?: number;
}

export function FlightsSection({
  clientView,
  pageNumber = 3,
  totalPages,
}: FlightsSectionProps) {
  const { flights } = clientView;

  if (!flights || flights.length === 0) {
    return null;
  }

  const pdfPages = paginateFlightJourneys(flights, clientView.package.destinations);

  return (
    <>
      {pdfPages.map((page, pageIdx) => (
        <section
          key={page.pageIndex}
          className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body"
        >
          <PageWatermark />
          <div className="relative z-10">
            <SectionTitle
              kicker="TRANSIT // FLIGHT SCHEDULE"
              title="Flight Schedule"
              subtitle={
                pageIdx === 0
                  ? "Confirmed carrier flight tickets and transit boarding schedules."
                  : undefined
              }
            />

            <div className="mt-5 space-y-6">
              {page.journeys.map((jItem, jIdx) => (
                <div key={jItem.journey.id || jIdx} className="space-y-2">
                  <JourneyHeaderBanner journey={jItem.journey} />
                  <div className="space-y-3">
                    {jItem.legs.map((leg, legIdx) => (
                      <FlightCard
                        key={leg.id || `${jItem.journey.id}_${legIdx}`}
                        flight={leg}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={pageNumber + pageIdx} totalPages={totalPages} />
        </section>
      ))}
    </>
  );
}

export default FlightsSection;
