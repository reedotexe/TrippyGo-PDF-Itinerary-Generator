import "../polyfill";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { createEmptyFallbackItinerary } from "../schema/factory";
export { createEmptyFallbackItinerary };
import { PDFParse } from "pdf-parse";
import path from "path";
import { pathToFileURL } from "url";
import zlib from "zlib";
import { Itinerary, ItinerarySchema } from "../schema/itinerary";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./prompt";
import { validateAndEnrichExtraction } from "./validate-extraction";
import { calculateTokenCost, logTokenWatcher } from "./token-watcher";
import { searchImages } from "../images/client";

// Configure PDFParse worker location for server-side Next.js/Turbopack
let isPdfWorkerConfigured = false;
function ensurePdfWorkerConfigured() {
  if (isPdfWorkerConfigured) return;
  try {
    const workerPath = pathToFileURL(
      path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs")
    ).href;
    PDFParse.setWorker(workerPath);
    isPdfWorkerConfigured = true;
  } catch (err) {
    console.warn("[Extraction] Could not pre-configure PDFParse worker path:", (err as Error).message);
  }
}

/**
 * Fallback raw stream text extractor for complex/corrupted PDFs where PDFParse might fail
 */
function extractRawPdfTextFallback(pdfBuffer: Buffer): string {
  try {
    const rawString = pdfBuffer.toString("binary");
    const chunks: string[] = [];

    const textMatches = rawString.match(/\((?:[^()\\]|\\.)*\)\s*Tj/g);
    if (textMatches) {
      for (const m of textMatches) {
        const text = m.replace(/\)\s*Tj$/, "").slice(1).replace(/\\([()\\])/g, "$1");
        if (text.trim().length > 1) chunks.push(text.trim());
      }
    }

    const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    while ((match = streamRegex.exec(rawString)) !== null) {
      try {
        const streamData = Buffer.from(match[1], "binary");
        const decompressed = zlib.inflateSync(streamData).toString("latin1");
        const innerMatches = decompressed.match(/\((?:[^()\\]|\\.)*\)\s*Tj/g);
        if (innerMatches) {
          for (const im of innerMatches) {
            const text = im.replace(/\)\s*Tj$/, "").slice(1).replace(/\\([()\\])/g, "$1");
            if (text.trim().length > 1) chunks.push(text.trim());
          }
        }
      } catch {
        // Stream not flate-compressed
      }
    }
    return chunks.join(" ").trim();
  } catch {
    return "";
  }
}

/**
 * Extracts plain text from a PDF Buffer with primary PDFParse and stream fallback
 */
export async function extractTextFromPdfBuffer(pdfBuffer: Buffer): Promise<string> {
  ensurePdfWorkerConfigured();
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const textResult = await parser.getText();
    await parser.destroy();
    const text = textResult?.text?.trim() || "";
    if (text.length > 50) return text;
  } catch (err) {
    console.warn("[Extraction] PDFParse failed, trying raw stream fallback:", (err as Error).message);
  }

  return extractRawPdfTextFallback(pdfBuffer);
}

/**
 * Automatically fetches a relevant cover landscape photo from Unsplash/Pexels for the primary destination
 * and assigns it to day 1 so CoverPage and PDF render a real image out-of-the-box.
 */
async function autoHydrateCoverImage(itinerary: Itinerary): Promise<void> {
  if (!itinerary.days || itinerary.days.length === 0) return;
  if (itinerary.days[0].image?.imageUrl) return;

  const rawDest = itinerary.package.destinations?.[0] || "";
  const cleanDest = rawDest.replace(/\b(destination|tour|package|trip|days?|nights?|\d+n|\d+d)\b/gi, "").trim();
  const query =
    cleanDest ||
    itinerary.days[0].imageQuery ||
    itinerary.package.title?.replace(/\b(\d+n\b|\d+d\b|nights?|days?|tour|package|itinerary)\b/gi, "").trim() ||
    "travel landscape";

  try {
    const results = await searchImages(query, 1);
    if (results && results.length > 0) {
      const img = results[0];
      itinerary.days[0].image = {
        provider: img.provider,
        photoId: img.photoId,
        imageUrl: img.fullUrl,
        thumbnailUrl: img.thumbUrl,
        photographerName: img.photographerName,
        photographerUrl: img.photographerUrl,
        downloadLocation: img.downloadLocation,
      };
      console.log(`[Images] Auto-hydrated cover photo for destination "${query}" (${img.provider}):`, img.fullUrl);
    }
  } catch (err) {
    console.warn("[Images] Cover image auto-hydration skipped (non-blocking):", (err as Error).message);
  }
}

export interface ExtractionRequest {
  text?: string;
  pdfBase64?: string;
  filename?: string;
  sourceFileKey?: string;
}

export interface ExtractionResponse {
  success: boolean;
  fallback?: boolean;
  itinerary: Itinerary;
  errorMessage?: string;
}

/**
 * Cleans spaced-out typography, broken kerning, and page markings from PDF extraction
 */
export function cleanPdfTextKerning(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\s+([A-Z]+)\b/g, "$1$2$3$4")
    .replace(/\b([A-Z])\s+([A-Z])\s+([A-Z])\b/g, "$1$2$3")
    .replace(/\b([A-Z])\s+([A-Z])\b/g, "$1$2")
    .replace(/([a-zA-Z]{2,})\s+([a-z]{1,2})\b/g, "$1$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Coerces and normalizes LLM extraction output into the exact Itinerary schema format
 */
export function normalizeRawExtractedJson(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const doc = { ...raw };

  // 1. schemaVersion must be literal 1
  doc.schemaVersion = 1;

  // 2. Package normalization
  const pkg = doc.package || {};
  const rawDays = Array.isArray(doc.days) ? doc.days : [];
  const daysCount = typeof pkg.days === "number" && pkg.days > 0 ? pkg.days : Math.max(1, rawDays.length);
  const nightsCount = typeof pkg.nights === "number" && pkg.nights >= 0 ? pkg.nights : Math.max(0, daysCount - 1);

  doc.package = {
    title: String(pkg.title || doc.title || "Custom Itinerary").trim() || "Custom Itinerary",
    destinations: Array.isArray(pkg.destinations) && pkg.destinations.length > 0
      ? pkg.destinations.map((d: any) => String(d).trim()).filter(Boolean)
      : typeof pkg.destinations === "string" && pkg.destinations.trim()
        ? [pkg.destinations.trim()]
        : ["Destination"],
    nights: nightsCount,
    days: daysCount,
    startDate: typeof pkg.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(pkg.startDate) ? pkg.startDate : null,
    travellers: {
      adults: Math.max(1, Number(pkg.travellers?.adults) || 2),
      children: Math.max(0, Number(pkg.travellers?.children) || 0),
      infants: Math.max(0, Number(pkg.travellers?.infants) || 0),
      rooms: Math.max(1, Number(pkg.travellers?.rooms) || 1),
    },
  };

  // 3. Days normalization
  doc.days = rawDays.map((d: any, idx: number) => {
    const dayNum = typeof d.dayNumber === "number" && d.dayNumber >= 1 ? d.dayNumber : idx + 1;
    const dayTitle = String(d.title || d.dayTitle || `Day ${dayNum}`)
      .replace(/^Day\s*\d+\s*[-:]*\s*/i, "")
      .trim();
    return {
      dayNumber: dayNum,
      title: dayTitle || `Day ${dayNum}`,
      description: String(d.description || d.desc || "").trim(),
      activities: Array.isArray(d.activities) ? d.activities.map((a: any) => String(a).trim()).filter(Boolean) : [],
      meals: Array.isArray(d.meals) ? d.meals.map((m: any) => String(m).trim()).filter(Boolean) : [],
      stay: d.stay && typeof d.stay === "object" ? {
        hotel: d.stay.hotel ? String(d.stay.hotel).trim() : null,
        city: d.stay.city ? String(d.stay.city).trim() : null,
        roomType: d.stay.roomType ? String(d.stay.roomType).trim() : null,
      } : null,
      imageQuery: String(d.imageQuery || d.title || "").trim(),
      image: null,
    };
  });

  if (doc.days.length === 0) {
    doc.days = [
      {
        dayNumber: 1,
        title: "Day 1 Arrival",
        description: "Arrival at destination.",
        activities: [],
        meals: ["Dinner"],
        stay: null,
        imageQuery: "Destination landmark",
        image: null,
      },
    ];
  }

  // 4. Flights normalization
  if (Array.isArray(doc.flights)) {
    doc.flights = doc.flights.map((f: any) => ({
      airline: String(f.airline || "Airline").trim(),
      flightNumber: String(f.flightNumber || f.flight_number || "").trim(),
      date: String(f.date || "").trim(),
      departureTime: String(f.departureTime || f.departure_time || "00:00").trim(),
      departureCode: String(f.departureCode || f.departure_code || "DEL").trim().toUpperCase(),
      departureCity: String(f.departureCity || f.departure_city || "New Delhi").trim(),
      departureAirport: String(f.departureAirport || f.departure_airport || "").trim(),
      arrivalTime: String(f.arrivalTime || f.arrival_time || "00:00").trim(),
      arrivalCode: String(f.arrivalCode || f.arrival_code || "DEST").trim().toUpperCase(),
      arrivalCity: String(f.arrivalCity || f.arrival_city || "Destination").trim(),
      arrivalAirport: String(f.arrivalAirport || f.arrival_airport || "").trim(),
      stops: String(f.stops || "Non-stop").trim(),
      layover: String(f.layover || "").trim(),
      checkInBaggage: String(f.checkInBaggage || f.check_in_baggage || "15 kg").trim(),
      cabinBaggage: String(f.cabinBaggage || f.cabin_baggage || "7 kg").trim(),
    }));
  } else {
    doc.flights = [];
  }

  // 5. Pricing normalization
  const pr = doc.pricing || {};
  let netPaise = 0;
  if (typeof pr.netAmountPaise === "number" && pr.netAmountPaise >= 0) {
    netPaise = Math.round(pr.netAmountPaise);
  } else if (typeof pr.netAmount === "number" && pr.netAmount >= 0) {
    netPaise = Math.round(pr.netAmount * 100);
  } else {
    const candidateStr = pr.total_package_value || pr.land_package_cost || pr.cost || pr.rate || pr.price || pr.totalAmount;
    if (typeof candidateStr === "string") {
      const num = parseInt(candidateStr.replace(/[^\d]/g, ""), 10);
      if (!isNaN(num) && num > 0) netPaise = num * 100;
    } else if (typeof candidateStr === "number" && candidateStr >= 0) {
      netPaise = Math.round(candidateStr * 100);
    }
  }

  // Discriminated union on markup: { type: "percent", value } | { type: "flat", valuePaise }
  let normalizedMarkup: { type: "percent"; value: number } | { type: "flat"; valuePaise: number } = {
    type: "percent",
    value: 15,
  };

  if (typeof pr.markup === "number") {
    normalizedMarkup = { type: "percent", value: Math.min(100, Math.max(0, pr.markup)) };
  } else if (typeof pr.markup === "string") {
    const parsedVal = parseFloat(pr.markup.replace(/[^\d.]/g, ""));
    normalizedMarkup = { type: "percent", value: !isNaN(parsedVal) ? Math.min(100, Math.max(0, parsedVal)) : 15 };
  } else if (pr.markup && typeof pr.markup === "object") {
    const rawType = String(pr.markup.type || "").toLowerCase().trim();
    if (rawType === "flat" || "valuePaise" in pr.markup) {
      const rawPaise = Number(pr.markup.valuePaise ?? (Number(pr.markup.value || 0) * 100));
      normalizedMarkup = {
        type: "flat",
        valuePaise: isNaN(rawPaise) ? 0 : Math.max(0, Math.round(rawPaise)),
      };
    } else {
      const rawVal = Number(pr.markup.value ?? pr.markup.percent ?? pr.markup.percentage ?? 15);
      normalizedMarkup = {
        type: "percent",
        value: isNaN(rawVal) ? 15 : Math.min(100, Math.max(0, rawVal)),
      };
    }
  }

  // Basis normalization
  const validBases = ["per_person", "per_person_twin_sharing", "per_room", "total_group"] as const;
  let basis: (typeof validBases)[number] = "per_person_twin_sharing";
  if (typeof pr.basis === "string") {
    const cleanedBasis = pr.basis.toLowerCase().replace(/[\s-]/g, "_");
    if (cleanedBasis.includes("room")) basis = "per_room";
    else if (cleanedBasis.includes("group") || cleanedBasis.includes("total")) basis = "total_group";
    else if (cleanedBasis.includes("twin") || cleanedBasis.includes("sharing")) basis = "per_person_twin_sharing";
    else if (cleanedBasis.includes("person")) basis = "per_person";
  }

  // GST mode normalization
  let gstMode: "inclusive" | "extra" | "hidden" = "inclusive";
  if (typeof pr.gstMode === "string") {
    const cleanedGst = pr.gstMode.toLowerCase().trim();
    if (cleanedGst.includes("extra") || cleanedGst.includes("exclusive") || cleanedGst.includes("plus")) {
      gstMode = "extra";
    } else if (cleanedGst.includes("hidden")) {
      gstMode = "hidden";
    } else {
      gstMode = "inclusive";
    }
  }

  // 4-pillar package price breakup normalization (Flight, Hotel, Land Part, Visa)
  const rawBreakup = pr.breakup || {};
  const normalizeBreakupItem = (item: any) => ({
    amountPaise: typeof item?.amountPaise === "number" && item.amountPaise >= 0
      ? Math.round(item.amountPaise)
      : typeof item?.amount === "number" && item.amount >= 0
      ? Math.round(item.amount * 100)
      : 0,
    included: typeof item?.included === "boolean" ? item.included : true,
    note: typeof item?.note === "string" ? item.note.trim() : "",
  });

  doc.pricing = {
    currency: String(pr.currency || "INR").trim().toUpperCase() || "INR",
    basis,
    netAmountPaise: netPaise,
    markup: normalizedMarkup,
    gstMode,
    gstRate: typeof pr.gstRate === "number" && pr.gstRate >= 0 && pr.gstRate <= 1 ? pr.gstRate : 0.05,
    sacCode: String(pr.sacCode || "998552").trim(),
    validityDays: typeof pr.validityDays === "number" && pr.validityDays > 0 ? Math.round(pr.validityDays) : 7,
    pricingType: pr.pricingType === "custom" ? "custom" : pr.pricingType === "total_only" ? "total_only" : "supplier",
    totalPackagePricePaise: typeof pr.totalPackagePricePaise === "number" && pr.totalPackagePricePaise >= 0 ? Math.round(pr.totalPackagePricePaise) : netPaise,
    supplierBreakup: {
      supplierCostPaise: typeof pr.supplierBreakup?.supplierCostPaise === "number" ? pr.supplierBreakup.supplierCostPaise : netPaise,
      flightIncluded: typeof pr.supplierBreakup?.flightIncluded === "boolean" ? pr.supplierBreakup.flightIncluded : false,
      flightCostPaise: typeof pr.supplierBreakup?.flightCostPaise === "number" ? pr.supplierBreakup.flightCostPaise : 0,
      flightNote: String(pr.supplierBreakup?.flightNote || "").trim(),
      landNote: String(pr.supplierBreakup?.landNote || "Complete land package, accommodations, transfers & sightseeing").trim(),
    },
    customBreakup: {
      flight: normalizeBreakupItem(pr.customBreakup?.flight || rawBreakup.flight),
      hotel: normalizeBreakupItem(pr.customBreakup?.hotel || rawBreakup.hotel),
      landPart: normalizeBreakupItem(pr.customBreakup?.landPart || rawBreakup.landPart),
      visa: normalizeBreakupItem(pr.customBreakup?.visa || rawBreakup.visa),
    },
    breakup: {
      flight: normalizeBreakupItem(rawBreakup.flight),
      hotel: normalizeBreakupItem(rawBreakup.hotel),
      landPart: normalizeBreakupItem(rawBreakup.landPart),
      visa: normalizeBreakupItem(rawBreakup.visa),
    },
  };

  // 6. Inclusions & Exclusions
  doc.inclusions = Array.isArray(doc.inclusions)
    ? doc.inclusions.map((i: any) => String(i).trim()).filter(Boolean)
    : [];
  doc.exclusions = Array.isArray(doc.exclusions)
    ? doc.exclusions.map((e: any) => String(e).trim()).filter(Boolean)
    : [];

  // 7. Terms
  const terms = doc.terms || {};
  doc.terms = {
    payment: Array.isArray(terms.payment)
      ? terms.payment.map((p: any) => String(p).trim()).filter(Boolean)
      : [],
    cancellation: Array.isArray(terms.cancellation)
      ? terms.cancellation
          .filter((c: any) => c && typeof c === "object")
          .map((c: any) => ({
            window: String(c.window || "Prior to departure").trim(),
            charge: String(c.charge || "Standard policy").trim(),
          }))
      : [],
  };

  // 8. Meta & Variants
  doc.meta = doc.meta || { sourceFile: null, extractedBy: null, reviewFlags: [] };
  if (!Array.isArray(doc.meta.reviewFlags)) doc.meta.reviewFlags = [];
  doc.variants = Array.isArray(doc.variants) ? doc.variants : [];

  return doc;
}

/**
 * Robust JSON extraction helper that handles raw JSON, markdown fences,
 * leading/trailing conversational text, and trailing commas.
 */
export function cleanAndParseJson(raw: string): any {
  let text = raw.trim();

  // Strip code fences if present
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(text);
  } catch {
    // Fallback: extract substring between first { and last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Strip trailing commas before closing braces/brackets
        const sanitized = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(sanitized);
      }
    }
    throw new Error(`Failed to parse JSON from model output: ${text.slice(0, 150)}...`);
  }
}

/**
 * Baseline empty itinerary factory
 */

/**
 * Heuristic offline parser for test suites and dev environments without an active API key
 */
export function parseSupplierTextHeuristic(text: string, filename?: string): Itinerary {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // 1. Detect Package Title and Destinations
  let title = "Custom Holiday Package";
  let destinations: string[] = ["India"];
  let nights = 3;
  let days = 4;

  const durationMatch = text.match(/(\d+)\s*(?:N|Nights?)\s*(?:\/|\+|-)\s*(\d+)\s*(?:D|Days?)/i);
  if (durationMatch) {
    nights = parseInt(durationMatch[1], 10);
    days = parseInt(durationMatch[2], 10);
  }

  for (const line of lines) {
    const destMatch = line.match(/(?:DESTINATION|Package|Tour|Itinerary):\s*(.+)/i);
    if (destMatch) {
      title = destMatch[1].trim();
      const parts = destMatch[1].split(/[-–,/|]+/).map((s) => s.trim()).filter((s) => s.length > 2);
      if (parts.length > 0) destinations = parts;
      break;
    }
  }

  // 2. Parse Day blocks
  const dayRegex = /(?:DAY|Day)\s*(\d+)[:\s\-]+([^\n.]+)/gi;
  const dayIndices: Array<{ dayNumber: number; title: string; lineIndex: number }> = [];

  lines.forEach((line, index) => {
    dayRegex.lastIndex = 0;
    const match = dayRegex.exec(line);
    if (match) {
      dayIndices.push({
        dayNumber: parseInt(match[1], 10),
        title: match[2].trim(),
        lineIndex: index,
      });
    }
  });

  const parsedDays: Itinerary["days"] = [];
  if (dayIndices.length > 0) {
    for (let i = 0; i < dayIndices.length; i++) {
      const current = dayIndices[i];
      const nextIndex = i + 1 < dayIndices.length ? dayIndices[i + 1].lineIndex : lines.length;
      const descLines = lines.slice(current.lineIndex + 1, nextIndex).filter(
        (l) => !l.startsWith("INCLUSIONS") && !l.startsWith("EXCLUSIONS") && !l.startsWith("NET")
      );
      const description = descLines.join(" ");

      // Extract hotel mention if present
      let hotel: string | null = null;
      const hotelMatch = description.match(/(?:Hotel|Resort|Camp|Houseboat)\s+([A-Z][A-Za-z0-9\s]+?)(?:,|\.|\s+in\s+|\s+overnight|\s+at\s+|$)/i);
      if (hotelMatch) {
        hotel = hotelMatch[0].trim();
      }

      parsedDays.push({
        dayNumber: current.dayNumber,
        title: current.title,
        description: description || current.title,
        activities: [current.title],
        meals: description.toLowerCase().includes("dinner") ? ["Dinner"] : ["Breakfast"],
        stay: hotel ? { hotel, city: destinations[0] || null, roomType: null } : null,
        imageQuery: `${destinations[0] || "Travel"} ${current.title.split(" ")[0]} scenic`,
        image: null,
      });
    }
  } else {
    // Default single day if format was unindexed
    parsedDays.push({
      dayNumber: 1,
      title: title,
      description: text.slice(0, 300),
      activities: [],
      meals: ["Breakfast"],
      stay: null,
      imageQuery: destinations[0] || "Holiday",
      image: null,
    });
  }

  // 3. Price extraction
  let netAmountPaise = 2500000; // Default 25,000 INR
  let currency = "INR";
  let basis: Itinerary["pricing"]["basis"] = "per_person_twin_sharing";

  const netLineMatch = text.match(/(?:NET|TOTAL|PACKAGE|PRICE|RATE|COST)[^\n]*?(?:INR|Rs\.?|₹)\s*([\d,]+)/i);
  const inrMatches = Array.from(text.matchAll(/(?:INR|Rs\.?|₹)\s*([\d,]+)/gi));
  const usdMatch = text.match(/(?:USD|\$)\s*([\d,]+)/i);

  if (netLineMatch) {
    const cleanNum = parseInt(netLineMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(cleanNum) && cleanNum > 0) {
      netAmountPaise = cleanNum * 100;
    }
  } else if (inrMatches.length > 0) {
    // Pick the largest rupee figure (to avoid picking minor union taxi / entry ticket prices)
    const validNums = inrMatches
      .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
      .filter((n) => !isNaN(n) && n > 0);
    if (validNums.length > 0) {
      netAmountPaise = Math.max(...validNums) * 100;
    }
  } else if (usdMatch) {
    const cleanNum = parseInt(usdMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(cleanNum) && cleanNum > 0) {
      currency = "USD";
      netAmountPaise = cleanNum * 84 * 100; // approx INR conversion for dev
    }
  }

  if (text.toLowerCase().includes("total for couple") || text.toLowerCase().includes("total for 2 pax")) {
    basis = "total_group";
  }

  // 4. Inclusions & Exclusions
  const inclusions: string[] = [];
  const exclusions: string[] = [];
  let inInclusions = false;
  let inExclusions = false;

  for (const line of lines) {
    if (/^INCLUSIONS?:?/i.test(line)) {
      inInclusions = true;
      inExclusions = false;
      continue;
    }
    if (/^EXCLUSIONS?:?/i.test(line)) {
      inExclusions = true;
      inInclusions = false;
      continue;
    }
    if (/^(NET|PRICE|HOTELS|COMMERCIALS)/i.test(line)) {
      inInclusions = false;
      inExclusions = false;
    }

    if (inInclusions && (line.startsWith("-") || line.startsWith("•") || line.startsWith("*"))) {
      inclusions.push(line.replace(/^[-•*]\s*/, ""));
    }
    if (inExclusions && (line.startsWith("-") || line.startsWith("•") || line.startsWith("*"))) {
      exclusions.push(line.replace(/^[-•*]\s*/, ""));
    }
  }

  const rawItinerary: Itinerary = {
    schemaVersion: 1,
    package: {
      title,
      destinations,
      nights,
      days: parsedDays.length || days,
      startDate: null,
      travellers: { adults: 2, children: 0, infants: 0, rooms: 1 },
      guestName: "",
      coverImage: null,
    },
    days: parsedDays,
    flights: [],
    inclusions: inclusions.length > 0 ? inclusions : ["Accommodation and transfers as mentioned"],
    exclusions: exclusions.length > 0 ? exclusions : ["Airfare", "Personal expenses"],
    pricing: {
      pricingType: "supplier",
      priceDistribution: "total",
      currency,
      basis,
      netAmountPaise,
      totalPackagePricePaise: 0,
      markup: { type: "percent", value: 15 },
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
      supplierBreakup: {
        supplierCostPaise: netAmountPaise,
        flightIncluded: false,
        flightCostPaise: 0,
        flightNote: "",
        landNote: "Complete land package, accommodations, transfers & sightseeing",
      },
      customBreakup: {
        flight: { amountPaise: 0, included: false, note: "" },
        hotel: { amountPaise: 0, included: true, note: "" },
        landPart: { amountPaise: 0, included: true, note: "" },
        visa: { amountPaise: 0, included: false, note: "" },
      },
      breakup: {
        flight: { amountPaise: 0, included: true, note: "" },
        hotel: { amountPaise: 0, included: true, note: "" },
        landPart: { amountPaise: 0, included: true, note: "" },
        visa: { amountPaise: 0, included: true, note: "" },
      },
    },
    terms: {
      payment: ["25% advance to confirm booking", "Balance before travel"],
      cancellation: [
        { window: "> 30 days prior", charge: "10% service fee" },
        { window: "15 to 30 days", charge: "50% charge" },
        { window: "< 15 days", charge: "100% charge" },
      ],
    },
    meta: {
      sourceFile: filename || null,
      extractedBy: "trippygo_heuristic_v1",
      reviewFlags: [],
      extractedSnapshot: { textPreview: text.slice(0, 200) },
      tokenUsage: null,
    },
    variants: [],
  };

  return validateAndEnrichExtraction(rawItinerary);
}

/**
 * Invokes Google Gen AI SDK directly to extract structured itinerary JSON.
 * Natively supports direct PDF document ingestion via inlineData (base64)
 * with up to 1M token context window and structured JSON response mode.
 */
async function callGoogleGenAiExtraction(
  apiKey: string,
  modelName: string,
  request: ExtractionRequest,
  extractedPdfText?: string
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const ai = new GoogleGenAI({ apiKey });

  const effectiveText = cleanPdfTextKerning(
    extractedPdfText && extractedPdfText.length > 50 ? extractedPdfText : request.text || ""
  );

  const promptText = effectiveText
    ? buildExtractionUserPrompt(effectiveText, request.filename)
    : buildExtractionUserPrompt("Please extract the uploaded supplier PDF document.", request.filename);

  const contents: any[] = [];

  // Pass inline PDF document directly if available for native multimodal understanding
  // Note: Gemini API inlineData has a 20MB payload limit. If base64 is larger than 20MB,
  // we rely on the high-fidelity extractedPdfText to avoid HTTP 400 payload errors.
  const MAX_GEMINI_INLINE_BYTES = 20 * 1024 * 1024;
  if (request.pdfBase64 && request.pdfBase64.length <= MAX_GEMINI_INLINE_BYTES) {
    contents.push({
      inlineData: {
        data: request.pdfBase64,
        mimeType: "application/pdf",
      },
    });
  }

  contents.push(promptText);

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction: EXTRACTION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 1,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error(`Google Gen AI returned an empty response: ${JSON.stringify(response).slice(0, 200)}`);
  }

  const promptTokens = Number(response.usageMetadata?.promptTokenCount || 0);
  const completionTokens = Number(response.usageMetadata?.candidatesTokenCount || 0);
  const totalTokens = Number(response.usageMetadata?.totalTokenCount || promptTokens + completionTokens);

  return {
    text: responseText,
    usage: { promptTokens, completionTokens, totalTokens },
  };
}

/**
 * Invokes OpenAI Chat Completions API directly with structured JSON mode.
 * Uses native fetch with zero extra dependencies.
 */
async function callOpenAiExtraction(
  apiKey: string,
  modelName: string,
  request: ExtractionRequest,
  extractedPdfText?: string
): Promise<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }> {
  const effectiveText = cleanPdfTextKerning(
    extractedPdfText && extractedPdfText.length > 50 ? extractedPdfText : request.text || ""
  );

  const promptText = effectiveText
    ? buildExtractionUserPrompt(effectiveText, request.filename)
    : buildExtractionUserPrompt("Please extract the uploaded supplier PDF document.", request.filename);

  const requestBody: Record<string, any> = {
    model: modelName,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: promptText },
    ],
  };

  // Only pass temperature if explicitly configured; models like gpt-6-luna/o-series reject custom temperatures
  if (process.env.OPENAI_TEMPERATURE) {
    const customTemp = parseFloat(process.env.OPENAI_TEMPERATURE);
    if (!isNaN(customTemp)) {
      requestBody.temperature = customTemp;
    }
  }

  let res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(requestBody),
  });

  // If 400 error mentions temperature, retry immediately without temperature parameter
  if (!res.ok && res.status === 400 && requestBody.temperature !== undefined) {
    delete requestBody.temperature;
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(requestBody),
    });
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`OpenAI API error (${res.status}): ${errorBody}`);
  }

  const data = (await res.json()) as any;
  const responseText = data?.choices?.[0]?.message?.content;
  if (!responseText) {
    throw new Error(`OpenAI returned empty message content: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const promptTokens = Number(data?.usage?.prompt_tokens || 0);
  const completionTokens = Number(data?.usage?.completion_tokens || 0);
  const totalTokens = Number(data?.usage?.total_tokens || promptTokens + completionTokens);

  return {
    text: responseText,
    usage: { promptTokens, completionTokens, totalTokens },
  };
}

/**
 * Main Extraction Pipeline Invocation with Retry and Graceful Fallback
 * Supports:
 *  1. OpenAI Platform (Primary if OPENAI_API_KEY configured - e.g. gpt-4o-mini)
 *  2. Google Gemini (Via GEMINI_API_KEY)
 *  3. Direct Anthropic SDK (Fallback if ANTHROPIC_API_KEY is configured)
 *  4. Offline Heuristic Parser (Dev / Testing fallback if no keys configured)
 */
export async function extractItinerary(request: ExtractionRequest): Promise<ExtractionResponse> {
  const openAiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasLiveOpenAi =
    Boolean(openAiKey) &&
    !openAiKey!.includes("placeholder") &&
    !openAiKey!.includes("arbitrary");

  const hasLiveGemini =
    Boolean(geminiKey) &&
    !geminiKey!.includes("placeholder") &&
    !geminiKey!.includes("arbitrary");

  const hasLiveAnthropic =
    Boolean(anthropicKey) &&
    !anthropicKey!.includes("placeholder") &&
    !anthropicKey!.includes("arbitrary");

  // If in local dev or CI without any live keys, use heuristic parser
  if (!hasLiveOpenAi && !hasLiveGemini && !hasLiveAnthropic) {
    const rawText = request.text || "Empty source content";
    const itinerary = parseSupplierTextHeuristic(rawText, request.filename);
    itinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
    await autoHydrateCoverImage(itinerary);
    return {
      success: true,
      itinerary,
    };
  }

  // Pre-extract PDF text stream locally if PDF base64 is provided
  let extractedPdfText = "";
  if (request.pdfBase64) {
    try {
      const pdfBuffer = Buffer.from(request.pdfBase64, "base64");
      extractedPdfText = await extractTextFromPdfBuffer(pdfBuffer);
    } catch (err) {
      console.warn("[Extraction] Local PDF text extraction skipped:", (err as Error).message);
    }
  }

  let lastError: Error | null = null;
  const maxAttempts = 2;
  const extractionStartTime = Date.now();

  // -------------------------------------------------------------
  // PATH A: OPENAI DIRECT API INVOCATION (Primary if configured)
  // -------------------------------------------------------------
  if (hasLiveOpenAi) {
    const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { text: rawJsonString, usage } = await callOpenAiExtraction(
          openAiKey!,
          modelName,
          request,
          extractedPdfText
        );

        const durationMs = Date.now() - extractionStartTime;
        const rawParsed = cleanAndParseJson(rawJsonString);
        const normalized = normalizeRawExtractedJson(rawParsed);
        const validatedItinerary = ItinerarySchema.parse(normalized);
        validatedItinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
        validatedItinerary.meta.extractedBy = `openai:${modelName}`;

        const cost = calculateTokenCost(modelName, usage.promptTokens, usage.completionTokens);
        validatedItinerary.meta.tokenUsage = {
          model: modelName,
          ...usage,
          ...cost,
          durationMs,
        };

        logTokenWatcher({
          provider: "OpenAI",
          model: modelName,
          sourceFile: request.filename || request.sourceFileKey,
          ...usage,
          ...cost,
          durationMs,
        });

        const enriched = validateAndEnrichExtraction(validatedItinerary);
        await autoHydrateCoverImage(enriched);

        return {
          success: true,
          itinerary: enriched,
        };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[Extraction OpenAI] Attempt ${attempt} failed:`, lastError.message);
      }
    }
  }

  // -------------------------------------------------------------
  // PATH B: GOOGLE GEMINI DIRECT API INVOCATION
  // -------------------------------------------------------------
  if (hasLiveGemini) {
    const modelName = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || "gemini-2.5-flash";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { text: rawJsonString, usage } = await callGoogleGenAiExtraction(
          geminiKey!,
          modelName,
          request,
          extractedPdfText
        );

        const durationMs = Date.now() - extractionStartTime;
        const rawParsed = cleanAndParseJson(rawJsonString);
        const normalized = normalizeRawExtractedJson(rawParsed);
        const validatedItinerary = ItinerarySchema.parse(normalized);
        validatedItinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
        validatedItinerary.meta.extractedBy = `google:${modelName}`;

        const cost = calculateTokenCost(modelName, usage.promptTokens, usage.completionTokens);
        validatedItinerary.meta.tokenUsage = {
          model: modelName,
          ...usage,
          ...cost,
          durationMs,
        };

        logTokenWatcher({
          provider: "Google Gemini",
          model: modelName,
          sourceFile: request.filename || request.sourceFileKey,
          ...usage,
          ...cost,
          durationMs,
        });

        const enriched = validateAndEnrichExtraction(validatedItinerary);
        await autoHydrateCoverImage(enriched);

        return {
          success: true,
          itinerary: enriched,
        };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[Extraction Google Gemini] Attempt ${attempt} failed:`, lastError.message);
      }
    }
  }

  // -------------------------------------------------------------
  // PATH C: DIRECT ANTHROPIC CLAUDE SDK INVOCATION (Fallback)
  // -------------------------------------------------------------
  if (hasLiveAnthropic) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const modelName = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let contentBlocks: Anthropic.Messages.MessageParam["content"] = [];

        const MAX_ANTHROPIC_DOC_BYTES = 30 * 1024 * 1024;
        if (request.pdfBase64 && request.pdfBase64.length <= MAX_ANTHROPIC_DOC_BYTES) {
          contentBlocks = [
            {
              type: "document" as any,
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: request.pdfBase64,
              },
            } as any,
            {
              type: "text",
              text: buildExtractionUserPrompt("Please extract the uploaded supplier PDF document.", request.filename),
            },
          ];
        } else {
          contentBlocks = [
            {
              type: "text",
              text: buildExtractionUserPrompt(request.text || "", request.filename),
            },
          ];
        }

        const response = await anthropic.messages.create({
          model: modelName,
          max_tokens: 4096,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [{ role: "user", content: contentBlocks }],
        });

        // Extract JSON text from first text block
        const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
        if (!textBlock) {
          throw new Error("No text response received from Claude API");
        }

        const durationMs = Date.now() - extractionStartTime;
        const promptTokens = Number(response.usage?.input_tokens || 0);
        const completionTokens = Number(response.usage?.output_tokens || 0);
        const totalTokens = promptTokens + completionTokens;
        const cost = calculateTokenCost(modelName, promptTokens, completionTokens);

        const rawParsed = cleanAndParseJson(textBlock.text);
        const normalized = normalizeRawExtractedJson(rawParsed);
        const validatedItinerary = ItinerarySchema.parse(normalized);
        validatedItinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
        validatedItinerary.meta.extractedBy = `anthropic:${modelName}`;
        validatedItinerary.meta.tokenUsage = {
          model: modelName,
          promptTokens,
          completionTokens,
          totalTokens,
          ...cost,
          durationMs,
        };

        logTokenWatcher({
          provider: "Anthropic",
          model: modelName,
          sourceFile: request.filename || request.sourceFileKey,
          promptTokens,
          completionTokens,
          totalTokens,
          ...cost,
          durationMs,
        });

        const enriched = validateAndEnrichExtraction(validatedItinerary);
        await autoHydrateCoverImage(enriched);

        return {
          success: true,
          itinerary: enriched,
        };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[Extraction Anthropic] Attempt ${attempt} failed:`, lastError.message);
      }
    }
  }

  // -------------------------------------------------------------
  // FALLBACK FLOW: RETURN EMPTY BASELINE IF BOTH ATTEMPTS FAILED
  // -------------------------------------------------------------
  console.error("[Extraction] Both extraction attempts failed. Returning fallback form.", lastError?.message);
  const fallbackItinerary = createEmptyFallbackItinerary(request.sourceFileKey || request.filename || "unknown");
  fallbackItinerary.meta.reviewFlags.push({
    field: "root",
    issue: `Extraction engine failed after 2 attempts: ${lastError?.message || "Model timeout / format error"}. Please enter details manually.`,
    severity: "error",
  });

  return {
    success: false,
    fallback: true,
    itinerary: fallbackItinerary,
    errorMessage: lastError?.message,
  };
}
