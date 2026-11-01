import React from "react";
import { ClientDayView, ClientItineraryView } from "@/lib/schema/client-view";
import { SectionTitle, PageFooter, PageWatermark } from "./PageHeaderFooter";

export interface TripSummaryTableProps {
  days: ClientDayView[];
  hasFixedDates: boolean;
}

export function TripSummaryTable({ days, hasFixedDates }: TripSummaryTableProps) {
  return (
    <div className="border border-slate-200/90 rounded-lg overflow-hidden font-body">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#091c3e] text-white">
            <th className="py-3 px-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 w-24 md:w-28 font-body">
              Day
            </th>
            {hasFixedDates && (
              <th className="py-3 px-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 w-36 md:w-44 font-body">
                Date
              </th>
            )}
            <th className="py-3 px-5 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 font-body">
              Experience & Highlights
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {days.map((day, idx) => {
            const dateDisplay = day.calendarDate
              ? `${day.weekday ? day.weekday.slice(0, 3) + ", " : ""}${day.calendarDate}`
              : null;

            return (
              <tr
                key={day.dayNumber}
                className={idx % 2 === 0 ? "bg-white" : "bg-[#fafaf7]"}
              >
                <td className="py-3.5 px-5 font-serif-luxury text-lg font-bold text-[#091c3e] whitespace-nowrap">
                  Day {String(day.dayNumber).padStart(2, "0")}
                </td>
                {hasFixedDates && (
                  <td className="py-3.5 px-5 font-semibold text-slate-700 whitespace-nowrap text-[13px]">
                    {dateDisplay || "—"}
                  </td>
                )}
                <td className="py-3.5 px-5 text-slate-900 font-medium text-[13.5px] md:text-sm leading-snug">
                  {day.title}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface TripGlanceProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
  totalPages?: number;
}

export default function TripGlance({ clientView, pageNumber = 2, totalPages }: TripGlanceProps) {
  const { days, package: pkg } = clientView;

  // Determine if there are fixed calendar dates
  const hasFixedDates = Boolean(pkg.startDate && days.some((d) => Boolean(d.calendarDate)));

  return (
    <section className="itinerary-page relative p-6 md:p-10 flex flex-col justify-between avoid-break page-break font-body">
      <PageWatermark />
      <div className="relative z-10">
        <SectionTitle kicker="OVERVIEW // AT A GLANCE" title="Trip Summary" />
        <div className="mt-6">
          <TripSummaryTable days={days} hasFixedDates={hasFixedDates} />
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} totalPages={totalPages} />
    </section>
  );
}
