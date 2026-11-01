"use client";

import React, { useState, useEffect, useRef } from "react";
import { FlightLeg, Package } from "@/lib/schema/itinerary";
import {
  POPULAR_ROUTE_AIRPORTS,
  resolveAirportCode,
  resolveAirportMetadata,
} from "@/lib/flights/airports";
import { RouteConnectingFlight } from "@/lib/flights/sky-scanner";
import {
  X,
  Plane,
  ArrowRight,
  ArrowLeftRight,
  Search,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Clock,
  PlaneTakeoff,
  PlaneLanding,
  ChevronDown,
  ChevronUp,
  Luggage,
  Check,
} from "lucide-react";
import AirportInput from "./AirportInput";

interface AirportSuggestion {
  code: string;
  city: string;
  name: string;
  country?: string;
}

function toDateInputValue(raw?: string | null): string {
  if (!raw) return new Date().toISOString().split("T")[0];
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

interface FlightSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLegIndex: number | null;
  currentLeg?: FlightLeg;
  packageData: Package;
  onApplyFlight: (
    flightData: Partial<FlightLeg> | Partial<FlightLeg>[],
    isNewLeg: boolean
  ) => void;
}

interface RouteFlightItem {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureCode: string;
  departureCity: string;
  departureAirport: string;
  departureTerminal?: string;
  arrivalTime: string;
  arrivalCode: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTerminal?: string;
  stops: string;
  duration?: string;
  priceFormatted?: string;
  isEstimatedSchedule: boolean;
}

export default function FlightSearchModal({
  isOpen,
  onClose,
  targetLegIndex,
  currentLeg,
  packageData,
  onApplyFlight,
}: FlightSearchModalProps) {
  // Tabs: "route" | "number"
  const [activeTab, setActiveTab] = useState<"route" | "number">("route");

  // Mode: replace active leg or append as new leg
  const [insertAsNew, setInsertAsNew] = useState<boolean>(targetLegIndex === null);

  // Journey direction for the applied flight
  const [targetDirection, setTargetDirection] = useState<"outbound" | "inbound">(
    currentLeg?.direction === "inbound" ? "inbound" : "outbound"
  );

  // Tab 1 (Route Search) States
  const [fromInput, setFromInput] = useState<string>("DEL");
  const [toInput, setToInput] = useState<string>("BOM");
  const [routeDate, setRouteDate] = useState<string>("");
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeResults, setRouteResults] = useState<RouteFlightItem[]>([]);
  const [connectingResults, setConnectingResults] = useState<RouteConnectingFlight[]>([]);
  const [routeViewFilter, setRouteViewFilter] = useState<"direct" | "connecting">("direct");
  const [hasSearchedRoute, setHasSearchedRoute] = useState<boolean>(false);
  const [isEstimatedRoute, setIsEstimatedRoute] = useState<boolean>(false);
  const [resolvedFromCity, setResolvedFromCity] = useState<string>("");
  const [resolvedToCity, setResolvedToCity] = useState<string>("");

  // Which flight has its leg-by-leg details accordion expanded
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);

  // Tab 2 (Flight Number Lookup) States
  const [flightNumberInput, setFlightNumberInput] = useState<string>("");
  const [lookupDate, setLookupDate] = useState<string>("");
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [verifiedFlight, setVerifiedFlight] = useState<Partial<FlightLeg> | null>(null);

  // Initialization when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initialDate = toDateInputValue(
      currentLeg?.date || packageData.startDate
    );

    setRouteDate(initialDate);
    setLookupDate(initialDate);

    // Initial origin / destination defaults
    if (currentLeg?.departureCode) {
      setFromInput(currentLeg.departureCode);
    } else {
      setFromInput("DEL");
    }

    if (currentLeg?.arrivalCode) {
      setToInput(currentLeg.arrivalCode);
    } else if (packageData.destinations[0]) {
      const code = resolveAirportCode(packageData.destinations[0]);
      setToInput(code || packageData.destinations[0]);
    } else {
      setToInput("BOM");
    }

    if (currentLeg?.flightNumber) {
      setFlightNumberInput(currentLeg.flightNumber);
    }

    setInsertAsNew(targetLegIndex === null);
    setTargetDirection(currentLeg?.direction === "inbound" ? "inbound" : "outbound");
    setRouteResults([]);
    setConnectingResults([]);
    setRouteViewFilter("direct");
    setHasSearchedRoute(false);
    setRouteError(null);
    setLookupError(null);
    setVerifiedFlight(null);
    setExpandedFlightId(null);

    // Keyboard listener for Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, targetLegIndex, currentLeg, packageData, onClose]);

  if (!isOpen) return null;

  // Swap Origin and Destination
  const handleSwapAirports = () => {
    const prevFrom = fromInput;
    setFromInput(toInput);
    setToInput(prevFrom);
    if (routeResults.length > 0 || connectingResults.length > 0) {
      setRouteResults([]);
      setConnectingResults([]);
      setHasSearchedRoute(false);
    }
  };

  // Execute Route Search
  const handleSearchRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!fromInput.trim() || !toInput.trim()) {
      setRouteError("Please enter both origin and destination (city name or airport code).");
      return;
    }

    setRouteLoading(true);
    setRouteError(null);
    setHasSearchedRoute(true);

    try {
      const params = new URLSearchParams({
        from: fromInput.trim(),
        to: toInput.trim(),
        date: routeDate.trim(),
      });
      const res = await fetch(`/api/flights/route?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRouteError(data.error || "Failed to search flights on this route.");
        setRouteResults([]);
        setConnectingResults([]);
        return;
      }

      const direct = data.flights || [];
      const connecting = data.connectingFlights || [];
      setRouteResults(direct);
      setConnectingResults(connecting);
      setIsEstimatedRoute(Boolean(data.isEstimatedSchedule));
      setResolvedFromCity(data.fromCity || data.from);
      setResolvedToCity(data.toCity || data.to);

      // Auto-toggle to connecting flights if 0 direct flights found
      if (direct.length === 0 && connecting.length > 0) {
        setRouteViewFilter("connecting");
      } else {
        setRouteViewFilter("direct");
      }
    } catch {
      setRouteError("Network error while connecting to flight schedule service.");
      setRouteResults([]);
      setConnectingResults([]);
    } finally {
      setRouteLoading(false);
    }
  };

  // Execute Direct Flight Number Lookup
  const handleLookupNumber = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNum = flightNumberInput.trim();
    if (!cleanNum) {
      setLookupError("Please enter a valid flight number (e.g. 6E 204, AI 101).");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setVerifiedFlight(null);

    try {
      const params = new URLSearchParams({
        number: cleanNum,
        date: lookupDate.trim(),
      });
      const res = await fetch(`/api/flights/lookup?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLookupError(data.error || "Flight not found on this date. You can still enter details manually.");
        return;
      }

      setVerifiedFlight(data.flight);
    } catch {
      setLookupError("Network error while verifying flight number.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Apply selected direct route flight
  const handleSelectRouteFlight = (item: RouteFlightItem) => {
    const flightLegPatch: Partial<FlightLeg> = {
      airline: item.airline,
      flightNumber: item.flightNumber,
      date: routeDate || packageData.startDate || "",
      departureTime: item.departureTime,
      departureCode: item.departureCode,
      departureCity: item.departureCity,
      departureAirport: item.departureAirport,
      arrivalTime: item.arrivalTime,
      arrivalCode: item.arrivalCode,
      arrivalCity: item.arrivalCity,
      arrivalAirport: item.arrivalAirport,
      stops: item.stops,
      direction: targetDirection,
    };

    onApplyFlight(flightLegPatch, insertAsNew);
    onClose();
  };

  // Apply connecting flight - Option A: Add both individual flight segments (Default & Recommended)
  const handleSelectConnectingBoth = (flight: RouteConnectingFlight) => {
    const legPatches: Partial<FlightLeg>[] = flight.segments.map((seg, idx) => {
      const isFirst = idx === 0;

      let layoverText = "";
      if (isFirst && flight.layoverDuration) {
        layoverText = `Transit: ${flight.layoverDuration}`;
      } else if (!isFirst) {
        layoverText = `Connecting flight from ${flight.departureCity} (${flight.departureCode})`;
      }

      return {
        airline: seg.airline,
        flightNumber: seg.flightNumber,
        date: seg.departureDate || routeDate || packageData.startDate || "",
        departureTime: seg.departureTime,
        departureCode: seg.departureCode,
        departureCity: seg.departureCity,
        departureAirport: seg.departureAirport,
        arrivalTime: seg.arrivalTime,
        arrivalCode: seg.arrivalCode,
        arrivalCity: seg.arrivalCity,
        arrivalAirport: seg.arrivalAirport,
        stops: "Non-stop",
        layover: layoverText,
        direction: targetDirection,
      };
    });

    onApplyFlight(legPatches, insertAsNew);
    onClose();
  };

  // Apply connecting flight - Option B: Add as single consolidated ticket
  const handleSelectConnectingSingle = (flight: RouteConnectingFlight) => {
    const flightLegPatch: Partial<FlightLeg> = {
      airline: flight.airline,
      flightNumber: flight.flightNumberSummary,
      date: flight.departureDate || routeDate || packageData.startDate || "",
      departureTime: flight.departureTime,
      departureCode: flight.departureCode,
      departureCity: flight.departureCity,
      departureAirport: flight.departureAirport,
      arrivalTime: flight.arrivalTime,
      arrivalCode: flight.arrivalCode,
      arrivalCity: flight.arrivalCity,
      arrivalAirport: flight.arrivalAirport,
      stops: `${flight.stopCount} Stop${flight.stopCount > 1 ? "s" : ""} (${flight.transitHubs})`,
      layover: flight.layoverDuration,
      direction: targetDirection,
    };

    onApplyFlight(flightLegPatch, insertAsNew);
    onClose();
  };

  // Apply verified direct lookup flight
  const handleSelectVerifiedFlight = () => {
    if (!verifiedFlight) return;
    const flightLegPatch: Partial<FlightLeg> = {
      ...verifiedFlight,
      date: lookupDate || packageData.startDate || "",
      direction: targetDirection,
    };
    onApplyFlight(flightLegPatch, insertAsNew);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 font-body">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flight-search-modal-title"
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-3.5 border-b border-slate-200 bg-[#091c3e] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
              <Plane className="w-4 h-4 rotate-45" />
            </div>
            <div>
              <h2
                id="flight-search-modal-title"
                className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2"
              >
                <span>Search Live Flights & Layovers</span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Discover authentic carrier schedules, connecting routes with layovers, and direct flight numbers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close flight modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SUBHEADER: TABS & TARGET CONTEXT */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Mode Tabs: Route Search vs Flight Number */}
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("route")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === "route"
                  ? "bg-[#091c3e] text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Search Route & Layovers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("number")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                activeTab === "number"
                  ? "bg-[#091c3e] text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Flight Number Lookup</span>
            </button>
          </div>

          {/* Journey Direction Context */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setTargetDirection("outbound")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                  targetDirection === "outbound"
                    ? "bg-[#091c3e] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlaneTakeoff className="w-3 h-3 text-amber-400" />
                <span>Going (Outbound)</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetDirection("inbound")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition flex items-center gap-1 ${
                  targetDirection === "inbound"
                    ? "bg-[#c92229] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <PlaneLanding className="w-3 h-3 text-white" />
                <span>Return (Inbound)</span>
              </button>
            </div>

            {targetLegIndex !== null ? (
              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs shadow-2xs">
                <input
                  type="checkbox"
                  checked={insertAsNew}
                  onChange={(e) => setInsertAsNew(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="text-slate-700 font-semibold text-[11px]">
                  {insertAsNew ? "Add as New Leg" : `Update Sector #${targetLegIndex + 1}`}
                </span>
              </label>
            ) : (
              <span className="font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                Add as New Flight Leg
              </span>
            )}
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: UNIFIED HORIZONTAL ROUTE SEARCH BAR                                */}
          {/* ========================================================================= */}
          {activeTab === "route" && (
            <div className="space-y-5">
              {/* The Unified Route Bar */}
              <form onSubmit={handleSearchRoute}>
                <div className="bg-slate-50/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Origin Input */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                      <AirportInput
                        label="Origin Point"
                        labelClassName="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5"
                        value={fromInput}
                        placeholder="e.g. DEL, Delhi"
                        inputClassName="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent uppercase"
                        onRawChange={(val) => setFromInput(val)}
                        onChange={(res) => setFromInput(res.code)}
                      />
                    </div>

                    {/* Swap Button */}
                    <button
                      type="button"
                      onClick={handleSwapAirports}
                      title="Swap Origin & Destination"
                      className="w-8 h-8 self-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition shrink-0 shadow-2xs"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Destination Input */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                      <AirportInput
                        label="Destination"
                        labelClassName="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mb-0.5"
                        value={toInput}
                        placeholder="e.g. Phu Quoc, PQC, Bali"
                        inputClassName="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent uppercase"
                        onRawChange={(val) => setToInput(val)}
                        onChange={(res) => setToInput(res.code)}
                      />
                    </div>

                    {/* Date Picker */}
                    <div className="w-full sm:w-40 relative">
                      <div className="bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                        <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                          Travel Date
                        </label>
                        <input
                          type="date"
                          value={routeDate}
                          onChange={(e) => setRouteDate(e.target.value)}
                          onClick={(e) => e.currentTarget.showPicker?.()}
                          className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Search Submit Button */}
                    <button
                      type="submit"
                      disabled={routeLoading}
                      className="px-5 py-3 bg-[#091c3e] hover:bg-[#132c5b] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
                    >
                      {routeLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 text-amber-400" />
                          <span>Search Flights</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Popular Route Quick Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-slate-200/80 text-[11px]">
                    <span className="text-slate-400 font-medium">Popular:</span>
                    {POPULAR_ROUTE_AIRPORTS.slice(0, 6).map((air) => (
                      <button
                        key={air.code}
                        type="button"
                        onClick={() => {
                          setToInput(air.code);
                        }}
                        className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium transition text-[10.5px]"
                      >
                        {air.code} ({air.city})
                      </button>
                    ))}
                  </div>
                </div>
              </form>

              {/* Error Message */}
              {routeError && (
                <div className="text-xs p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{routeError}</span>
                </div>
              )}

              {/* Notice if estimated standard timetable */}
              {isEstimatedRoute && routeResults.length > 0 && (
                <div className="text-xs p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Showing carrier schedule on this route. Timings will be verified automatically for {routeDate}.
                  </span>
                </div>
              )}

              {/* Loading Skeletons */}
              {routeLoading && (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 animate-pulse flex items-center justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                        <div className="h-3 w-48 bg-slate-200 rounded" />
                      </div>
                      <div className="h-8 w-24 bg-slate-200 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {/* RESULTS LIST (Direct Non-Stop vs Connecting Flights) */}
              {!routeLoading && hasSearchedRoute && (routeResults.length > 0 || connectingResults.length > 0) && (
                <div className="space-y-3">
                  {/* Results Sub-Bar & Filter Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      {routeResults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRouteViewFilter("direct")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            routeViewFilter === "direct"
                              ? "bg-[#091c3e] text-white shadow-2xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <span>Direct Non-Stop</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              routeViewFilter === "direct"
                                ? "bg-white/20 text-white"
                                : "bg-slate-200 text-slate-800"
                            }`}
                          >
                            {routeResults.length}
                          </span>
                        </button>
                      )}

                      {connectingResults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setRouteViewFilter("connecting")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            routeViewFilter === "connecting"
                              ? "bg-[#091c3e] text-white shadow-2xs"
                              : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <span>Connecting with Layovers</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              routeViewFilter === "connecting"
                                ? "bg-amber-400 text-slate-950"
                                : "bg-amber-200/80 text-amber-950"
                            }`}
                          >
                            {connectingResults.length}
                          </span>
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      Showing routes for {fromInput.toUpperCase()} ➔ {toInput.toUpperCase()}
                    </span>
                  </div>

                  {/* Informative banner if 0 direct flights but connecting flights available */}
                  {routeResults.length === 0 && connectingResults.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">No Direct Non-Stop Flights Available</span>
                        <span className="text-amber-800">
                          No direct carrier operates between <strong>{resolvedFromCity || fromInput}</strong> and <strong>{resolvedToCity || toInput}</strong>. Showing <strong>{connectingResults.length} verified connecting routes</strong> via common hubs below.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* =================================================================== */}
                  {/* 1. DIRECT NON-STOP FLIGHTS LIST (~75px compact rows)                */}
                  {/* =================================================================== */}
                  {routeViewFilter === "direct" && routeResults.length > 0 && (
                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                      {routeResults.map((flight) => (
                        <div
                          key={flight.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* Left: Carrier & Flight # */}
                          <div className="min-w-[150px]">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {flight.airline}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-mono font-bold text-[#091c3e] bg-slate-100 px-1.5 py-0.2 rounded">
                                {flight.flightNumber}
                              </span>
                              {flight.priceFormatted && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  {flight.priceFormatted}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Center: Route Timeline */}
                          <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-start sm:justify-center">
                            <div className="text-right min-w-[65px]">
                              <span className="text-sm font-extrabold text-slate-900 block font-mono">
                                {flight.departureTime}
                              </span>
                              <span className="text-[11px] text-slate-500 font-bold block">
                                {flight.departureCode}
                              </span>
                            </div>

                            <div className="flex flex-col items-center px-2">
                              <span className="text-[10px] text-slate-400 font-semibold mb-0.5">
                                {flight.duration || "Non-stop"}
                              </span>
                              <div className="w-16 sm:w-24 h-px bg-slate-300 relative flex items-center justify-center">
                                <Plane className="w-3 h-3 text-slate-400 absolute rotate-45" />
                              </div>
                              <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                                Non-stop
                              </span>
                            </div>

                            <div className="text-left min-w-[65px]">
                              <span className="text-sm font-extrabold text-slate-900 block font-mono">
                                {flight.arrivalTime}
                              </span>
                              <span className="text-[11px] text-slate-500 font-bold block">
                                {flight.arrivalCode}
                              </span>
                            </div>
                          </div>

                          {/* Right: Select Action */}
                          <button
                            type="button"
                            onClick={() => handleSelectRouteFlight(flight)}
                            className="px-4 py-2 bg-[#091c3e] hover:bg-[#132c5b] text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                          >
                            <span>Add Flight</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* =================================================================== */}
                  {/* 2. CONNECTING FLIGHTS LIST (~80px compact scannable rows)           */}
                  {/* =================================================================== */}
                  {routeViewFilter === "connecting" && connectingResults.length > 0 && (
                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {connectingResults.map((flight) => {
                        const isExpanded = expandedFlightId === flight.id;

                        return (
                          <div
                            key={flight.id}
                            className={`rounded-xl border transition bg-white ${
                              isExpanded
                                ? "border-amber-300 ring-1 ring-amber-300/40 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                            }`}
                          >
                            {/* Main Scannable Row (~80px) */}
                            <div className="p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              {/* Left: Carrier, Code Summary, Stops */}
                              <div className="min-w-[170px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-slate-900 truncate">
                                    {flight.airline}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                    {flight.flightNumberSummary}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                                  <span className="font-semibold text-amber-900 bg-amber-50 px-2 py-0.2 rounded-full border border-amber-200/80">
                                    {flight.stopCount} Stop via {flight.transitHubs}
                                  </span>
                                  {flight.priceFormatted && (
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      {flight.priceFormatted}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Center: Route Timeline with Transit Window */}
                              <div className="flex items-center gap-3 sm:gap-6 flex-1 justify-start md:justify-center">
                                {/* Departure */}
                                <div className="text-right min-w-[65px]">
                                  <span className="text-sm font-extrabold text-slate-900 block font-mono">
                                    {flight.departureTime}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#091c3e] block">
                                    {flight.departureCode}
                                  </span>
                                </div>

                                {/* Center Transit Indicator */}
                                <div className="flex flex-col items-center px-2">
                                  <span className="text-[10px] font-bold text-amber-900 mb-0.5">
                                    {flight.layoverDuration || `Via ${flight.transitHubs}`}
                                  </span>
                                  <div className="w-20 sm:w-28 h-px bg-amber-300 relative flex items-center justify-center">
                                    <Plane className="w-3 h-3 text-amber-600 absolute rotate-45" />
                                  </div>
                                  <span className="text-[9.5px] text-slate-400 mt-0.5 font-medium">
                                    {flight.totalDuration} total
                                  </span>
                                </div>

                                {/* Arrival */}
                                <div className="text-left min-w-[65px]">
                                  <span className="text-sm font-extrabold text-slate-900 block font-mono">
                                    {flight.arrivalTime}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#091c3e] block">
                                    {flight.arrivalCode}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Actions & Expand Button */}
                              <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedFlightId(isExpanded ? null : flight.id)
                                  }
                                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-1 rounded transition flex items-center gap-0.5"
                                  title="View individual flight segments"
                                >
                                  <span>{flight.segments.length} Legs</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>

                                <div className="inline-flex rounded-lg shadow-2xs overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectConnectingBoth(flight)}
                                    className="px-3.5 py-1.5 bg-[#091c3e] hover:bg-[#132c5b] text-white text-xs font-bold transition flex items-center gap-1"
                                    title="Add both flight segments as authentic individual boarding passes"
                                  >
                                    <span>+ Add Both Passes</span>
                                    <ArrowRight className="w-3 h-3 text-amber-400" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectConnectingSingle(flight)}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold border-l border-slate-200 transition"
                                    title="Add as 1 combined ticket in PDF"
                                  >
                                    1 Ticket
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Expandable Segment Timeline Breakdown */}
                            {isExpanded && (
                              <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-2 animate-in fade-in-50 duration-150">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                  Flight Segment Details ({flight.segments.length}):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {flight.segments.map((seg, sIdx) => (
                                    <div
                                      key={seg.id || sIdx}
                                      className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between font-bold text-[11px] text-slate-800">
                                        <span className="text-blue-900">
                                          Leg #{sIdx + 1}: {seg.departureCode} ➔ {seg.arrivalCode}
                                        </span>
                                        <span className="font-mono text-slate-600 text-[10.5px]">
                                          {seg.flightNumber}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                        <span>
                                          {seg.departureTime} – {seg.arrivalTime}
                                        </span>
                                        <span className="text-slate-400 text-[10px]">
                                          {seg.duration}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        {seg.airline} • {seg.departureCity} to {seg.arrivalCity}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Informative state when 0 direct AND 0 connecting flights found */}
              {!routeLoading && hasSearchedRoute && routeResults.length === 0 && connectingResults.length === 0 && !routeError && (
                <div className="text-center py-7 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-6 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800">
                      No Flights Found on {routeDate}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No direct or connecting flights found between <strong>{resolvedFromCity || fromInput}</strong> and <strong>{resolvedToCity || toInput}</strong> on this date.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
                    <span className="font-semibold text-slate-800 block text-[11px]">Recommended options:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>Search through common transit hubs (e.g. Bangkok <code>BKK</code>, Ho Chi Minh <code>SGN</code>, or Hanoi <code>HAN</code>).</li>
                      <li>Switch to the <strong>Flight Number Lookup</strong> tab to enter your confirmed ticket number directly.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Initial empty helper */}
              {!hasSearchedRoute && !routeLoading && (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <Plane className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">
                    Type any city name or airport code (e.g. <em>Phu Quoc</em>, <em>Delhi</em>, <em>Bangkok</em>) to view live carrier schedules and connecting routes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DIRECT FLIGHT NUMBER LOOKUP                                        */}
          {/* ========================================================================= */}
          {activeTab === "number" && (
            <div className="space-y-5">
              <form onSubmit={handleLookupNumber} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Flight Code / Number *
                    </label>
                    <input
                      type="text"
                      value={flightNumberInput}
                      onChange={(e) => setFlightNumberInput(e.target.value.toUpperCase())}
                      placeholder="e.g. 6E 204, AI 101, VJ 972"
                      className="w-full text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none bg-transparent"
                    />
                  </div>

                  <div className="w-full sm:w-44 bg-white rounded-xl border border-slate-200 px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                      Flight Date
                    </label>
                    <input
                      type="date"
                      value={lookupDate}
                      onChange={(e) => setLookupDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full text-xs font-bold text-slate-900 focus:outline-none bg-transparent cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="px-5 py-3 bg-[#091c3e] hover:bg-[#132c5b] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 shrink-0"
                  >
                    {lookupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Fetch Timetable</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick test numbers */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2 mt-2 border-t border-slate-200/80 text-[11px]">
                  <span className="text-slate-400 font-medium">Quick examples:</span>
                  {["6E 204", "AI 101", "VJ 972", "EK 501"].map((fn) => (
                    <button
                      key={fn}
                      type="button"
                      onClick={() => setFlightNumberInput(fn)}
                      className="px-2 py-0.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-mono text-[10.5px] transition"
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </form>

              {/* Lookup Error */}
              {lookupError && (
                <div className="text-xs p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}

              {/* Verified Flight Card Preview */}
              {verifiedFlight && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Official Timetable Verified
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      {verifiedFlight.airline} • {verifiedFlight.flightNumber}
                    </span>
                  </div>

                  {/* Flight Logistics Breakdown */}
                  <div className="grid grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-emerald-200/80">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Departure
                      </span>
                      <span className="text-base font-extrabold text-slate-900 block font-mono">
                        {verifiedFlight.departureTime}
                      </span>
                      <span className="text-xs font-bold text-[#091c3e] block">
                        {verifiedFlight.departureCode} ({verifiedFlight.departureCity})
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {verifiedFlight.departureAirport}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Arrival
                      </span>
                      <span className="text-base font-extrabold text-slate-900 block font-mono">
                        {verifiedFlight.arrivalTime}
                      </span>
                      <span className="text-xs font-bold text-[#091c3e] block">
                        {verifiedFlight.arrivalCode} ({verifiedFlight.arrivalCity})
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {verifiedFlight.arrivalAirport}
                      </span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSelectVerifiedFlight}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5"
                    >
                      <span>
                        {insertAsNew ? "Add as New Flight Leg" : `Apply to Leg #${(targetLegIndex || 0) + 1}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px]">
            {activeTab === "route"
              ? "Connecting flights automatically generate authentic boarding passes with layover calculations."
              : "Direct lookup verifies official airline reservation timetable."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
