"use client";

import React, { useState } from "react";
import { FlightLeg, Package, ItineraryDay } from "@/lib/schema/itinerary";
import {
  Plane,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Luggage,
  Briefcase,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface FlightsPanelProps {
  flights: FlightLeg[];
  packageData: Package;
  days: ItineraryDay[];
  onChange: (updatedFlights: FlightLeg[]) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

const POPULAR_AIRLINES = [
  "IndiGo",
  "Air India",
  "Vistara",
  "SpiceJet",
  "VietJet Air",
  "Thai AirAsia",
  "Emirates",
  "Singapore Airlines",
  "Qatar Airways",
];

const CHECKIN_OPTIONS = ["15 kg", "20 kg", "25 kg", "30 kg", "No check-in"];
const CABIN_OPTIONS = ["7 kg", "8 kg", "10 kg"];

const COMMON_AIRPORTS: Record<string, { code: string; city: string; airport: string }> = {
  delhi: { code: "DEL", city: "New Delhi", airport: "Indira Gandhi International Airport" },
  mumbai: { code: "BOM", city: "Mumbai", airport: "Chhatrapati Shivaji Maharaj International Airport" },
  bengaluru: { code: "BLR", city: "Bengaluru", airport: "Kempegowda International Airport" },
  bangalore: { code: "BLR", city: "Bengaluru", airport: "Kempegowda International Airport" },
  goa: { code: "GOI", city: "Goa (Dabolim)", airport: "Dabolim International Airport" },
  srinagar: { code: "SXR", city: "Srinagar", airport: "Sheikh ul-Alam International Airport" },
  kashmir: { code: "SXR", city: "Srinagar", airport: "Sheikh ul-Alam International Airport" },
  vietnam: { code: "DAD", city: "Da Nang", airport: "Da Nang International Airport" },
  "da nang": { code: "DAD", city: "Da Nang", airport: "Da Nang International Airport" },
  danang: { code: "DAD", city: "Da Nang", airport: "Da Nang International Airport" },
  hanoi: { code: "HAN", city: "Hanoi", airport: "Noi Bai International Airport" },
  saigon: { code: "SGN", city: "Ho Chi Minh City", airport: "Tan Son Nhat International Airport" },
  dubai: { code: "DXB", city: "Dubai", airport: "Dubai International Airport" },
  singapore: { code: "SIN", city: "Singapore", airport: "Singapore Changi Airport" },
  bangkok: { code: "BKK", city: "Bangkok", airport: "Suvarnabhumi Airport" },
  phuket: { code: "HKT", city: "Phuket", airport: "Phuket International Airport" },
  bali: { code: "DPS", city: "Bali (Denpasar)", airport: "Ngurah Rai International Airport" },
  maldives: { code: "MLE", city: "Malé", airport: "Velana International Airport" },
};

function resolveAirportHint(name: string) {
  const clean = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(COMMON_AIRPORTS)) {
    if (clean.includes(key)) return val;
  }
  return {
    code: name.slice(0, 3).toUpperCase(),
    city: name,
    airport: `${name} Airport`,
  };
}

export default function FlightsPanel({
  flights = [],
  packageData,
  days,
  onChange,
  reviewFlags = [],
}: FlightsPanelProps) {
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);

  // Add a blank flight leg
  const handleAddFlight = () => {
    const dest = packageData.destinations[0] || "Destination";
    const destHint = resolveAirportHint(dest);
    const originHint = resolveAirportHint("delhi");

    const newLeg: FlightLeg = {
      id: "fl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      airline: "IndiGo",
      flightNumber: "",
      date: packageData.startDate || "",
      departureTime: "08:00",
      departureCode: originHint.code,
      departureCity: originHint.city,
      departureAirport: originHint.airport,
      arrivalTime: "10:30",
      arrivalCode: destHint.code,
      arrivalCity: destHint.city,
      arrivalAirport: destHint.airport,
      stops: "Non-stop",
      layover: "",
      checkInBaggage: "15 kg",
      cabinBaggage: "7 kg",
    };

    const updated = [...flights, newLeg];
    onChange(updated);
    setActiveLegIndex(updated.length - 1);
  };

  // Suggest Default Outbound & Inbound Flights
  const handleSuggestFlights = () => {
    const dest = packageData.destinations[0] || "Vietnam";
    const destHint = resolveAirportHint(dest);
    const originHint = resolveAirportHint("delhi");

    const outboundDate = packageData.startDate || "15 Nov 2026";
    let returnDate = "21 Nov 2026";
    if (packageData.startDate && packageData.nights) {
      const [y, m, d] = packageData.startDate.split("-").map(Number);
      const ret = new Date(y, m - 1, d);
      ret.setDate(ret.getDate() + packageData.nights);
      returnDate = ret.toISOString().split("T")[0];
    }

    const defaultLegs: FlightLeg[] = [
      {
        id: "fl_outbound_" + Date.now(),
        airline: dest.toLowerCase().includes("vietnam") ? "Thai AirAsia" : "IndiGo",
        flightNumber: dest.toLowerCase().includes("vietnam") ? "FD-131" : "6E-2041",
        date: outboundDate,
        departureTime: "08:15",
        departureCode: originHint.code,
        departureCity: originHint.city,
        departureAirport: originHint.airport,
        arrivalTime: "11:45",
        arrivalCode: destHint.code,
        arrivalCity: destHint.city,
        arrivalAirport: destHint.airport,
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "20 kg",
        cabinBaggage: "7 kg",
      },
      {
        id: "fl_inbound_" + Date.now(),
        airline: dest.toLowerCase().includes("vietnam") ? "Air India" : "IndiGo",
        flightNumber: dest.toLowerCase().includes("vietnam") ? "AI-383" : "6E-2042",
        date: returnDate,
        departureTime: "16:30",
        departureCode: destHint.code,
        departureCity: destHint.city,
        departureAirport: destHint.airport,
        arrivalTime: "20:00",
        arrivalCode: originHint.code,
        arrivalCity: originHint.city,
        arrivalAirport: originHint.airport,
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "20 kg",
        cabinBaggage: "7 kg",
      },
    ];

    onChange(defaultLegs);
    setActiveLegIndex(0);
  };

  // Update specific fields of a flight leg
  const handleUpdateFlight = (index: number, patch: Partial<FlightLeg>) => {
    const updated = flights.map((leg, i) => (i === index ? { ...leg, ...patch } : leg));
    onChange(updated);
  };

  // Duplicate a flight leg
  const handleDuplicateFlight = (index: number) => {
    const source = flights[index];
    const cloned: FlightLeg = {
      ...source,
      id: "fl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      departureCode: source.arrivalCode,
      departureCity: source.arrivalCity,
      departureAirport: source.arrivalAirport,
      arrivalCode: source.departureCode,
      arrivalCity: source.departureCity,
      arrivalAirport: source.departureAirport,
      flightNumber: source.flightNumber ? `${source.flightNumber}-R` : "",
    };

    const updated = [...flights];
    updated.splice(index + 1, 0, cloned);
    onChange(updated);
    setActiveLegIndex(index + 1);
  };

  // Delete a flight leg
  const handleDeleteFlight = (index: number) => {
    if (!confirm(`Delete flight leg #${index + 1}?`)) return;
    const updated = flights.filter((_, i) => i !== index);
    onChange(updated);
    setActiveLegIndex(Math.max(0, index - 1));
  };

  // Reorder up / down
  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= flights.length) return;
    const updated = [...flights];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange(updated);
    setActiveLegIndex(target);
  };

  // Clear all flights
  const handleClearAll = () => {
    if (confirm("Remove all flights from this itinerary? It will render as Land-Only (no flight tickets).")) {
      onChange([]);
      setActiveLegIndex(0);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <Plane className="w-4 h-4" />
            </span>
            <span>Travel Flights & Boarding Passes</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {flights.length === 0 ? "Land-Only" : `${flights.length} Flight Leg${flights.length > 1 ? "s" : ""}`}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Flight legs configured here automatically render as authentic airline boarding passes on Page 3 of the client PDF.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSuggestFlights}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition flex items-center gap-1.5"
            title="Auto-generate standard outbound & return flights for this destination"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Suggest Flights</span>
          </button>

          <button
            type="button"
            onClick={handleAddFlight}
            className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Flight Leg</span>
          </button>

          {flights.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1.5 text-xs text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
              title="Clear all flights"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {flights.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/60">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Plane className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No Flights Configured (Land-Only)</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Currently this package will print without a Flight Boarding Pass page. If airline tickets are included in your quote, add them below to render boarding passes in the PDF.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSuggestFlights}
              className="px-4 py-2 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Suggest Route Flights</span>
            </button>
            <button
              type="button"
              onClick={handleAddFlight}
              className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Flight Leg</span>
            </button>
          </div>
        </div>
      ) : (
        /* FLIGHT LEGS ACCORDION / TABS */
        <div className="space-y-4">
          {/* Leg Selector Tab Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
            {flights.map((flight, idx) => (
              <button
                key={flight.id || idx}
                type="button"
                onClick={() => setActiveLegIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                  activeLegIndex === idx
                    ? "bg-[#091c3e] text-white border-[#091c3e] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Leg #{idx + 1}:</span>
                <span className="font-mono text-[11px] font-semibold text-amber-300">
                  {flight.departureCode || "???"} ➔ {flight.arrivalCode || "???"}
                </span>
                <span className="text-[10px] opacity-75 font-normal truncate max-w-[90px]">
                  {flight.airline || "Airline"}
                </span>
              </button>
            ))}
          </div>

          {/* ACTIVE FLIGHT LEG FORM */}
          {flights[activeLegIndex] && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
              {/* Leg Sub-header & Actions */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-slate-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
                    Leg #{activeLegIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {flights[activeLegIndex].departureCity || flights[activeLegIndex].departureCode} to{" "}
                    {flights[activeLegIndex].arrivalCity || flights[activeLegIndex].arrivalCode}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(activeLegIndex, "up")}
                    disabled={activeLegIndex === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30"
                    title="Move Leg Up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(activeLegIndex, "down")}
                    disabled={activeLegIndex === flights.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30"
                    title="Move Leg Down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-slate-300 mx-1" />
                  <button
                    type="button"
                    onClick={() => handleDuplicateFlight(activeLegIndex)}
                    className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Clone / Create Return Leg"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFlight(activeLegIndex)}
                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete Leg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ROW 1: AIRLINE, FLIGHT NUMBER, DATE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Airline *
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].airline}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { airline: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="e.g. Thai AirAsia, IndiGo"
                  />
                  {/* Quick airline chips */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {POPULAR_AIRLINES.slice(0, 5).map((air) => (
                      <button
                        key={air}
                        type="button"
                        onClick={() => handleUpdateFlight(activeLegIndex, { airline: air })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                      >
                        {air}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].flightNumber || ""}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { flightNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="e.g. FD-131, 6E-2041"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Flight Date
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].date || ""}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="e.g. 15 Nov 2026 or 2026-11-15"
                  />
                </div>
              </div>

              {/* ROW 2: DEPARTURE & ARRIVAL ROUTE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DEPARTURE CARD */}
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-red-600 border-b border-red-50 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 rotate-45" /> DEPARTURE DETAILS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Airport Code (IATA) *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={flights[activeLegIndex].departureCode}
                        onChange={(e) =>
                          handleUpdateFlight(activeLegIndex, { departureCode: e.target.value.toUpperCase() })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                        placeholder="DEL"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Departure Time *
                      </label>
                      <input
                        type="text"
                        value={flights[activeLegIndex].departureTime}
                        onChange={(e) => handleUpdateFlight(activeLegIndex, { departureTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                        placeholder="20:55"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Departure City *
                    </label>
                    <input
                      type="text"
                      value={flights[activeLegIndex].departureCity}
                      onChange={(e) => handleUpdateFlight(activeLegIndex, { departureCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                      placeholder="New Delhi"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Airport Name
                    </label>
                    <input
                      type="text"
                      value={flights[activeLegIndex].departureAirport || ""}
                      onChange={(e) => handleUpdateFlight(activeLegIndex, { departureAirport: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                      placeholder="Indira Gandhi International Airport"
                    />
                  </div>
                </div>

                {/* ARRIVAL CARD */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 border-b border-blue-50 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 -rotate-45" /> ARRIVAL DETAILS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Airport Code (IATA) *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        value={flights[activeLegIndex].arrivalCode}
                        onChange={(e) =>
                          handleUpdateFlight(activeLegIndex, { arrivalCode: e.target.value.toUpperCase() })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="DAD"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Arrival Time *
                      </label>
                      <input
                        type="text"
                        value={flights[activeLegIndex].arrivalTime}
                        onChange={(e) => handleUpdateFlight(activeLegIndex, { arrivalTime: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="09:05"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Arrival City *
                    </label>
                    <input
                      type="text"
                      value={flights[activeLegIndex].arrivalCity}
                      onChange={(e) => handleUpdateFlight(activeLegIndex, { arrivalCity: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Da Nang"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Airport Name
                    </label>
                    <input
                      type="text"
                      value={flights[activeLegIndex].arrivalAirport || ""}
                      onChange={(e) => handleUpdateFlight(activeLegIndex, { arrivalAirport: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      placeholder="Da Nang International Airport"
                    />
                  </div>
                </div>
              </div>

              {/* ROW 3: STOPS, LAYOVER & BAGGAGE ALLOWANCE */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Stops
                  </label>
                  <select
                    value={flights[activeLegIndex].stops}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { stops: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                  >
                    <option value="Non-stop">Non-stop</option>
                    <option value="1 Stop">1 Stop</option>
                    <option value="2 Stops">2 Stops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Layover Description
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].layover || ""}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { layover: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="e.g. 4h 45m layover at Bangkok"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Luggage className="w-3 h-3 text-slate-500" />
                    <span>Check-in Baggage</span>
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].checkInBaggage}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { checkInBaggage: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="20 kg"
                  />
                  <div className="flex gap-1 mt-1">
                    {CHECKIN_OPTIONS.slice(0, 4).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdateFlight(activeLegIndex, { checkInBaggage: opt })}
                        className="text-[9px] px-1 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-500" />
                    <span>Cabin Baggage</span>
                  </label>
                  <input
                    type="text"
                    value={flights[activeLegIndex].cabinBaggage}
                    onChange={(e) => handleUpdateFlight(activeLegIndex, { cabinBaggage: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    placeholder="7 kg"
                  />
                  <div className="flex gap-1 mt-1">
                    {CABIN_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleUpdateFlight(activeLegIndex, { cabinBaggage: opt })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
