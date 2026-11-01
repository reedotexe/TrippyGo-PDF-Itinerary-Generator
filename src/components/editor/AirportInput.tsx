"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AIRPORT_CODE_CITIES, resolveAirportMetadata, resolveAirportCode } from "@/lib/flights/airports";
import { Plane, MapPin, Check } from "lucide-react";

export interface AirportOption {
  code: string;
  city: string;
  airport: string;
  country?: string;
}

export interface AirportInputProps {
  value: string;
  cityName?: string;
  airportName?: string;
  label?: string;
  labelClassName?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (airport: { code: string; city: string; airport: string }) => void;
  onRawChange?: (raw: string) => void;
}

export default function AirportInput({
  value,
  cityName,
  airportName,
  label,
  labelClassName,
  placeholder = "e.g. DEL, Phu Quoc, Bali",
  className = "",
  inputClassName,
  required = false,
  disabled = false,
  autoFocus = false,
  onChange,
  onRawChange,
}: AirportInputProps) {
  // Current text in the input
  const [inputText, setInputText] = useState<string>(value || "");

  // Suggestions state
  const [suggestions, setSuggestions] = useState<AirportOption[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const remoteDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input text when value prop changes externally
  useEffect(() => {
    if (value && value !== inputText && !isFocused) {
      setInputText(value);
    }
  }, [value, isFocused]);

  // Synchronous local dictionary search (instant 0ms feedback)
  const getLocalSuggestions = useCallback((query: string): AirportOption[] => {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    const matches: AirportOption[] = [];
    const upper = clean.toUpperCase();

    // Exact IATA match first
    if (AIRPORT_CODE_CITIES[upper]) {
      const item = AIRPORT_CODE_CITIES[upper];
      matches.push({
        code: item.code,
        city: item.city,
        airport: item.airport,
      });
    }

    // Match by code, city, airport name, or aliases
    for (const [code, item] of Object.entries(AIRPORT_CODE_CITIES)) {
      if (code === upper) continue; // already added
      const codeMatches = code.toLowerCase().startsWith(clean);
      const cityMatches = item.city.toLowerCase().includes(clean);
      const airportMatches = item.airport.toLowerCase().includes(clean);
      const aliasMatches = item.aliases.some((a) => a.toLowerCase().includes(clean));

      if (codeMatches || cityMatches || airportMatches || aliasMatches) {
        matches.push({
          code: item.code,
          city: item.city,
          airport: item.airport,
        });
      }
      if (matches.length >= 8) break;
    }

    return matches;
  }, []);

  // Handle user input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputText(rawVal);
    onRawChange?.(rawVal);
    setHighlightedIndex(-1);

    if (!rawVal.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // 1. Instant local search
    const local = getLocalSuggestions(rawVal);
    setSuggestions(local);
    setIsOpen(local.length > 0);

    // 2. Debounced remote query if query is 2+ chars
    if (remoteDebounceRef.current) clearTimeout(remoteDebounceRef.current);
    if (rawVal.trim().length >= 2) {
      remoteDebounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(rawVal.trim())}`);
          const data = await res.json();
          if (data.success && Array.isArray(data.items)) {
            // Merge with local results, deduplicating by IATA code
            const seen = new Set(local.map((l) => l.code));
            const merged = [...local];
            for (const item of data.items) {
              if (item.code && !seen.has(item.code)) {
                seen.add(item.code);
                merged.push({
                  code: item.code,
                  city: item.city,
                  airport: item.name || `${item.city} Airport`,
                });
              }
            }
            setSuggestions(merged.slice(0, 8));
            setIsOpen(merged.length > 0);
          }
        } catch {
          // Silent fallback to local suggestions
        }
      }, 160);
    }
  };

  // Select an airport suggestion
  const handleSelect = (item: AirportOption) => {
    setInputText(item.code);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange({
      code: item.code,
      city: item.city,
      airport: item.airport,
    });
    onRawChange?.(item.code);
  };

  // Auto-resolve on blur if user typed city or code without clicking dropdown
  const handleBlur = () => {
    setIsFocused(false);
    // Short timeout to allow click on dropdown item to register first
    setTimeout(() => {
      setIsOpen(false);
      const clean = inputText.trim();
      if (!clean) return;

      const meta = resolveAirportMetadata(clean);
      if (meta.code) {
        setInputText(meta.code);
        onChange({
          code: meta.code,
          city: meta.city,
          airport: meta.airport,
        });
        onRawChange?.(meta.code);
      } else if (clean.length === 3 || clean.length === 4) {
        const upper = clean.toUpperCase();
        setInputText(upper);
        onChange({
          code: upper,
          city: cityName || upper,
          airport: airportName || `${upper} Airport`,
        });
        onRawChange?.(upper);
      } else {
        onChange({
          code: clean.toUpperCase(),
          city: cityName || clean,
          airport: airportName || `${clean} Airport`,
        });
        onRawChange?.(clean.toUpperCase());
      }
    }, 180);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && suggestions.length > 0) {
        setIsOpen(true);
      } else if (suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else if (inputText.trim()) {
        const meta = resolveAirportMetadata(inputText.trim());
        if (meta.code) {
          e.preventDefault();
          handleSelect(meta);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          className={
            labelClassName ||
            "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5"
          }
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          className={
            inputClassName ||
            "w-full px-2.5 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
          }
        />

        {value && value.toUpperCase() !== inputText.trim().toUpperCase() && (
          <span className="absolute right-2 top-2 text-[10px] font-mono font-bold text-slate-400 pointer-events-none uppercase">
            {value}
          </span>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto p-1 space-y-0.5 animate-in fade-in-50 duration-100">
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const isCurrent = item.code.toUpperCase() === (value || "").toUpperCase();

            return (
              <button
                key={`${item.code}-${idx}`}
                type="button"
                onMouseEnter={() => setHighlightedIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition text-xs ${
                  isHighlighted ? "bg-slate-100" : "hover:bg-slate-50"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate">{item.city}</span>
                    {isCurrent && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                  </div>
                  <span className="text-[10.5px] text-slate-500 block truncate max-w-[220px]">
                    {item.airport}
                  </span>
                </div>

                <span className="font-mono font-bold text-[11px] bg-slate-100 text-[#091c3e] px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  {item.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
