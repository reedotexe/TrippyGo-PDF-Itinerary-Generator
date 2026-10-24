import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { PDFParse } from "pdf-parse";
import { Itinerary, ItinerarySchema } from "../schema/itinerary";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "./prompt";
import { validateAndEnrichExtraction } from "./validate-extraction";

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
  const daysCount = typeof pkg.days === "number" && pkg.days > 0 ? pkg.days : rawDays.length || 1;
  const nightsCount = typeof pkg.nights === "number" && pkg.nights >= 0 ? pkg.nights : Math.max(0, daysCount - 1);

  doc.package = {
    title: pkg.title || doc.title || "Custom Itinerary",
    destinations: Array.isArray(pkg.destinations) && pkg.destinations.length > 0
      ? pkg.destinations
      : typeof pkg.destinations === "string"
      ? [pkg.destinations]
      : ["Destination"],
    nights: nightsCount,
    days: daysCount,
    startDate: typeof pkg.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(pkg.startDate) ? pkg.startDate : null,
    travellers: {
      adults: Number(pkg.travellers?.adults) || 2,
      children: Number(pkg.travellers?.children) || 0,
      rooms: Number(pkg.travellers?.rooms) || 1,
    },
  };

  // 3. Days normalization
  doc.days = rawDays.map((d: any, idx: number) => {
    const dayNum = typeof d.dayNumber === "number" ? d.dayNumber : typeof d.day === "number" ? d.day : idx + 1;
    return {
      dayNumber: dayNum,
      title: (d.title || d.dayTitle || `Day ${dayNum}`).replace(/^Day\s*\d+\s*[-:]*\s*/i, ""),
      description: d.description || d.desc || "",
      activities: Array.isArray(d.activities) ? d.activities : [],
      meals: Array.isArray(d.meals) ? d.meals : [],
      stay: d.stay && typeof d.stay === "object" ? {
        hotel: d.stay.hotel || null,
        city: d.stay.city || null,
        roomType: d.stay.roomType || null,
      } : null,
      imageQuery: d.imageQuery || d.title || "",
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
      airline: f.airline || "Airline",
      flightNumber: f.flightNumber || f.flight_number || "",
      date: f.date || "",
      departureTime: f.departureTime || f.departure_time || "00:00",
      departureCode: f.departureCode || f.departure_code || "DEL",
      departureCity: f.departureCity || f.departure_city || "New Delhi",
      departureAirport: f.departureAirport || f.departure_airport || "",
      arrivalTime: f.arrivalTime || f.arrival_time || "00:00",
      arrivalCode: f.arrivalCode || f.arrival_code || "DEST",
      arrivalCity: f.arrivalCity || f.arrival_city || "Destination",
      arrivalAirport: f.arrivalAirport || f.arrival_airport || "",
      stops: f.stops || "Non-stop",
      layover: f.layover || "",
      checkInBaggage: f.checkInBaggage || f.check_in_baggage || "15 kg",
      cabinBaggage: f.cabinBaggage || f.cabin_baggage || "7 kg",
    }));
  } else {
    doc.flights = [];
  }

  // 5. Pricing normalization (handles paise conversion from strings like "₹76,500" or raw numbers)
  const pr = doc.pricing || {};
  let netPaise = 0;
  if (typeof pr.netAmountPaise === "number" && pr.netAmountPaise > 0) {
    netPaise = pr.netAmountPaise;
  } else if (typeof pr.netAmount === "number" && pr.netAmount > 0) {
    netPaise = Math.round(pr.netAmount * 100);
  } else {
    const candidateStr = pr.total_package_value || pr.land_package_cost || pr.cost || pr.rate || pr.price;
    if (typeof candidateStr === "string") {
      const num = parseInt(candidateStr.replace(/[^\d]/g, ""), 10);
      if (!isNaN(num) && num > 0) netPaise = num * 100;
    }
  }

  doc.pricing = {
    currency: pr.currency || "INR",
    basis: pr.basis || "per_person_twin_sharing",
    netAmountPaise: netPaise,
    markup: pr.markup && typeof pr.markup === "object" ? pr.markup : { type: "percent", value: 15 },
    gstMode: pr.gstMode || "inclusive",
    gstRate: typeof pr.gstRate === "number" ? pr.gstRate : 0.05,
    sacCode: pr.sacCode || "998552",
    validityDays: typeof pr.validityDays === "number" ? pr.validityDays : 7,
  };

  // 6. Inclusions & Exclusions
  doc.inclusions = Array.isArray(doc.inclusions) ? doc.inclusions : [];
  doc.exclusions = Array.isArray(doc.exclusions) ? doc.exclusions : [];

  // 7. Terms
  const terms = doc.terms || {};
  doc.terms = {
    payment: Array.isArray(terms.payment) ? terms.payment : [],
    cancellation: Array.isArray(terms.cancellation) ? terms.cancellation.map((c: any) => ({
      window: c.window || "",
      charge: c.charge || "",
    })) : [],
  };

  // 8. Meta & Variants
  doc.meta = doc.meta || { sourceFile: null, extractedBy: null, reviewFlags: [] };
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
 * Creates an empty baseline itinerary for fallback mode when extraction fails twice
 */
export function createEmptyFallbackItinerary(sourceFile: string = "unnamed_source"): Itinerary {
  return {
    schemaVersion: 1,
    package: {
      title: "New Itinerary (Manual Review)",
      destinations: ["Destination"],
      nights: 3,
      days: 4,
      startDate: null,
      travellers: { adults: 2, children: 0, rooms: 1 },
    },
    days: [
      {
        dayNumber: 1,
        title: "Day 1 - Arrival & Leisure",
        description: "Arrival at destination and hotel check-in.",
        activities: [],
        meals: ["Dinner"],
        stay: { hotel: null, city: null, roomType: null },
        imageQuery: "Scenic landscape",
        image: null,
      },
    ],
    flights: [],
    inclusions: [],
    exclusions: ["Airfare", "Personal expenses"],
    pricing: {
      currency: "INR",
      basis: "per_person_twin_sharing",
      netAmountPaise: 0,
      markup: { type: "percent", value: 15 },
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
    },
    terms: {
      payment: ["25% advance to confirm booking", "Balance 15 days before travel"],
      cancellation: [
        { window: "> 30 days prior", charge: "10% processing fee" },
        { window: "15-30 days prior", charge: "50% package cost" },
        { window: "< 15 days prior", charge: "100% non-refundable" },
      ],
    },
    meta: {
      sourceFile,
      extractedBy: "manual_fallback",
      reviewFlags: [
        {
          field: "pricing.netAmountPaise",
          issue: "Automatic extraction failed or was skipped. Please verify all details manually beside the source file.",
          severity: "warning",
        },
      ],
      extractedSnapshot: null,
    },
    variants: [],
  };
}

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
      travellers: { adults: 2, children: 0, rooms: 1 },
    },
    days: parsedDays,
    flights: [],
    inclusions: inclusions.length > 0 ? inclusions : ["Accommodation and transfers as mentioned"],
    exclusions: exclusions.length > 0 ? exclusions : ["Airfare", "Personal expenses"],
    pricing: {
      currency,
      basis,
      netAmountPaise,
      markup: { type: "percent", value: 15 },
      gstMode: "inclusive",
      gstRate: 0.05,
      sacCode: "998552",
      validityDays: 7,
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
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const effectiveText = cleanPdfTextKerning(
    extractedPdfText && extractedPdfText.length > 50 ? extractedPdfText : request.text || ""
  );

  const promptText = effectiveText
    ? buildExtractionUserPrompt(effectiveText, request.filename)
    : buildExtractionUserPrompt("Please extract the uploaded supplier PDF document.", request.filename);

  const contents: any[] = [];

  // Pass inline PDF document directly if available for native multimodal understanding
  if (request.pdfBase64) {
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
      temperature: 0.1,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error(`Google Gen AI returned an empty response: ${JSON.stringify(response).slice(0, 200)}`);
  }

  return responseText;
}

/**
 * Main Extraction Pipeline Invocation with Retry and Graceful Fallback
 * Supports:
 *  1. Google Gemini (Primary via direct GEMINI_API_KEY)
 *  2. Direct Anthropic SDK (Fallback if ANTHROPIC_API_KEY is configured)
 *  3. Offline Heuristic Parser (Dev / Testing fallback if no keys configured)
 */
export async function extractItinerary(request: ExtractionRequest): Promise<ExtractionResponse> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasLiveGemini =
    Boolean(geminiKey) &&
    !geminiKey!.includes("placeholder") &&
    !geminiKey!.includes("arbitrary");

  const hasLiveAnthropic =
    Boolean(anthropicKey) &&
    !anthropicKey!.includes("placeholder") &&
    !anthropicKey!.includes("arbitrary");

  // 1. If in local dev or CI without live Gemini or Anthropic keys, use heuristic parser
  if (!hasLiveGemini && !hasLiveAnthropic) {
    const rawText = request.text || "Empty source content";
    const itinerary = parseSupplierTextHeuristic(rawText, request.filename);
    itinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
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
      const parser = new PDFParse({ data: pdfBuffer });
      const textResult = await parser.getText();
      extractedPdfText = textResult?.text?.trim() || "";
      await parser.destroy();
    } catch (err) {
      console.warn("[Extraction] Local PDF text extraction skipped:", (err as Error).message);
    }
  }

  let lastError: Error | null = null;
  const maxAttempts = 2;

  // -------------------------------------------------------------
  // PATH A: GOOGLE GEMINI DIRECT API INVOCATION
  // -------------------------------------------------------------
  if (hasLiveGemini) {
    const modelName = process.env.GEMINI_MODEL || process.env.GOOGLE_MODEL || "gemini-2.5-flash";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const rawJsonString = await callGoogleGenAiExtraction(
          geminiKey!,
          modelName,
          request,
          extractedPdfText
        );

        const rawParsed = cleanAndParseJson(rawJsonString);
        const normalized = normalizeRawExtractedJson(rawParsed);
        const validatedItinerary = ItinerarySchema.parse(normalized);
        validatedItinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
        validatedItinerary.meta.extractedBy = `google:${modelName}`;

        const enriched = validateAndEnrichExtraction(validatedItinerary);

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
  // PATH B: DIRECT ANTHROPIC CLAUDE SDK INVOCATION (Fallback)
  // -------------------------------------------------------------
  if (hasLiveAnthropic) {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const modelName = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet-20250219";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let contentBlocks: Anthropic.Messages.MessageParam["content"] = [];

        if (request.pdfBase64) {
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

        const rawParsed = cleanAndParseJson(textBlock.text);
        const normalized = normalizeRawExtractedJson(rawParsed);
        const validatedItinerary = ItinerarySchema.parse(normalized);
        validatedItinerary.meta.sourceFile = request.sourceFileKey || request.filename || null;
        validatedItinerary.meta.extractedBy = modelName;

        const enriched = validateAndEnrichExtraction(validatedItinerary);

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
