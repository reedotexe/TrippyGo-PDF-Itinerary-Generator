import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import CoverPage from "./CoverPage";
import TripGlance from "./TripGlance";
import FlightsSection from "./FlightCard";
import StaysTable from "./StaysTable";
import DayBlock from "./DayBlock";
import PaymentSection from "./PaymentSection";
import InclusionsExclusions from "./InclusionsExclusions";
import TermsBlock from "./TermsBlock";
import BackPage from "./BackPage";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface ItineraryTemplateProps {
  clientView: ClientItineraryView;
}

export default async function ItineraryTemplate({ clientView }: ItineraryTemplateProps) {
  const hasFlights = Boolean(clientView.flights && clientView.flights.length > 0);
  let pageCounter = 1;

  return (
    <div className="itinerary-document mx-auto my-6 print:my-0 bg-white shadow-xl print:shadow-none border print:border-none border-slate-200 text-slate-800 font-sans antialiased">
      {/* 1. COVER PAGE (Page 1) */}
      <CoverPage clientView={clientView} />

      {/* 2. TRIP SUMMARY TABLE */}
      <TripGlance clientView={clientView} pageNumber={++pageCounter} />

      {/* 3. FLIGHTS BOARDING PASSES (Rendered when flights are configured) */}
      {hasFlights && (
        <FlightsSection clientView={clientView} pageNumber={++pageCounter} />
      )}

      {/* 4. ACCOMMODATIONS & STAYS */}
      <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
        <div>
          <StaysTable days={clientView.days} />
        </div>
        <PageFooter pageNumber={++pageCounter} />
      </section>

      {/* 5. DAY-BY-DAY ITINERARY NARRATIVE & PHOTO SPREADS */}
      <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
        <div>
          <SectionTitle
            title="Your Itinerary"
            subtitle="Carefully designed day-by-day experiences and personalized journeys."
          />

          <div className="space-y-6 mt-6">
            {clientView.days.map((day) => (
              <DayBlock key={day.dayNumber} day={day} />
            ))}
          </div>
        </div>
        <PageFooter pageNumber={++pageCounter} />
      </section>

      {/* 6. PRICING & PAYMENT (UPI QR & BANK TRANSFER) */}
      <PaymentSection pricing={clientView.pricing} pageNumber={++pageCounter} />

      {/* 7. INCLUSIONS, EXCLUSIONS & NOTES */}
      <InclusionsExclusions
        inclusions={clientView.inclusions}
        exclusions={clientView.exclusions}
        pageNumber={++pageCounter}
      />

      {/* 8. TERMS, CANCELLATION POLICY & NOTES */}
      <TermsBlock terms={clientView.terms} pageNumber={++pageCounter} />

      {/* 9. LUXURY BACK COVER & SOCIAL PROOF */}
      <BackPage clientView={clientView} pageNumber={++pageCounter} />
    </div>
  );
}
