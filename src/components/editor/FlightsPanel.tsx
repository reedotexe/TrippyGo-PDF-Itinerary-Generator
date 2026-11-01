"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { FlightLeg, Package, ItineraryDay } from "@/lib/schema/itinerary";
import {
  calculateLayover,
  calculateFlightDuration,
  normalizeFlightLeg,
  groupFlightsByJourney,
  formatFlightRouteSummary,
  FlightJourneyGroup,
  FlightLegEnriched,
  LayoverInfo,
} from "@/lib/flights/journey";
import {
  resolveAirportMetadata,
  resolveAirportCode,
  AIRPORT_CODE_CITIES,
} from "@/lib/flights/airports";
import {
  Plane,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Luggage,
  Briefcase,
  Clock,
  ArrowRight,
  Zap,
  Loader2,
  CheckCircle2,
  Search,
  Calendar,
  PlaneTakeoff,
  PlaneLanding,
  ArrowRightLeft,
  Edit3,
  X,
  Check,
  MoreHorizontal,
} from "lucide-react";
import FlightSearchModal from "./FlightSearchModal";
import AirportInput from "./AirportInput";

interface FlightsPanelProps {
  flights: FlightLeg[];
  packageData: Package;
  days: ItineraryDay[];
  onChange: (updatedFlights: FlightLeg[]) => void;
  reviewFlags?: Array<{ field: string; issue: string; severity: string }>;
}

// Curated popular airlines for Indian & Southeast Asian/Middle Eastern itineraries
export interface AirlineOption {
  name: string;
  code: string;
  country: string;
}

const POPULAR_AIRLINES_DATA: AirlineOption[] = [
  { name: "IndiGo", code: "6E", country: "India" },
  { name: "Air India", code: "AI", country: "India" },
  { name: "Vistara", code: "UK", country: "India" },
  { name: "SpiceJet", code: "SG", country: "India" },
  { name: "VietJet Air", code: "VJ", country: "Vietnam" },
  { name: "Vietnam Airlines", code: "VN", country: "Vietnam" },
  { name: "Thai AirAsia", code: "FD", country: "Thailand" },
  { name: "AirAsia", code: "AK", country: "Malaysia" },
  { name: "Singapore Airlines", code: "SQ", country: "Singapore" },
  { name: "Scoot", code: "TR", country: "Singapore" },
  { name: "Emirates", code: "EK", country: "UAE" },
  { name: "Qatar Airways", code: "QR", country: "Qatar" },
  { name: "Etihad Airways", code: "EY", country: "UAE" },
  { name: "Malaysia Airlines", code: "MH", country: "Malaysia" },
  { name: "Batik Air", code: "OD", country: "Indonesia" },
  { name: "Thai Airways", code: "TG", country: "Thailand" },
  { name: "Flydubai", code: "FZ", country: "UAE" },
  { name: "SriLankan Airlines", code: "UL", country: "Sri Lanka" },
  { name: "Akasa Air", code: "QP", country: "India" },
  { name: "Gulf Air", code: "GF", country: "Bahrain" },
];

const CHECKIN_PRESETS = [
  { value: "20 kg", label: "20 kg (Standard)" },
  { value: "15 kg", label: "15 kg (Domestic)" },
  { value: "25 kg", label: "25 kg" },
  { value: "30 kg", label: "30 kg" },
  { value: "35 kg", label: "35 kg" },
  { value: "No check-in", label: "No check-in baggage" },
];

const CABIN_PRESETS = [
  { value: "7 kg", label: "7 kg (Standard)" },
  { value: "8 kg", label: "8 kg" },
  { value: "10 kg", label: "10 kg" },
  { value: "12 kg", label: "12 kg" },
  { value: "Personal item only", label: "Personal item only (No cabin bag)" },
];

function addHours(timeStr: string, hours: number): string {
  if (!timeStr || !timeStr.includes(":")) return "12:00";
  const [h, m] = timeStr.split(":").map(Number);
  const totalMin = ((h + hours) % 24) * 60 + (m || 0);
  const newH = Math.floor(totalMin / 60);
  const newM = totalMin % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

// ============================================================================
// SUB-COMPONENT: AirlineCombobox (Searchable typeahead with popular suggestions)
// ============================================================================

interface AirlineComboboxProps {
  value: string;
  onChange: (airlineName: string) => void;
  placeholder?: string;
}

function AirlineCombobox({
  value,
  onChange,
  placeholder = "Search airline or IATA code...",
}: AirlineComboboxProps) {
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize when external value changes and not actively typing
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setShowAllSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter airlines based on query
  const filteredAirlines = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || showAllSuggestions) {
      // Show top suggestions when empty or browsing all
      return POPULAR_AIRLINES_DATA;
    }
    const matches = POPULAR_AIRLINES_DATA.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().startsWith(q) ||
        a.country.toLowerCase().includes(q)
    );
    // If only current airline matched or no match, also include top popular carriers
    if (matches.length <= 1 && q === (value || "").toLowerCase()) {
      return POPULAR_AIRLINES_DATA;
    }
    return matches;
  }, [query, showAllSuggestions, value]);

  const handleSelectAirline = (airline: AirlineOption) => {
    setQuery(airline.name);
    onChange(airline.name);
    setIsOpen(false);
    setShowAllSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        setShowAllSuggestions(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredAirlines.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredAirlines.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredAirlines.length) {
        handleSelectAirline(filteredAirlines[highlightedIndex]);
      } else {
        // Keep current custom typed query
        onChange(query);
        setIsOpen(false);
        setShowAllSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowAllSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="airline-options-listbox"
          aria-label="Airline name or IATA code"
          value={query}
          onChange={(e) => {
            const nextVal = e.target.value;
            setQuery(nextVal);
            onChange(nextVal);
            setShowAllSuggestions(false);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
            inputRef.current?.select();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-2.5 pr-8 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400 placeholder:font-normal min-h-[38px]"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle airline list"
          onClick={() => {
            const nextOpen = !isOpen;
            setIsOpen(nextOpen);
            if (nextOpen) {
              setShowAllSuggestions(true);
              inputRef.current?.focus();
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Combobox Dropdown */}
      {isOpen && (
        <div
          id="airline-options-listbox"
          role="listbox"
          aria-label="Matching Airlines"
          className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-xl bg-white shadow-lg border border-slate-200 py-1 z-30 animate-in fade-in-50 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>{query ? "Matching Airlines" : "Popular Carriers"}</span>
            <span className="text-[9px] font-normal lowercase text-slate-400">
              press enter to pick
            </span>
          </div>

          {filteredAirlines.length > 0 ? (
            filteredAirlines.map((airline, idx) => {
              const isSelected =
                airline.name.toLowerCase() === (value || "").toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${airline.code}-${airline.name}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    handleSelectAirline(airline);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between transition ${
                    isHighlighted
                      ? "bg-blue-50 text-blue-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#091c3e] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {airline.code}
                    </span>
                    <span className="font-semibold">{airline.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({airline.country})
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-2.5 text-xs text-slate-500 text-center">
              No matching popular airline found.
              <div className="text-[11px] font-semibold text-[#091c3e] mt-1">
                Using custom: &quot;{query}&quot;
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: BaggageSelect (Clean select dropdown with seamless custom mode)
// ============================================================================

interface BaggageSelectProps {
  value: string;
  onChange: (value: string) => void;
  type: "checkin" | "cabin";
  label: string;
}

function BaggageSelect({ value, onChange, type, label }: BaggageSelectProps) {
  const presets = type === "checkin" ? CHECKIN_PRESETS : CABIN_PRESETS;
  const isPresetValue = presets.some((p) => p.value === value);
  const [isCustom, setIsCustom] = useState(!isPresetValue && Boolean(value));

  // Sync custom state if value changes externally
  useEffect(() => {
    const isPreset = presets.some((p) => p.value === value);
    if (!isPreset && Boolean(value)) {
      setIsCustom(true);
    }
  }, [value, presets]);

  if (isCustom) {
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            {type === "checkin" ? (
              <Luggage className="w-3 h-3 text-slate-500" />
            ) : (
              <Briefcase className="w-3 h-3 text-slate-500" />
            )}
            <span>{label}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange(type === "checkin" ? "20 kg" : "7 kg");
            }}
            className="text-[10px] font-semibold text-blue-700 hover:text-blue-900 underline lowercase"
          >
            use standard presets
          </button>
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              type === "checkin" ? "e.g. 2 x 23 kg or 30 kg" : "e.g. 7 kg + laptop"
            }
            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            autoFocus
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
        {type === "checkin" ? (
          <Luggage className="w-3 h-3 text-slate-500" />
        ) : (
          <Briefcase className="w-3 h-3 text-slate-500" />
        )}
        <span>{label}</span>
      </label>
      <select
        value={value || (type === "checkin" ? "20 kg" : "7 kg")}
        onChange={(e) => {
          if (e.target.value === "__custom__") {
            setIsCustom(true);
          } else {
            setIsCustom(false);
            onChange(e.target.value);
          }
        }}
        className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
      >
        {presets.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        <option value="__custom__">Custom weight...</option>
      </select>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: FlightsPanel
// ============================================================================

export default function FlightsPanel({
  flights = [],
  packageData,
  days,
  onChange,
  reviewFlags = [],
}: FlightsPanelProps) {
  // Index of the leg currently being edited inline (null = all collapsed into compact strips)
  const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null);

  // Expanded advanced details for the active editor (terminal, airport override, layover note)
  const [showAdvancedIndex, setShowAdvancedIndex] = useState<number | null>(null);

  // Live lookup state
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupMessage, setLookupMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Flight Search Modal State
  const [isFlightModalOpen, setIsFlightModalOpen] = useState<boolean>(false);
  const [modalTargetIndex, setModalTargetIndex] = useState<number | null>(null);
  const [modalPreferredDirection, setModalPreferredDirection] = useState<
    "outbound" | "inbound"
  >("outbound");

  // Header and empty-state split action menu toggles
  const [isHeaderAddMenuOpen, setIsHeaderAddMenuOpen] = useState(false);
  const [isEmptyAddMenuOpen, setIsEmptyAddMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const emptyMenuRef = useRef<HTMLDivElement>(null);

  // Outside click handler for add menus
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        headerMenuRef.current &&
        !headerMenuRef.current.contains(e.target as Node)
      ) {
        setIsHeaderAddMenuOpen(false);
      }
      if (
        emptyMenuRef.current &&
        !emptyMenuRef.current.contains(e.target as Node)
      ) {
        setIsEmptyAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group flights into Outbound, Return, and Internal journeys
  const groupedJourneys = useMemo(() => {
    return groupFlightsByJourney(
      flights,
      packageData.destinations,
      packageData.startDate
    );
  }, [flights, packageData.destinations, packageData.startDate]);

  // Destination code helper
  const primaryDestCode = useMemo(() => {
    const dest = packageData.destinations[0] || "Bali";
    const meta = resolveAirportMetadata(dest);
    return meta.code || "DPS";
  }, [packageData.destinations]);

  // Primary origin code helper
  const primaryOriginCode = useMemo(() => {
    if (flights.length > 0 && flights[0].departureCode) {
      return flights[0].departureCode.toUpperCase();
    }
    return "DEL";
  }, [flights]);

  // Update specific fields of a flight leg with auto-derived metadata
  const handleUpdateFlight = useCallback(
    (index: number, patch: Partial<FlightLeg>) => {
      const updated = flights.map((leg, i) => {
        if (i !== index) return leg;

        const merged: Partial<FlightLeg> = { ...leg, ...patch };

        // If departureCode changed, auto-resolve city and airport name if not explicitly overridden
        if (patch.departureCode && patch.departureCode !== leg.departureCode) {
          const meta = resolveAirportMetadata(patch.departureCode);
          if (
            meta.city &&
            (!patch.departureCity || patch.departureCity === leg.departureCity)
          ) {
            merged.departureCity = meta.city;
          }
          if (
            meta.airport &&
            (!patch.departureAirport ||
              patch.departureAirport === leg.departureAirport)
          ) {
            merged.departureAirport = meta.airport;
          }
        }

        // If arrivalCode changed, auto-resolve city and airport name if not explicitly overridden
        if (patch.arrivalCode && patch.arrivalCode !== leg.arrivalCode) {
          const meta = resolveAirportMetadata(patch.arrivalCode);
          if (
            meta.city &&
            (!patch.arrivalCity || patch.arrivalCity === leg.arrivalCity)
          ) {
            merged.arrivalCity = meta.city;
          }
          if (
            meta.airport &&
            (!patch.arrivalAirport ||
              patch.arrivalAirport === leg.arrivalAirport)
          ) {
            merged.arrivalAirport = meta.airport;
          }
        }

        return normalizeFlightLeg(merged, leg.direction);
      });

      onChange(updated);
    },
    [flights, onChange]
  );

  // Add a blank Outbound (Going) flight leg
  const handleAddGoingFlight = () => {
    const destMeta = resolveAirportMetadata(primaryDestCode);
    const originMeta = resolveAirportMetadata(primaryOriginCode);

    const newLeg: FlightLeg = normalizeFlightLeg(
      {
        airline: "IndiGo",
        flightNumber: "",
        date: packageData.startDate || "",
        departureTime: "06:00",
        departureCode: originMeta.code || "DEL",
        departureCity: originMeta.city || "New Delhi",
        departureAirport: originMeta.airport,
        arrivalTime: "11:30",
        arrivalCode: destMeta.code || "DPS",
        arrivalCity: destMeta.city || "Bali",
        arrivalAirport: destMeta.airport,
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "20 kg",
        cabinBaggage: "7 kg",
        direction: "outbound",
      },
      "outbound"
    );

    const updated = [...flights, newLeg];
    onChange(updated);
    setEditingLegIndex(updated.length - 1);
  };

  // Add a blank Return (Inbound) flight leg
  const handleAddReturnFlight = () => {
    const destMeta = resolveAirportMetadata(primaryDestCode);
    const originMeta = resolveAirportMetadata(primaryOriginCode);

    let returnDate = packageData.startDate || "";
    if (packageData.startDate && packageData.nights) {
      const [y, m, d] = packageData.startDate.split("-").map(Number);
      const ret = new Date(y, m - 1, d);
      ret.setDate(ret.getDate() + packageData.nights);
      returnDate = ret.toISOString().split("T")[0];
    }

    const newLeg: FlightLeg = normalizeFlightLeg(
      {
        airline: "Air India",
        flightNumber: "",
        date: returnDate,
        departureTime: "14:00",
        departureCode: destMeta.code || "DPS",
        departureCity: destMeta.city || "Bali",
        departureAirport: destMeta.airport,
        arrivalTime: "20:30",
        arrivalCode: originMeta.code || "DEL",
        arrivalCity: originMeta.city || "New Delhi",
        arrivalAirport: originMeta.airport,
        stops: "Non-stop",
        layover: "",
        checkInBaggage: "20 kg",
        cabinBaggage: "7 kg",
        direction: "inbound",
      },
      "inbound"
    );

    const updated = [...flights, newLeg];
    onChange(updated);
    setEditingLegIndex(updated.length - 1);
  };

  // Add a connecting flight leg directly following a given leg
  const handleAddConnectingLeg = (sourceIndex: number) => {
    const source = flights[sourceIndex];
    if (!source) return;

    const destMeta = resolveAirportMetadata(primaryDestCode);
    const transitMeta = resolveAirportMetadata(source.arrivalCode);

    const isOutbound = (source.direction || "outbound") === "outbound";
    const finalTargetCode = isOutbound
      ? destMeta.code || "DPS"
      : primaryOriginCode;
    const finalTargetMeta = resolveAirportMetadata(finalTargetCode);

    const newLeg: FlightLeg = normalizeFlightLeg(
      {
        airline: source.airline || "IndiGo",
        flightNumber: "",
        date: source.date || packageData.startDate || "",
        departureTime: addHours(source.arrivalTime || "10:00", 2),
        departureCode: transitMeta.code || source.arrivalCode,
        departureCity: transitMeta.city || source.arrivalCity,
        departureAirport: transitMeta.airport || source.arrivalAirport,
        arrivalTime: addHours(source.arrivalTime || "10:00", 6),
        arrivalCode: finalTargetMeta.code,
        arrivalCity: finalTargetMeta.city,
        arrivalAirport: finalTargetMeta.airport,
        stops: "Non-stop",
        layover: "",
        checkInBaggage: source.checkInBaggage || "20 kg",
        cabinBaggage: source.cabinBaggage || "7 kg",
        direction: source.direction || "outbound",
      },
      source.direction
    );

    const updated = [...flights];
    updated.splice(sourceIndex + 1, 0, newLeg);
    onChange(updated);
    setEditingLegIndex(sourceIndex + 1);
  };

  // Auto-Suggest Standard Round-Trip
  const handleSuggestFlights = () => {
    const dest = packageData.destinations[0] || "Vietnam";
    const destMeta = resolveAirportMetadata(dest);
    const originMeta = resolveAirportMetadata("delhi");

    const outboundDate = packageData.startDate || "2026-11-15";
    let returnDate = "2026-11-21";
    if (packageData.startDate && packageData.nights) {
      const [y, m, d] = packageData.startDate.split("-").map(Number);
      const ret = new Date(y, m - 1, d);
      ret.setDate(ret.getDate() + packageData.nights);
      returnDate = ret.toISOString().split("T")[0];
    }

    const isVietnam =
      dest.toLowerCase().includes("vietnam") ||
      destMeta.code === "DAD" ||
      destMeta.code === "HAN" ||
      destMeta.code === "PQC";

    const defaultLegs: FlightLeg[] = [
      normalizeFlightLeg(
        {
          airline: isVietnam ? "VietJet Air" : "IndiGo",
          flightNumber: isVietnam ? "VJ 972" : "6E 2041",
          date: outboundDate,
          departureTime: "08:15",
          departureCode: originMeta.code,
          departureCity: originMeta.city,
          departureAirport: originMeta.airport,
          arrivalTime: isVietnam ? "14:15" : "12:30",
          arrivalCode: destMeta.code,
          arrivalCity: destMeta.city,
          arrivalAirport: destMeta.airport,
          stops: "Non-stop",
          layover: "",
          checkInBaggage: "20 kg",
          cabinBaggage: "7 kg",
          direction: "outbound",
        },
        "outbound"
      ),
      normalizeFlightLeg(
        {
          airline: isVietnam ? "VietJet Air" : "IndiGo",
          flightNumber: isVietnam ? "VJ 971" : "6E 2042",
          date: returnDate,
          departureTime: "16:30",
          departureCode: destMeta.code,
          departureCity: destMeta.city,
          departureAirport: destMeta.airport,
          arrivalTime: isVietnam ? "20:50" : "20:00",
          arrivalCode: originMeta.code,
          arrivalCity: originMeta.city,
          arrivalAirport: originMeta.airport,
          stops: "Non-stop",
          layover: "",
          checkInBaggage: "20 kg",
          cabinBaggage: "7 kg",
          direction: "inbound",
        },
        "inbound"
      ),
    ];

    onChange(defaultLegs);
    setEditingLegIndex(null);
  };

  // Duplicate a flight leg (as return leg)
  const handleDuplicateFlight = (index: number) => {
    const source = flights[index];
    if (!source) return;

    const newDir = source.direction === "outbound" ? "inbound" : "outbound";
    const cloned: FlightLeg = normalizeFlightLeg(
      {
        ...source,
        id: "fl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        departureCode: source.arrivalCode,
        departureCity: source.arrivalCity,
        departureAirport: source.arrivalAirport,
        arrivalCode: source.departureCode,
        arrivalCity: source.departureCity,
        arrivalAirport: source.departureAirport,
        flightNumber: source.flightNumber ? `${source.flightNumber}-R` : "",
        direction: newDir,
      },
      newDir
    );

    const updated = [...flights];
    updated.splice(index + 1, 0, cloned);
    onChange(updated);
    setEditingLegIndex(index + 1);
  };

  // Delete a flight leg
  const handleDeleteFlight = (index: number) => {
    const updated = flights.filter((_, i) => i !== index);
    onChange(updated);
    if (editingLegIndex === index) {
      setEditingLegIndex(null);
    } else if (editingLegIndex !== null && editingLegIndex > index) {
      setEditingLegIndex(editingLegIndex - 1);
    }
  };

  // Re-order flight legs
  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= flights.length) return;
    const updated = [...flights];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    onChange(updated);
    if (editingLegIndex === index) setEditingLegIndex(target);
    else if (editingLegIndex === target) setEditingLegIndex(index);
  };

  // Clear all flights
  const handleClearAll = () => {
    onChange([]);
    setEditingLegIndex(null);
  };

  // Fetch real-time flight details via /api/flights/lookup
  const handleLookupFlight = async (index: number) => {
    const leg = flights[index];
    if (!leg) return;
    const num = (leg.flightNumber || "").trim();
    if (!num) {
      setLookupMessage({
        type: "warning",
        text: "Please enter a flight number first (e.g. 6E 204, AI 101, VJ 972).",
      });
      return;
    }

    setLookupLoading(true);
    setLookupMessage(null);

    try {
      const dateParam = leg.date || packageData.startDate || "";
      const res = await fetch(
        `/api/flights/lookup?flight=${encodeURIComponent(num)}&date=${encodeURIComponent(
          dateParam
        )}`
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        setLookupMessage({
          type: "error",
          text: data.error || `Could not find schedule for flight ${num}.`,
        });
        return;
      }

      handleUpdateFlight(index, {
        airline: data.airline || leg.airline,
        departureTime: data.departureTime || leg.departureTime,
        departureCode: data.departureCode || leg.departureCode,
        departureCity: data.departureCity || leg.departureCity,
        departureAirport: data.departureAirport || leg.departureAirport,
        arrivalTime: data.arrivalTime || leg.arrivalTime,
        arrivalCode: data.arrivalCode || leg.arrivalCode,
        arrivalCity: data.arrivalCity || leg.arrivalCity,
        arrivalAirport: data.arrivalAirport || leg.arrivalAirport,
      });

      setLookupMessage({
        type: "success",
        text: `Verified ${data.airline || num} schedule: ${data.departureCode} ➔ ${data.arrivalCode}`,
      });

      setTimeout(() => setLookupMessage(null), 5000);
    } catch {
      setLookupMessage({
        type: "error",
        text: "Failed to connect to flight lookup service.",
      });
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle modal flight application
  const handleApplyModalFlight = (
    flightData: Partial<FlightLeg> | Partial<FlightLeg>[],
    isNewLeg: boolean
  ) => {
    const rawItems = Array.isArray(flightData) ? flightData : [flightData];
    if (rawItems.length === 0) return;

    const newLegs: FlightLeg[] = rawItems.map((f, i) =>
      normalizeFlightLeg(
        {
          id:
            "fl_" +
            Date.now() +
            "_" +
            i +
            "_" +
            Math.random().toString(36).slice(2, 6),
          airline: f.airline || "IndiGo",
          flightNumber: f.flightNumber || "",
          date: f.date || packageData.startDate || "",
          departureTime: f.departureTime || "08:00",
          departureCode: f.departureCode || "DEL",
          departureCity: f.departureCity || "New Delhi",
          departureAirport: f.departureAirport || "",
          arrivalTime: f.arrivalTime || "10:30",
          arrivalCode: f.arrivalCode || "BOM",
          arrivalCity: f.arrivalCity || "Mumbai",
          arrivalAirport: f.arrivalAirport || "",
          stops: f.stops || "Non-stop",
          layover: f.layover || "",
          checkInBaggage: f.checkInBaggage || "20 kg",
          cabinBaggage: f.cabinBaggage || "7 kg",
          direction: f.direction || modalPreferredDirection,
          journeyTitle: f.journeyTitle || "",
        },
        f.direction || modalPreferredDirection
      )
    );

    if (isNewLeg || modalTargetIndex === null || !flights[modalTargetIndex]) {
      const updated = [...flights, ...newLegs];
      onChange(updated);
      setEditingLegIndex(null);
    } else {
      if (newLegs.length === 1) {
        handleUpdateFlight(modalTargetIndex, rawItems[0]);
      } else {
        const updated = [...flights];
        updated.splice(modalTargetIndex, 1, ...newLegs);
        onChange(updated);
        setEditingLegIndex(null);
      }
    }
  };

  // Helper to find original index of a leg
  const getLegIndex = (leg: FlightLeg | FlightLegEnriched): number => {
    if (
      "originalIndex" in leg &&
      typeof leg.originalIndex === "number" &&
      leg.originalIndex >= 0 &&
      leg.originalIndex < flights.length
    ) {
      return leg.originalIndex;
    }
    const idxById = flights.findIndex((f) => f.id && leg.id && f.id === leg.id);
    if (idxById !== -1) return idxById;
    const matchIdx = flights.findIndex(
      (f) =>
        f.flightNumber === leg.flightNumber &&
        f.departureCode === leg.departureCode &&
        f.departureTime === leg.departureTime
    );
    return matchIdx !== -1 ? matchIdx : 0;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 font-body">
      {/* 1. MAIN HEADER & CONSOLIDATED ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-[#091c3e] text-white shadow-2xs">
              <Plane className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Travel Flights & Boarding Passes
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {flights.length === 0
                    ? "Land-Only Package"
                    : `${flights.length} Flight Sector${
                        flights.length > 1 ? "s" : ""
                      }`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configured flights render as authentic boarding passes on Page 3
                of the client proposal.
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Header Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Unified Primary Add Flight CTA with Split Dropdown */}
          <div ref={headerMenuRef} className="relative inline-flex shadow-sm rounded-lg">
            <button
              type="button"
              onClick={handleAddGoingFlight}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] rounded-l-lg transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Flight</span>
            </button>
            <button
              type="button"
              onClick={() => setIsHeaderAddMenuOpen((prev) => !prev)}
              aria-label="Flight creation options"
              className="px-2 py-2 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] border-l border-white/20 rounded-r-lg transition"
            >
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {isHeaderAddMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-left animate-in fade-in-50 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderAddMenuOpen(false);
                    handleAddGoingFlight();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <PlaneTakeoff className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Outbound (Onward) Sector</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderAddMenuOpen(false);
                    handleAddReturnFlight();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <PlaneLanding className="w-3.5 h-3.5 text-[#c92229]" />
                  <span>+ Return (Inbound) Sector</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderAddMenuOpen(false);
                    setModalTargetIndex(null);
                    setModalPreferredDirection("outbound");
                    setIsFlightModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Search Live Flight Database</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderAddMenuOpen(false);
                    handleSuggestFlights();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50/70 flex items-center gap-2 border-t border-slate-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Suggest Round-Trip</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Auto-Suggest Shortcut */}
          <button
            type="button"
            onClick={handleSuggestFlights}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition flex items-center gap-1.5 shadow-2xs"
            title="Auto-generate standard round-trip flights for this destination"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Auto-Suggest</span>
          </button>

          {flights.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleClearAll();
              }}
              aria-label="Clear all flights"
              title="Clear all flights"
              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition border border-transparent hover:border-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. UNIFIED EMPTY STATE (Single prominent hero CTA with split auto-suggest) */}
      {flights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/60">
          <div className="w-12 h-12 rounded-xl bg-[#091c3e]/5 text-[#091c3e] border border-[#091c3e]/10 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Plane className="w-6 h-6 text-[#091c3e]" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            No Flights Configured (Land-Only Itinerary)
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
            This proposal currently includes land arrangements only. Add flight
            sectors to generate verified boarding passes and transit schedules
            for the client proposal.
          </p>

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            {/* Unified Primary Hero CTA */}
            <div ref={emptyMenuRef} className="relative inline-flex shadow-sm rounded-lg">
              <button
                type="button"
                onClick={handleAddGoingFlight}
                className="px-4 py-2 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] rounded-l-lg transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Add Flight</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEmptyAddMenuOpen((prev) => !prev)}
                aria-label="Flight creation options"
                className="px-2 py-2 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] border-l border-white/20 rounded-r-lg transition"
              >
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {isEmptyAddMenuOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 text-left animate-in fade-in-50 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmptyAddMenuOpen(false);
                      handleAddGoingFlight();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <PlaneTakeoff className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Outbound (Onward) Sector</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmptyAddMenuOpen(false);
                      handleAddReturnFlight();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <PlaneLanding className="w-3.5 h-3.5 text-[#c92229]" />
                    <span>+ Return (Inbound) Sector</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmptyAddMenuOpen(false);
                      setModalTargetIndex(null);
                      setModalPreferredDirection("outbound");
                      setIsFlightModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span>Search Live Flight Database</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmptyAddMenuOpen(false);
                      handleSuggestFlights();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50/70 flex items-center gap-2 border-t border-slate-100"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Auto-Suggest Round-Trip</span>
                  </button>
                </div>
              )}
            </div>

            {/* Split Auto-Suggest Button */}
            <button
              type="button"
              onClick={handleSuggestFlights}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Auto-Suggest Round-Trip</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. JOURNEY-FIRST SECTIONS (Outbound, Return, Internal) */
        <div className="space-y-6">
          {/* Status Message Pill */}
          {lookupMessage && (
            <div
              className={`text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                lookupMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : lookupMessage.type === "error"
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {lookupMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span className="font-medium">{lookupMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setLookupMessage(null)}
                className="text-xs opacity-60 hover:opacity-100 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* 3A. OUTBOUND JOURNEY SECTION */}
          <JourneySection
            title="Onward Journey (Going Flights)"
            direction="outbound"
            routeSummary={groupedJourneys.summary.outboundRoute}
            journeyGroups={groupedJourneys.outbound}
            onAddSector={handleAddGoingFlight}
            onAddConnecting={handleAddConnectingLeg}
            onEditLeg={(idx) => setEditingLegIndex(idx)}
            editingLegIndex={editingLegIndex}
            onCloseEdit={() => setEditingLegIndex(null)}
            onUpdateLeg={handleUpdateFlight}
            onDeleteLeg={handleDeleteFlight}
            onDuplicateLeg={handleDuplicateFlight}
            onMoveLeg={handleMove}
            onLookup={handleLookupFlight}
            lookupLoading={lookupLoading}
            lookupMessage={lookupMessage}
            showAdvancedIndex={showAdvancedIndex}
            setShowAdvancedIndex={setShowAdvancedIndex}
            totalLegsCount={flights.length}
            getLegIndex={getLegIndex}
          />

          {/* 3B. RETURN JOURNEY SECTION */}
          <JourneySection
            title="Return Journey (Returning Flights)"
            direction="inbound"
            routeSummary={groupedJourneys.summary.returnRoute}
            journeyGroups={groupedJourneys.inbound}
            onAddSector={handleAddReturnFlight}
            onAddConnecting={handleAddConnectingLeg}
            onEditLeg={(idx) => setEditingLegIndex(idx)}
            editingLegIndex={editingLegIndex}
            onCloseEdit={() => setEditingLegIndex(null)}
            onUpdateLeg={handleUpdateFlight}
            onDeleteLeg={handleDeleteFlight}
            onDuplicateLeg={handleDuplicateFlight}
            onMoveLeg={handleMove}
            onLookup={handleLookupFlight}
            lookupLoading={lookupLoading}
            lookupMessage={lookupMessage}
            showAdvancedIndex={showAdvancedIndex}
            setShowAdvancedIndex={setShowAdvancedIndex}
            totalLegsCount={flights.length}
            getLegIndex={getLegIndex}
          />

          {/* 3C. INTERNAL / INTER-CITY JOURNEYS (if any) */}
          {groupedJourneys.internal.length > 0 && (
            <JourneySection
              title="Inter-City / Domestic Connections"
              direction="internal"
              routeSummary=""
              journeyGroups={groupedJourneys.internal}
              onAddSector={handleAddGoingFlight}
              onAddConnecting={handleAddConnectingLeg}
              onEditLeg={(idx) => setEditingLegIndex(idx)}
              editingLegIndex={editingLegIndex}
              onCloseEdit={() => setEditingLegIndex(null)}
              onUpdateLeg={handleUpdateFlight}
              onDeleteLeg={handleDeleteFlight}
              onDuplicateLeg={handleDuplicateFlight}
              onMoveLeg={handleMove}
              onLookup={handleLookupFlight}
              lookupLoading={lookupLoading}
              lookupMessage={lookupMessage}
              showAdvancedIndex={showAdvancedIndex}
              setShowAdvancedIndex={setShowAdvancedIndex}
              totalLegsCount={flights.length}
              getLegIndex={getLegIndex}
            />
          )}
        </div>
      )}

      {/* Flight Search & Lookup Modal */}
      <FlightSearchModal
        isOpen={isFlightModalOpen}
        onClose={() => setIsFlightModalOpen(false)}
        targetLegIndex={modalTargetIndex}
        currentLeg={
          modalTargetIndex !== null ? flights[modalTargetIndex] : undefined
        }
        packageData={packageData}
        onApplyFlight={handleApplyModalFlight}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: JourneySection (Outbound or Return)
// ============================================================================

interface JourneySectionProps {
  title: string;
  direction: "outbound" | "inbound" | "internal";
  routeSummary: string;
  journeyGroups: FlightJourneyGroup[];
  onAddSector: () => void;
  onAddConnecting: (index: number) => void;
  onEditLeg: (index: number) => void;
  editingLegIndex: number | null;
  onCloseEdit: () => void;
  onUpdateLeg: (index: number, patch: Partial<FlightLeg>) => void;
  onDeleteLeg: (index: number) => void;
  onDuplicateLeg: (index: number) => void;
  onMoveLeg: (index: number, direction: "up" | "down") => void;
  onLookup: (index: number) => void;
  lookupLoading: boolean;
  lookupMessage?: { type: "success" | "error" | "warning"; text: string } | null;
  showAdvancedIndex: number | null;
  setShowAdvancedIndex: (index: number | null) => void;
  totalLegsCount: number;
  getLegIndex: (leg: FlightLeg) => number;
}

function JourneySection({
  title,
  direction,
  routeSummary,
  journeyGroups,
  onAddSector,
  onAddConnecting,
  onEditLeg,
  editingLegIndex,
  onCloseEdit,
  onUpdateLeg,
  onDeleteLeg,
  onDuplicateLeg,
  onMoveLeg,
  onLookup,
  lookupLoading,
  lookupMessage,
  showAdvancedIndex,
  setShowAdvancedIndex,
  totalLegsCount,
  getLegIndex,
}: JourneySectionProps) {
  const isOutbound = direction === "outbound";
  const isInbound = direction === "inbound";

  const allLegsInJourney = useMemo(() => {
    return journeyGroups.flatMap((j) => j.legs);
  }, [journeyGroups]);

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${
              isOutbound
                ? "bg-[#091c3e]"
                : isInbound
                ? "bg-[#c92229]"
                : "bg-slate-700"
            }`}
          >
            {isOutbound ? (
              <PlaneTakeoff className="w-3.5 h-3.5 text-amber-400" />
            ) : isInbound ? (
              <PlaneLanding className="w-3.5 h-3.5 text-white" />
            ) : (
              <Plane className="w-3.5 h-3.5 text-white" />
            )}
          </span>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {title}
          </span>
          {routeSummary && (
            <span className="text-[11px] font-medium text-slate-500 hidden md:inline">
              • {routeSummary}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onAddSector}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
            isOutbound
              ? "text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200"
              : "text-[#c92229] bg-red-50 hover:bg-red-100 border border-red-200"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Sector</span>
        </button>
      </div>

      {/* Empty State within Journey */}
      {allLegsInJourney.length === 0 ? (
        <div className="py-4 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-center text-xs text-slate-500 flex items-center justify-between">
          <span>No {direction} flight legs added yet.</span>
          <button
            type="button"
            onClick={onAddSector}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
          >
            + Add first {direction} leg
          </button>
        </div>
      ) : (
        /* Journey Flight Strips & Architectural Layovers */
        <div className="space-y-2.5">
          {allLegsInJourney.map((leg, legSeq) => {
            const globalIndex = getLegIndex(leg);
            const isEditing = editingLegIndex === globalIndex;
            const nextLeg =
              legSeq < allLegsInJourney.length - 1
                ? allLegsInJourney[legSeq + 1]
                : null;
            const layover = nextLeg ? calculateLayover(leg, nextLeg) : null;

            return (
              <React.Fragment key={leg.id || globalIndex}>
                {/* Sleek 44px Horizontal Collapsed Flight Strip */}
                <div
                  onClick={() => onEditLeg(globalIndex)}
                  className={`group relative rounded-xl border transition cursor-pointer px-3.5 py-2.5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isEditing
                      ? "border-[#091c3e] ring-2 ring-[#091c3e]/15 shadow-sm bg-blue-50/10"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs"
                  }`}
                >
                  {/* Left: Sequence badge, Carrier & Flight Number, Date */}
                  <div className="flex items-center gap-2.5 shrink-0 min-w-[210px]">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-[11px] shrink-0 ${
                        isOutbound
                          ? "bg-blue-50 text-blue-900 border border-blue-200"
                          : "bg-red-50 text-[#c92229] border border-red-200"
                      }`}
                    >
                      #{legSeq + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {leg.airline}
                        </span>
                        {leg.flightNumber && (
                          <span className="text-[11px] font-mono font-bold text-[#091c3e] bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded">
                            {leg.flightNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{leg.date || "Date flexible"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Departure time/code ── Duration/stops ──► Arrival code/time */}
                  <div className="flex-1 flex items-center justify-center gap-3 px-2">
                    {/* Departure */}
                    <div className="flex items-center gap-1.5 min-w-[75px] justify-end">
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {leg.departureTime || "08:00"}
                      </span>
                      <span className="font-mono font-bold text-[11px] text-[#091c3e] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                        {leg.departureCode}
                      </span>
                    </div>

                    {/* Flight Duration & Transit Connector */}
                    <div className="flex flex-col items-center px-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mb-0.5">
                        {leg.flightDuration || leg.stops}
                      </span>
                      <div className="flex items-center w-16 sm:w-24">
                        <div className="h-[1.5px] bg-slate-300 flex-1 relative">
                          <div className="absolute right-0 top-[-2.5px] w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-slate-400"></div>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                        {leg.stops}
                      </span>
                    </div>

                    {/* Arrival */}
                    <div className="flex items-center gap-1.5 min-w-[75px]">
                      <span className="font-mono font-bold text-[11px] text-[#091c3e] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                        {leg.arrivalCode}
                      </span>
                      <span className="font-mono text-xs font-extrabold text-slate-900">
                        {leg.arrivalTime || "12:00"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Baggage, Quick Edit, + Layover, Reorder & Delete */}
                  <div
                    className="flex items-center justify-between md:justify-end gap-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 px-2 py-0.5 rounded bg-slate-50 border border-slate-200/60 mr-1">
                      <Luggage className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold">
                        {leg.checkInBaggage || "20 kg"}
                      </span>
                    </div>

                    {/* Edit Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onEditLeg(globalIndex)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                        isEditing
                          ? "bg-[#091c3e] text-white"
                          : "text-slate-700 bg-slate-100 hover:bg-slate-200"
                      }`}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? "Editing" : "Edit"}</span>
                    </button>

                    {/* + Layover Button */}
                    <button
                      type="button"
                      onClick={() => onAddConnecting(globalIndex)}
                      className="px-2 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition flex items-center gap-1"
                      title={`Add layover / connecting leg from ${leg.arrivalCode}`}
                    >
                      <Plus className="w-3 h-3 text-amber-600" />
                      <span>+ Layover</span>
                    </button>

                    {/* Reorder and Delete controls */}
                    <div className="flex items-center pl-1 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => onMoveLeg(globalIndex, "up")}
                        disabled={globalIndex === 0}
                        aria-label="Move flight sector up"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveLeg(globalIndex, "down")}
                        disabled={globalIndex === totalLegsCount - 1}
                        aria-label="Move flight sector down"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onDeleteLeg(globalIndex);
                        }}
                        aria-label="Delete flight sector"
                        className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition ml-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Progressive Disclosure Editor (When this leg is active) */}
                {isEditing && (
                  <InlineFlightEditor
                    leg={leg}
                    index={globalIndex}
                    onUpdate={(patch) => onUpdateLeg(globalIndex, patch)}
                    onClose={onCloseEdit}
                    onDuplicate={() => onDuplicateLeg(globalIndex)}
                    onDelete={() => onDeleteLeg(globalIndex)}
                    onAddConnecting={() => onAddConnecting(globalIndex)}
                    onLookup={() => onLookup(globalIndex)}
                    lookupLoading={lookupLoading}
                    lookupMessage={lookupMessage}
                    showAdvanced={showAdvancedIndex === globalIndex}
                    onToggleAdvanced={() =>
                      setShowAdvancedIndex(
                        showAdvancedIndex === globalIndex ? null : globalIndex
                      )
                    }
                  />
                )}

                {/* Architectural Layover Connector Bridge */}
                {layover && (
                  <div className="relative pl-7 py-1 flex items-center">
                    {/* Connecting Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-amber-300"></div>
                    <div className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-50/90 border border-amber-200/80 text-[11px] shadow-2xs">
                      <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="font-bold text-amber-950">
                        {layover.durationFormatted} layover in{" "}
                        {layover.airportCity} ({layover.airportCode})
                      </span>
                      <span className="text-amber-800 hidden sm:inline">
                        • {layover.transitNote}
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: InlineFlightEditor (Equipped with Combobox & BaggageSelect)
// ============================================================================

interface InlineFlightEditorProps {
  leg: FlightLegEnriched;
  index: number;
  onUpdate: (patch: Partial<FlightLeg>) => void;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddConnecting: () => void;
  onLookup: () => void;
  lookupLoading: boolean;
  lookupMessage?: { type: "success" | "error" | "warning"; text: string } | null;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

function InlineFlightEditor({
  leg,
  index,
  onUpdate,
  onClose,
  onDuplicate,
  onDelete,
  onAddConnecting,
  onLookup,
  lookupLoading,
  lookupMessage,
  showAdvanced,
  onToggleAdvanced,
}: InlineFlightEditorProps) {
  // Proactive flight number pattern detection (e.g. 6E 204, AI 101, VJ 972)
  const isFlightNumPattern = /^[a-zA-Z0-9]{2,3}\s*\d{1,4}[a-zA-Z]?$/.test(
    (leg.flightNumber || "").trim()
  );

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-4 space-y-4 shadow-sm animate-in fade-in-50 duration-150">
      {/* Editor Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded bg-[#091c3e] text-white">
            Sector #{index + 1}
          </span>
          <span className="text-xs font-bold text-slate-800">
            {leg.departureCode} ➔ {leg.arrivalCode} (
            {leg.direction === "outbound" ? "Outbound" : "Return"})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] rounded-lg transition flex items-center gap-1 shadow-2xs"
          >
            <Check className="w-3.5 h-3.5 text-amber-400" />
            <span>Done Editing</span>
          </button>
        </div>
      </div>

      {/* Row 1: Searchable Airline Combobox, Flight Number, Travel Date, Direction */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Searchable Airline Combobox */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Airline *
          </label>
          <AirlineCombobox
            value={leg.airline}
            onChange={(airlineName) => onUpdate({ airline: airlineName })}
          />
        </div>

        {/* Flight Number with Auto-Fill */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Flight Number
            </label>
            <button
              type="button"
              onClick={onLookup}
              disabled={lookupLoading || !leg.flightNumber?.trim()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-800 disabled:opacity-40 transition"
              title="Fetch live flight timings"
            >
              {lookupLoading ? (
                <>
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Auto-Fill</span>
                </>
              )}
            </button>
          </div>
          <input
            type="text"
            value={leg.flightNumber || ""}
            onChange={(e) =>
              onUpdate({ flightNumber: e.target.value.toUpperCase() })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onLookup();
              }
            }}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white uppercase"
            placeholder="e.g. VJ 972"
          />
          {isFlightNumPattern && !lookupLoading && (
            <button
              type="button"
              onClick={onLookup}
              className="mt-1 w-full text-[10px] font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded px-1.5 py-0.5 flex items-center justify-center gap-1 transition"
            >
              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              <span>Press Enter to fetch live schedule</span>
            </button>
          )}
          {lookupMessage && (
            <div
              className={`mt-1 text-[10px] px-2 py-0.5 rounded font-semibold ${
                lookupMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {lookupMessage.text}
            </div>
          )}
        </div>

        {/* Travel Date */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Travel Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={leg.date || ""}
              onChange={(e) => onUpdate({ date: e.target.value })}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full pl-2.5 pr-7 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Journey Direction */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Direction
          </label>
          <select
            value={leg.direction || "outbound"}
            onChange={(e) =>
              onUpdate({
                direction: e.target.value as "outbound" | "inbound" | "internal",
              })
            }
            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="outbound">Going (Outbound)</option>
            <option value="inbound">Return (Inbound)</option>
            <option value="internal">Inter-City / Domestic</option>
          </select>
        </div>
      </div>

      {/* Row 2: Departure & Arrival (With Auto-Derived Airport Metadata) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Departure Box */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <PlaneTakeoff className="w-3 h-3 text-blue-600" /> Departure Point
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <AirportInput
                label="Airport / City *"
                value={leg.departureCode}
                cityName={leg.departureCity}
                airportName={leg.departureAirport}
                placeholder="DEL or Delhi"
                onChange={(airport) => {
                  onUpdate({
                    departureCode: airport.code,
                    departureCity: airport.city,
                    departureAirport: airport.airport,
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Departure Time *
              </label>
              <input
                type="text"
                value={leg.departureTime}
                onChange={(e) => onUpdate({ departureTime: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                placeholder="00:05"
              />
            </div>
          </div>
          {/* Reassuring Auto-Resolved City & Airport Label */}
          <div className="text-[11px] text-slate-600 font-medium truncate">
            📍{" "}
            <span className="font-semibold text-slate-800">
              {leg.departureCity || leg.departureCode}
            </span>
            {leg.departureAirport && (
              <span className="text-slate-400"> • {leg.departureAirport}</span>
            )}
          </div>
        </div>

        {/* Arrival Box */}
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <PlaneLanding className="w-3 h-3 text-blue-600" /> Arrival
            Destination
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <AirportInput
                label="Airport / City *"
                value={leg.arrivalCode}
                cityName={leg.arrivalCity}
                airportName={leg.arrivalAirport}
                placeholder="HAN or Hanoi"
                onChange={(airport) => {
                  onUpdate({
                    arrivalCode: airport.code,
                    arrivalCity: airport.city,
                    arrivalAirport: airport.airport,
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Arrival Time *
              </label>
              <input
                type="text"
                value={leg.arrivalTime}
                onChange={(e) => onUpdate({ arrivalTime: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
                placeholder="05:35"
              />
            </div>
          </div>
          {/* Reassuring Auto-Resolved City & Airport Label */}
          <div className="text-[11px] text-slate-600 font-medium truncate">
            📍{" "}
            <span className="font-semibold text-slate-800">
              {leg.arrivalCity || leg.arrivalCode}
            </span>
            {leg.arrivalAirport && (
              <span className="text-slate-400"> • {leg.arrivalAirport}</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Clean Baggage Select Dropdowns & Stops */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Check-in Baggage Select */}
        <BaggageSelect
          label="Check-in Baggage"
          type="checkin"
          value={leg.checkInBaggage || "20 kg"}
          onChange={(val) => onUpdate({ checkInBaggage: val })}
        />

        {/* Cabin Baggage Select */}
        <BaggageSelect
          label="Cabin Baggage"
          type="cabin"
          value={leg.cabinBaggage || "7 kg"}
          onChange={(val) => onUpdate({ cabinBaggage: val })}
        />

        {/* Stops & Advanced Toggle */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Flight Stops
          </label>
          <select
            value={leg.stops}
            onChange={(e) => onUpdate({ stops: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold cursor-pointer"
          >
            <option value="Non-stop">Non-stop</option>
            <option value="1 Stop">1 Stop</option>
            <option value="2 Stops">2 Stops</option>
          </select>
          <button
            type="button"
            onClick={onToggleAdvanced}
            className="text-[10px] text-blue-700 hover:text-blue-800 font-semibold mt-1 flex items-center gap-0.5"
          >
            <MoreHorizontal className="w-3 h-3" />
            <span>
              {showAdvanced ? "Hide Advanced Options" : "+ Advanced Details"}
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Advanced Details (Manual Airport Override & Notes) */}
      {showAdvanced && (
        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 animate-in fade-in-50 duration-150">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 block">
            Advanced Field Overrides
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Departure City Name Override
              </label>
              <input
                type="text"
                value={leg.departureCity}
                onChange={(e) => onUpdate({ departureCity: e.target.value })}
                className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                placeholder="New Delhi"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Arrival City Name Override
              </label>
              <input
                type="text"
                value={leg.arrivalCity}
                onChange={(e) => onUpdate({ arrivalCity: e.target.value })}
                className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                placeholder="Hanoi"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Departure Full Airport Name
              </label>
              <input
                type="text"
                value={leg.departureAirport || ""}
                onChange={(e) => onUpdate({ departureAirport: e.target.value })}
                className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                placeholder="Indira Gandhi International Airport"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
                Arrival Full Airport Name
              </label>
              <input
                type="text"
                value={leg.arrivalAirport || ""}
                onChange={(e) => onUpdate({ arrivalAirport: e.target.value })}
                className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                placeholder="Noi Bai International Airport"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-medium text-slate-600 mb-0.5">
              Custom Transit / Layover Note (Optional)
            </label>
            <input
              type="text"
              value={leg.layover || ""}
              onChange={(e) => onUpdate({ layover: e.target.value })}
              className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
              placeholder="e.g. 4h 35m transit connection • terminal transfer required"
            />
          </div>
        </div>
      )}

      {/* Editor Footer Actions: Single consolidated connection button + secondary controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fix 3.4: Consolidated connection addition */}
          <button
            type="button"
            onClick={onAddConnecting}
            className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition flex items-center gap-1 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-amber-700" />
            <span>+ Add Layover / Connecting Leg from {leg.arrivalCode}</span>
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition flex items-center gap-1"
            title="Create reverse return flight"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
            <span>Create Return Leg</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Sector</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#091c3e] hover:bg-[#132c5b] rounded-lg transition shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
