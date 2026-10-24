import React from "react";
import { ClientItineraryView } from "@/lib/schema/client-view";
import { SectionTitle, PageFooter } from "./PageHeaderFooter";

interface TripGlanceProps {
  clientView: ClientItineraryView;
  pageNumber?: number;
}

export default function TripGlance({ clientView, pageNumber = 2 }: TripGlanceProps) {
  const { days } = clientView;

  return (
    <section className="p-6 md:p-10 min-h-[920px] md:min-h-[1050px] flex flex-col justify-between avoid-break page-break">
      <div>
        <SectionTitle title="Trip Summary" />

        {/* Clean Table Container matching Reference Page 2 */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#091c3e] text-white">
                <th className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider w-24 font-display">
                  Day
                </th>
                <th className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider w-36 font-display">
                  Date
                </th>
                <th className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider font-display">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {days.map((day, idx) => {
                const dateDisplay = day.calendarDate
                  ? `${day.weekday ? day.weekday.slice(0, 3) + ", " : ""}${day.calendarDate}`
                  : `Day ${day.dayNumber}`;

                return (
                  <tr
                    key={day.dayNumber}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                  >
                    <td className="py-3.5 px-5 font-bold text-slate-900 whitespace-nowrap">
                      Day {day.dayNumber}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-600 whitespace-nowrap text-xs md:text-sm">
                      {dateDisplay}
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 font-medium">
                      {day.title}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PageFooter pageNumber={pageNumber} />
    </section>
  );
}
