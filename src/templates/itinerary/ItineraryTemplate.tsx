"use client";

import React from "react";
import { ClientDayView, ClientItineraryView } from "@/lib/schema/client-view";
import CoverPage from "./CoverPage";
import TripGlance, { TripSummaryTable } from "./TripGlance";
import FlightsSection from "./FlightCard";
import { paginateFlightJourneys } from "@/lib/flights/journey";
import StaysTable, { getConsolidatedStays, StayCard } from "./StaysTable";
import DayBlock from "./DayBlock";
import PaymentSection from "./PaymentSection";
import InclusionsExclusions from "./InclusionsExclusions";
import TermsBlock from "./TermsBlock";
import BackPage from "./BackPage";
import { SectionTitle, PageFooter, PageWatermark } from "./PageHeaderFooter";

interface ItineraryTemplateProps {
  clientView: ClientItineraryView;
}

/**
 * Adaptive Day Chunking:
 * Prevents orphan single-day pages and balances content density based on photo presence and text length.
 */
export function chunkDaysAdaptively(days: ClientDayView[]): ClientDayView[][] {
  if (days.length === 0) return [];
  if (days.length === 1) return [days];

  const chunks: ClientDayView[][] = [];
  let currentChunk: ClientDayView[] = [];
  let currentWeight = 0;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const hasImage = Boolean(d.image && d.image.imageUrl);
    // Square cropped photos sit on the right side of the text, maintaining a compact vertical footprint
    const weight = hasImage ? 1.2 : 1.0;

    // Up to 2 photo days (2.4) or 1 photo day + 1 text day (2.2) or 3 text-only days (3.0)
    const maxCapacity = 3.0;

    if (currentChunk.length > 0 && (currentWeight + weight > maxCapacity || currentChunk.length >= 3)) {
      chunks.push(currentChunk);
      currentChunk = [d];
      currentWeight = weight;
    } else {
      currentChunk.push(d);
      currentWeight += weight;
    }
  }

  if (currentChunk.length > 0) {
    // If the final chunk is a single text-only day, rebalance with the previous chunk so no day is orphaned
    if (currentChunk.length === 1 && chunks.length > 0) {
      const prevChunk = chunks[chunks.length - 1];
      if (prevChunk.length >= 2) {
        const movedDay = prevChunk.pop()!;
        currentChunk.unshift(movedDay);
      }
    }
    chunks.push(currentChunk);
  }

  return chunks;
}

export default function ItineraryTemplate({ clientView }: ItineraryTemplateProps) {
  const { package: pkg } = clientView;
  const flights = clientView.flights || [];
  const flightPages = paginateFlightJourneys(flights, pkg.destinations);

  const days = clientView.days || [];
  const dayChunks = chunkDaysAdaptively(days);

  const consolidatedStays = getConsolidatedStays(days);
  const stayChunks = [];
  for (let i = 0; i < consolidatedStays.length; i += 2) {
    stayChunks.push(consolidatedStays.slice(i, i + 2));
  }

  // Determine if there are fixed calendar dates
  const hasFixedDates = Boolean(pkg.startDate && days.some((d) => Boolean(d.calendarDate)));

  // Combine Summary and Stays on Page 2 if both are compact (prevents 80% dead white space)
  const canCombineSummaryAndStays =
    consolidatedStays.length > 0 &&
    consolidatedStays.length <= 2 &&
    days.length <= 6;

  // Accurate sequential page numbers
  let pageCounter = 1; // Cover is page 1

  let tripGlancePage = 0;
  let staysStartPage = 0;

  if (canCombineSummaryAndStays) {
    tripGlancePage = ++pageCounter;
    // stays are rendered on the same page as summary
  } else {
    tripGlancePage = ++pageCounter;
    if (stayChunks.length > 0) {
      staysStartPage = pageCounter + 1;
      pageCounter += stayChunks.length;
    }
  }

  const flightStartPage = flightPages.length > 0 ? pageCounter + 1 : 0;
  if (flightPages.length > 0) {
    pageCounter += flightPages.length;
  }

  const daysStartPage = dayChunks.length > 0 ? pageCounter + 1 : 0;
  if (dayChunks.length > 0) {
    pageCounter += dayChunks.length;
  }

  const paymentPage = ++pageCounter;
  const inclusionsPage = ++pageCounter;
  const termsPage = ++pageCounter;
  const backPage = ++pageCounter;
  const totalPages = backPage;

  return (
    <div className="itinerary-document mx-auto my-6 print:my-0 bg-white shadow-xl print:shadow-none border print:border-none border-slate-200 text-slate-800 font-body antialiased">
      {/* 1. COVER PAGE (Page 1) */}
      <CoverPage clientView={clientView} />

      {/* 2. SUMMARY & ACCOMMODATIONS (Adaptive Combined Flow vs Standalone) */}
      {canCombineSummaryAndStays ? (
        <section className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body">
          <PageWatermark />
          <div className="relative z-10">
            <SectionTitle kicker="OVERVIEW // AT A GLANCE" title="Trip Summary" />
            <div className="mt-4">
              <TripSummaryTable days={days} hasFixedDates={hasFixedDates} />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/80">
              <SectionTitle kicker="ACCOMMODATION // PORTFOLIO" title="Accommodations" />
              <div className="space-y-4 mt-4">
                {consolidatedStays.map((stay, idx) => (
                  <StayCard key={idx} stay={stay} />
                ))}
              </div>
            </div>

            {/* Luxury Trip Inclusions & Support Banner (Anchors lower half of Page 2) */}
            <div className="mt-7 pt-5 border-t border-slate-200/80">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-bold text-[#091c3e] uppercase tracking-wider">Private Transfers</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Dedicated chauffeured A/C vehicle throughout</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-bold text-[#091c3e] uppercase tracking-wider">Verified Stays</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Handpicked premium properties & daily breakfast</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-bold text-[#091c3e] uppercase tracking-wider">24/7 Assistance</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">Dedicated concierge WhatsApp support</div>
                </div>
              </div>
            </div>
          </div>
          <PageFooter pageNumber={tripGlancePage} totalPages={totalPages} />
        </section>
      ) : (
        <>
          {/* Standalone Trip Summary Table */}
          <TripGlance clientView={clientView} pageNumber={tripGlancePage} totalPages={totalPages} />

          {/* Standalone Accommodations (Chunked 2 per page) */}
          {stayChunks.map((chunk, idx) => (
            <section
              key={idx}
              className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body"
            >
              <PageWatermark />
              <div className="relative z-10">
                <SectionTitle kicker="ACCOMMODATION // PORTFOLIO" title="Accommodations" />
                <div className="space-y-4 mt-6">
                  {chunk.map((stay, sIdx) => (
                    <StayCard key={sIdx} stay={stay} />
                  ))}
                </div>
              </div>
              <PageFooter pageNumber={staysStartPage + idx} totalPages={totalPages} />
            </section>
          ))}
        </>
      )}

      {/* 3. FLIGHTS BOARDING PASSES (Connecting Multi-Leg Journeys) */}
      {flightPages.length > 0 && (
        <FlightsSection clientView={clientView} pageNumber={flightStartPage} totalPages={totalPages} />
      )}

      {/* 4. DAY-BY-DAY ITINERARY (Adaptive Flow: 2-3 days per A4 page without orphans) */}
      {dayChunks.map((chunk, idx) => {
        const isSpacious = chunk.length <= 2;
        const hasPhoto = chunk.some((d) => Boolean(d.image && d.image.imageUrl));

        return (
          <section
            key={idx}
            className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body"
          >
            <PageWatermark />
            <div className="relative z-10">
              <SectionTitle
                kicker="JOURNEY // DAY-BY-DAY ITINERARY"
                title="Your Itinerary"
                subtitle={
                  idx === 0
                    ? "Carefully designed day-by-day experiences and personalized journeys."
                    : undefined
                }
              />

              <div className={isSpacious ? "space-y-4 md:space-y-5 mt-4" : "space-y-3 md:space-y-4 mt-3"}>
                {chunk.map((day) => (
                  <DayBlock key={day.dayNumber} day={day} isSpacious={isSpacious} />
                ))}
              </div>

              {/* Editorial Anchor Box when a 2-day spread has no photo and extra breathing room */}
              {isSpacious && !hasPhoto && (
                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 font-body">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c92229]">
                    <span className="w-2 h-2 rounded-full bg-[#c92229]" />
                    Destination Insight & Insider Notes
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    During leisure hours, explore local markets, waterfront promenades, and cultural landmarks at your own pace. Keep local currency handy for artisanal shopping and small gratuities. Your private coordinator is available 24/7 for real-time recommendations.
                  </p>
                </div>
              )}
            </div>
            <PageFooter pageNumber={daysStartPage + idx} totalPages={totalPages} />
          </section>
        );
      })}

      {/* 5. PRICING & PAYMENT (UPI QR & BANK TRANSFER) */}
      <PaymentSection pricing={clientView.pricing} pageNumber={paymentPage} totalPages={totalPages} />

      {/* 6. INCLUSIONS, EXCLUSIONS & NOTES */}
      <InclusionsExclusions
        inclusions={clientView.inclusions}
        exclusions={clientView.exclusions}
        pageNumber={inclusionsPage}
        totalPages={totalPages}
      />

      {/* 7. TERMS, CANCELLATION POLICY & NOTES */}
      <TermsBlock terms={clientView.terms} pageNumber={termsPage} totalPages={totalPages} />

      {/* 8. LUXURY BACK COVER & SOCIAL PROOF */}
      <BackPage clientView={clientView} pageNumber={backPage} totalPages={totalPages} />
    </div>
  );
}
