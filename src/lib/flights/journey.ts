import { FlightLeg } from "@/lib/schema/itinerary";
import { AIRPORT_CODE_CITIES, resolveAirportCode, resolveAirportMetadata } from "./airports";

export interface LayoverInfo {
  airportCode: string;
  airportCity: string;
  airportName: string;
  durationFormatted: string;
  durationMinutes: number;
  isOvernight: boolean;
  transitNote: string;
  connectionLabel: string;
}

export interface FlightLegEnriched extends FlightLeg {
  flightDuration?: string;
  flightDurationMinutes?: number;
  legSequenceIndex?: number;
  totalLegsInJourney?: number;
  isFirstLeg?: boolean;
  isLastLeg?: boolean;
  nextLegLayover?: LayoverInfo;
  originalIndex?: number;
}

export interface FlightJourneyGroup {
  id: string;
  direction: "outbound" | "inbound" | "internal";
  directionLabel: string;
  originCode: string;
  originCity: string;
  destinationCode: string;
  destinationCity: string;
  departureDate: string;
  totalDurationFormatted?: string;
  isConnecting: boolean;
  layovers: LayoverInfo[];
  legs: FlightLegEnriched[];
}

export interface GroupedJourneys {
  outbound: FlightJourneyGroup[];
  inbound: FlightJourneyGroup[];
  internal: FlightJourneyGroup[];
  allJourneys: FlightJourneyGroup[];
  totalLegs: number;
  hasConnecting: boolean;
  summary: {
    outboundRoute: string;
    returnRoute: string;
    outboundDuration?: string;
    returnDuration?: string;
  };
}

function parseTimeToMinutes(t?: string): number | null {
  if (!t || !t.includes(":")) return null;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function addDaysToYmd(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(Date.UTC(y, m - 1, d + days));
  const newY = dateObj.getUTCFullYear();
  const newM = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const newD = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${newY}-${newM}-${newD}`;
}

function getDaysDiff(dateStrA: string, dateStrB: string): number {
  const [yA, mA, dA] = dateStrA.split("-").map((x) => parseInt(x, 10));
  const [yB, mB, dB] = dateStrB.split("-").map((x) => parseInt(x, 10));
  if (!yA || !mA || !dA || !yB || !mB || !dB) return 0;
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates duration between departure and arrival time.
 */
export function calculateFlightDuration(
  depTime: string,
  arrTime: string,
  depDate?: string,
  arrDate?: string
): { formatted: string; minutes: number } {
  if (!depTime || !arrTime || !depTime.includes(":") || !arrTime.includes(":")) {
    return { formatted: "", minutes: 0 };
  }

  const [hA, mA] = depTime.split(":").map((x) => parseInt(x, 10) || 0);
  const [hB, mB] = arrTime.split(":").map((x) => parseInt(x, 10) || 0);

  const minA = hA * 60 + mA;
  let minB = hB * 60 + mB;

  if (depDate && arrDate && depDate !== arrDate) {
    const dA = new Date(depDate);
    const dB = new Date(arrDate);
    const dayDiff = Math.round((dB.getTime() - dA.getTime()) / (1000 * 60 * 60 * 24));
    minB += dayDiff * 24 * 60;
  } else if (minB < minA) {
    // Crosses midnight
    minB += 24 * 60;
  }

  const diff = Math.max(0, minB - minA);
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;

  const formatted = `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
  return { formatted, minutes: diff };
}

/**
 * Normalizes a partial or complete FlightLeg object:
 * Automatically resolves missing city and airport names from IATA codes using resolveAirportMetadata.
 * Ensures consistent formatting, trimming, and default fallback properties.
 */
export function normalizeFlightLeg(
  leg: Partial<FlightLeg>,
  defaultDirection: "outbound" | "inbound" | "internal" = "outbound"
): FlightLeg {
  // Resolve departure airport metadata
  const rawDepInput = leg.departureCode || leg.departureCity || "";
  const depMeta = resolveAirportMetadata(rawDepInput);

  const departureCode = (leg.departureCode || depMeta.code || "DEL").trim().toUpperCase();
  const departureCity = (
    (leg.departureCode && AIRPORT_CODE_CITIES[departureCode] ? AIRPORT_CODE_CITIES[departureCode].city : leg.departureCity) ||
    depMeta.city ||
    departureCode
  ).trim();
  const departureAirport = (
    (leg.departureCode && AIRPORT_CODE_CITIES[departureCode] ? AIRPORT_CODE_CITIES[departureCode].airport : leg.departureAirport) ||
    depMeta.airport ||
    `${departureCity} Airport`
  ).trim();

  // Resolve arrival airport metadata
  const rawArrInput = leg.arrivalCode || leg.arrivalCity || "";
  const arrMeta = resolveAirportMetadata(rawArrInput);

  const arrivalCode = (leg.arrivalCode || arrMeta.code || "BOM").trim().toUpperCase();
  const arrivalCity = (
    (leg.arrivalCode && AIRPORT_CODE_CITIES[arrivalCode] ? AIRPORT_CODE_CITIES[arrivalCode].city : leg.arrivalCity) ||
    arrMeta.city ||
    arrivalCode
  ).trim();
  const arrivalAirport = (
    (leg.arrivalCode && AIRPORT_CODE_CITIES[arrivalCode] ? AIRPORT_CODE_CITIES[arrivalCode].airport : leg.arrivalAirport) ||
    arrMeta.airport ||
    `${arrivalCity} Airport`
  ).trim();

  // Normalize flight number e.g. "6e 204" -> "6E 204"
  const flightNumber = (leg.flightNumber || "").trim().toUpperCase();

  // Direction fallback
  const direction = leg.direction || defaultDirection;

  return {
    id: leg.id || "fl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
    airline: (leg.airline || "IndiGo").trim(),
    flightNumber,
    date: (leg.date || "").trim(),
    departureTime: (leg.departureTime || "08:00").trim(),
    departureCode,
    departureCity,
    departureAirport,
    arrivalTime: (leg.arrivalTime || "10:30").trim(),
    arrivalCode,
    arrivalCity,
    arrivalAirport,
    stops: leg.stops || "Non-stop",
    layover: (leg.layover || "").trim(),
    checkInBaggage: leg.checkInBaggage || "15 kg",
    cabinBaggage: leg.cabinBaggage || "7 kg",
    direction,
    journeyTitle: leg.journeyTitle || "",
  };
}

/**
 * Calculates the layover duration between arrival of legA and departure of legB.
 */
export function calculateLayover(
  legA: FlightLeg,
  legB: FlightLeg
): LayoverInfo | null {
  const rawCodeA = (legA.arrivalCode || "").trim().toUpperCase();
  const rawCodeB = (legB.departureCode || "").trim().toUpperCase();
  const resolvedCodeA = rawCodeA || resolveAirportCode(legA.arrivalCity || "");
  const resolvedCodeB = rawCodeB || resolveAirportCode(legB.departureCity || "");

  const codeA = resolvedCodeA || rawCodeA;
  const codeB = resolvedCodeB || rawCodeB;

  // If airport codes don't match, check cities
  const cityA = (legA.arrivalCity || "").trim().toLowerCase();
  const cityB = (legB.departureCity || "").trim().toLowerCase();

  const codesMatch = Boolean(codeA && codeB && codeA === codeB);
  const citiesMatch = Boolean(
    cityA &&
      cityB &&
      (cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA))
  );

  if (!codesMatch && !citiesMatch) {
    return null;
  }

  const stopCode = codeA || codeB;
  const airportMeta = resolveAirportMetadata(stopCode);
  const stopCity = legA.arrivalCity || legB.departureCity || airportMeta.city || stopCode;
  const stopAirportName = airportMeta.airport || `${stopCity} Airport`;

  // Compute duration if times are available
  let durationFormatted = "";
  let durationMinutes = 0;
  let isOvernight = false;

  const depTimeA = legA.departureTime ? legA.departureTime.trim() : "";
  const arrTimeA = legA.arrivalTime ? legA.arrivalTime.trim() : "";
  const depTimeB = legB.departureTime ? legB.departureTime.trim() : "";

  if (arrTimeA && depTimeB) {
    const minDepA = parseTimeToMinutes(depTimeA);
    const minArrA = parseTimeToMinutes(arrTimeA);
    const minDepB = parseTimeToMinutes(depTimeB);

    if (minArrA !== null && minDepB !== null) {
      let dateA = legA.date ? legA.date.trim() : "";
      const dateB = legB.date ? legB.date.trim() : "";

      // If Leg A crossed midnight, its actual arrival date is dateA + 1 day
      if (dateA && minDepA !== null && minArrA < minDepA) {
        dateA = addDaysToYmd(dateA, 1);
      }

      let diffMinutes = 0;

      if (dateA && dateB) {
        const dayDiff = getDaysDiff(dateA, dateB);
        diffMinutes = minDepB + dayDiff * 24 * 60 - minArrA;
        if (dayDiff > 0) {
          isOvernight = true;
        } else if (dayDiff === 0 && minDepB < minArrA) {
          diffMinutes += 24 * 60;
          isOvernight = true;
        }
      } else {
        diffMinutes = minDepB - minArrA;
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60;
          isOvernight = true;
        }
      }

      if (diffMinutes > 0 && diffMinutes < 48 * 60) {
        durationMinutes = diffMinutes;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        durationFormatted = `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
        if (isOvernight && hours >= 6) {
          durationFormatted = `Overnight (${durationFormatted})`;
        }
      }
    }
  }

  // Fallback to legA's layover text if provided manually
  if (!durationFormatted && legA.layover) {
    durationFormatted = legA.layover;
  }
  if (!durationFormatted && legB.layover) {
    durationFormatted = legB.layover;
  }
  if (!durationFormatted) {
    durationFormatted = "Transit";
  }

  const connectionLabel = durationFormatted.toLowerCase().includes("connection")
    ? `${durationFormatted} in ${stopCity} (${stopCode})`
    : `${durationFormatted} connection in ${stopCity} (${stopCode})`;

  return {
    airportCode: stopCode,
    airportCity: stopCity,
    airportName: stopAirportName,
    durationFormatted,
    durationMinutes,
    isOvernight,
    transitNote: isOvernight
      ? "Overnight transit connection • Please verify transit accommodation"
      : "Baggage checked through to final destination",
    connectionLabel,
  };
}

/**
 * Formats a clean human-readable route summary from a list of flight legs.
 * E.g. "DEL ➔ PQC (1 Stop via HAN)" or "DEL ➔ DPS (Non-stop)"
 */
export function formatFlightRouteSummary(legs: FlightLeg[]): string {
  if (!legs || legs.length === 0) return "";
  const origin = legs[0].departureCode || "Origin";
  const destination = legs[legs.length - 1].arrivalCode || "Destination";

  if (legs.length === 1) {
    return `${origin} ➔ ${destination} (Non-stop)`;
  }

  const hubs = legs
    .slice(0, legs.length - 1)
    .map((l) => l.arrivalCode)
    .filter(Boolean)
    .join(", ");

  const stopCount = legs.length - 1;
  return `${origin} ➔ ${destination} (${stopCount} Stop${stopCount > 1 ? "s" : ""} via ${hubs})`;
}

/**
 * Automatically groups and classifies flight legs into human journeys (Outbound, Inbound, Internal).
 * Partitions chains, calculates transit layovers, and computes route summaries.
 */
export function groupFlightsByJourney(
  flights: FlightLeg[],
  destinations: string[] = [],
  startDate?: string | null
): GroupedJourneys {
  if (!flights || flights.length === 0) {
    return {
      outbound: [],
      inbound: [],
      internal: [],
      allJourneys: [],
      totalLegs: 0,
      hasConnecting: false,
      summary: { outboundRoute: "", returnRoute: "" },
    };
  }

  // 1. Normalize each flight leg
  const normalizedLegs = flights.map((f, idx) => ({
    ...normalizeFlightLeg(f),
    originalIndex: idx,
  }));

  // 2. Identify destination codes/cities
  const normalizedDests = destinations.map((d) => {
    const code = resolveAirportCode(d);
    return {
      code: code ? code.toUpperCase() : "",
      name: d.toLowerCase().trim(),
    };
  });

  // 3. Establish origin code (defaults to departure of first flight)
  const originCode = (normalizedLegs[0]?.departureCode || "DEL").toUpperCase();

  // 4. Infer direction for each leg
  const directions: ("outbound" | "inbound" | "internal")[] = normalizedLegs.map((leg, idx) => {
    const rawDirection = flights[idx]?.direction;

    // If caller explicitly set inbound or internal, honor it directly
    if (rawDirection === "inbound" || rawDirection === "internal") {
      return rawDirection;
    }

    const depCode = leg.departureCode.toUpperCase();
    const arrCode = leg.arrivalCode.toUpperCase();
    const arrCity = leg.arrivalCity.toLowerCase();
    const depCity = leg.departureCity.toLowerCase();

    const isDepOrigin = depCode === originCode;
    const isArrOrigin = arrCode === originCode;
    const isArrDest = normalizedDests.some(
      (d) => (d.code && d.code === arrCode) || (d.name && arrCity.includes(d.name))
    );
    const isDepDest = normalizedDests.some(
      (d) => (d.code && d.code === depCode) || (d.name && depCity.includes(d.name))
    );

    // If arriving at origin or departing from destination, it is definitely inbound
    if (isArrOrigin || isDepDest) {
      return "inbound";
    }
    // If departing from origin or arriving at destination, it is definitely outbound
    if (isDepOrigin || isArrDest) {
      return "outbound";
    }
    // If rawDirection was explicitly outbound and doesn't contradict returning to origin
    if (rawDirection === "outbound" && !isArrOrigin && !isDepDest) {
      return "outbound";
    }
    // Fallback: Last leg in multi-leg list defaults to inbound
    if (idx > 0 && idx === normalizedLegs.length - 1 && normalizedLegs.length >= 2) {
      return "inbound";
    }
    return idx === 0 ? "outbound" : "internal";
  });

  // Direction propagation: Connecting legs share the journey direction
  for (let i = 0; i < normalizedLegs.length - 1; i++) {
    const curr = normalizedLegs[i];
    const next = normalizedLegs[i + 1];
    if (calculateLayover(curr, next)) {
      if (directions[i] === "inbound" && directions[i + 1] === "internal") {
        directions[i + 1] = "inbound";
      }
      if (directions[i + 1] === "inbound" && directions[i] === "internal") {
        directions[i] = "inbound";
      }
      if (directions[i] === "outbound" && directions[i + 1] === "internal") {
        directions[i + 1] = "outbound";
      }
    }
  }

  const legsWithDirection = normalizedLegs.map((leg, idx) => ({
    ...leg,
    direction: directions[idx],
  }));

  // 5. Identify connected flight chains
  const chains: FlightLeg[][] = [];
  let currentChain: FlightLeg[] = [];

  for (let i = 0; i < legsWithDirection.length; i++) {
    const current = legsWithDirection[i];
    if (currentChain.length === 0) {
      currentChain.push(current);
    } else {
      const prev = currentChain[currentChain.length - 1];
      const isConn = Boolean(calculateLayover(prev, current));
      const directionMatches = prev.direction === current.direction;

      if (isConn && directionMatches) {
        currentChain.push(current);
      } else {
        chains.push(currentChain);
        currentChain = [current];
      }
    }
  }
  if (currentChain.length > 0) {
    chains.push(currentChain);
  }

  // 6. Build enriched FlightJourneyGroups
  const allJourneys: FlightJourneyGroup[] = chains.map((chain, chainIndex) => {
    const firstLeg = chain[0];
    const lastLeg = chain[chain.length - 1];
    const direction = firstLeg.direction || "outbound";

    const directionLabel =
      direction === "outbound"
        ? "Onward Flight (Going)"
        : direction === "inbound"
        ? "Return Flight (Returning)"
        : "Inter-City Flight";

    // Collect layovers between adjacent legs
    const layovers: LayoverInfo[] = [];
    for (let k = 0; k < chain.length - 1; k++) {
      const lay = calculateLayover(chain[k], chain[k + 1]);
      if (lay) {
        layovers.push(lay);
      }
    }

    const enrichedLegs: FlightLegEnriched[] = chain.map((leg, idx) => {
      const duration = calculateFlightDuration(
        leg.departureTime,
        leg.arrivalTime,
        leg.date,
        leg.date
      );
      const nextLay = idx < chain.length - 1 ? layovers[idx] : undefined;

      return {
        ...leg,
        direction,
        flightDuration: duration.formatted,
        flightDurationMinutes: duration.minutes,
        legSequenceIndex: idx + 1,
        totalLegsInJourney: chain.length,
        isFirstLeg: idx === 0,
        isLastLeg: idx === chain.length - 1,
        nextLegLayover: nextLay,
      };
    });

    return {
      id: `journey_${chainIndex}_${firstLeg.id || firstLeg.flightNumber || idxString(chainIndex)}`,
      direction,
      directionLabel,
      originCode: firstLeg.departureCode,
      originCity: firstLeg.departureCity,
      destinationCode: lastLeg.arrivalCode,
      destinationCity: lastLeg.arrivalCity,
      departureDate: firstLeg.date || startDate || "",
      isConnecting: chain.length > 1,
      layovers,
      legs: enrichedLegs,
    };
  });

  // 7. Partition into outbound, inbound, and internal
  const outbound = allJourneys.filter((j) => j.direction === "outbound");
  const inbound = allJourneys.filter((j) => j.direction === "inbound");
  const internal = allJourneys.filter((j) => j.direction === "internal");

  const outboundLegs = outbound.flatMap((j) => j.legs);
  const inboundLegs = inbound.flatMap((j) => j.legs);

  const outboundRoute = formatFlightRouteSummary(outboundLegs);
  const returnRoute = formatFlightRouteSummary(inboundLegs);

  const hasConnecting = allJourneys.some((j) => j.isConnecting);

  return {
    outbound,
    inbound,
    internal,
    allJourneys,
    totalLegs: normalizedLegs.length,
    hasConnecting,
    summary: {
      outboundRoute,
      returnRoute,
    },
  };
}

/**
 * Backward-compatible analyzer that returns array of journey groups.
 */
export function analyzeFlightJourneys(
  flights: FlightLeg[],
  destinations: string[] = []
): FlightJourneyGroup[] {
  const grouped = groupFlightsByJourney(flights, destinations);
  return grouped.allJourneys;
}

export interface FlightPdfPage {
  pageIndex: number;
  journeys: {
    journey: FlightJourneyGroup;
    legs: FlightJourneyGroup["legs"];
  }[];
}

/**
 * Paginates journeys for A4 PDF rendering.
 * Guarantees at most 2 flight cards per page so the content never exceeds page bounds or pushes footers.
 */
export function paginateFlightJourneys(
  flights: FlightLeg[],
  destinations: string[] = []
): FlightPdfPage[] {
  if (!flights || flights.length === 0) return [];

  const journeys = analyzeFlightJourneys(flights, destinations);
  if (journeys.length === 0) return [];

  // Special case: Total 2 direct legs across all journeys (e.g. 1 direct outbound + 1 direct inbound)
  const totalLegs = journeys.reduce((sum, j) => sum + j.legs.length, 0);
  const hasMultiLeg = journeys.some((j) => j.legs.length > 1);

  if (!hasMultiLeg && totalLegs <= 2) {
    return [
      {
        pageIndex: 0,
        journeys: journeys.map((j) => ({
          journey: j,
          legs: j.legs,
        })),
      },
    ];
  }

  const pages: FlightPdfPage[] = [];
  let currentPageJourneys: { journey: FlightJourneyGroup; legs: FlightJourneyGroup["legs"] }[] = [];
  let currentPageLegCount = 0;

  for (const j of journeys) {
    // If the journey has > 2 legs, chunk its legs in groups of 2
    if (j.legs.length > 2) {
      if (currentPageJourneys.length > 0) {
        pages.push({ pageIndex: pages.length, journeys: currentPageJourneys });
        currentPageJourneys = [];
        currentPageLegCount = 0;
      }
      for (let k = 0; k < j.legs.length; k += 2) {
        const slice = j.legs.slice(k, k + 2);
        pages.push({
          pageIndex: pages.length,
          journeys: [{ journey: j, legs: slice }],
        });
      }
      continue;
    }

    // If adding this journey's legs exceeds 2 legs on current page, start new page
    if (currentPageLegCount > 0 && currentPageLegCount + j.legs.length > 2) {
      pages.push({ pageIndex: pages.length, journeys: currentPageJourneys });
      currentPageJourneys = [];
      currentPageLegCount = 0;
    }

    currentPageJourneys.push({ journey: j, legs: j.legs });
    currentPageLegCount += j.legs.length;
  }

  if (currentPageJourneys.length > 0) {
    pages.push({ pageIndex: pages.length, journeys: currentPageJourneys });
  }

  return pages;
}

function idxString(i: number): string {
  return String(i + 1).padStart(2, "0");
}
