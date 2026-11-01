import {
  calculateLayover,
  analyzeFlightJourneys,
  paginateFlightJourneys,
  calculateFlightDuration,
  normalizeFlightLeg,
  groupFlightsByJourney,
} from "./journey";
import { resolveAirportMetadata, resolveAirportCode } from "./airports";
import { FlightLeg } from "@/lib/schema/itinerary";

function createLeg(partial: Partial<FlightLeg>): FlightLeg {
  return {
    airline: "IndiGo",
    flightNumber: "6E-101",
    date: "2026-11-15",
    departureTime: "06:00",
    departureCode: "DEL",
    departureCity: "New Delhi",
    departureAirport: "Indira Gandhi International Airport",
    arrivalTime: "08:45",
    arrivalCode: "BLR",
    arrivalCity: "Bengaluru",
    arrivalAirport: "Kempegowda International Airport",
    stops: "Non-stop",
    layover: "",
    checkInBaggage: "15 kg",
    cabinBaggage: "7 kg",
    direction: "outbound",
    journeyTitle: "",
    ...partial,
  };
}

console.log("--- TEST 1: calculateLayover direct match DEL->BLR + BLR->DPS ---");
const leg1 = createLeg({
  departureCode: "DEL",
  departureCity: "New Delhi",
  departureTime: "06:00",
  arrivalCode: "BLR",
  arrivalCity: "Bengaluru",
  arrivalTime: "08:45",
});

const leg2 = createLeg({
  departureCode: "BLR",
  departureCity: "Bengaluru",
  departureTime: "11:30",
  arrivalCode: "DPS",
  arrivalCity: "Bali",
  arrivalTime: "19:15",
  airline: "AirAsia",
  flightNumber: "FD-401",
});

const layover = calculateLayover(leg1, leg2);
console.log("Calculated layover:", layover);
if (!layover || layover.airportCode !== "BLR" || !layover.durationFormatted.includes("2h 45m")) {
  throw new Error(`Test 1 Failed: Expected 2h 45m layover in BLR, got: ${JSON.stringify(layover)}`);
}
console.log("✓ Test 1 Passed!");

console.log("--- TEST 2: analyzeFlightJourneys with Multi-Leg Connecting Flights ---");
const returnLeg1 = createLeg({
  direction: "inbound",
  departureCode: "DPS",
  departureCity: "Bali",
  departureTime: "10:00",
  arrivalCode: "KUL",
  arrivalCity: "Kuala Lumpur",
  arrivalTime: "13:00",
  date: "2026-11-22",
});

const returnLeg2 = createLeg({
  direction: "inbound",
  departureCode: "KUL",
  departureCity: "Kuala Lumpur",
  departureTime: "16:45",
  arrivalCode: "DEL",
  arrivalCity: "New Delhi",
  arrivalTime: "20:00",
  date: "2026-11-22",
});

const journeys = analyzeFlightJourneys([leg1, leg2, returnLeg1, returnLeg2], ["Bali"]);
console.log(`Journeys count: ${journeys.length}`);
console.log("Journey 1:", journeys[0]?.direction, journeys[0]?.directionLabel, journeys[0]?.originCode, "->", journeys[0]?.destinationCode, "Layovers:", journeys[0]?.layovers);
console.log("Journey 2:", journeys[1]?.direction, journeys[1]?.directionLabel, journeys[1]?.originCode, "->", journeys[1]?.destinationCode, "Layovers:", journeys[1]?.layovers);

if (journeys.length !== 2) {
  throw new Error(`Expected 2 journeys (1 outbound, 1 inbound), got ${journeys.length}`);
}
if (journeys[0].direction !== "outbound" || !journeys[0].isConnecting || journeys[0].legs.length !== 2) {
  throw new Error(`Outbound journey mismatch: ${JSON.stringify(journeys[0])}`);
}
if (journeys[1].direction !== "inbound" || !journeys[1].isConnecting || journeys[1].legs.length !== 2) {
  throw new Error(`Inbound journey mismatch: ${JSON.stringify(journeys[1])}`);
}
console.log("✓ Test 2 Passed!");

console.log("--- TEST 3: paginateFlightJourneys page counts ---");
// Case A: 2 direct legs (1 outbound, 1 inbound)
const directOut = createLeg({ departureCode: "DEL", arrivalCode: "DPS", direction: "outbound" });
const directIn = createLeg({ departureCode: "DPS", arrivalCode: "DEL", direction: "inbound" });
const pagesCaseA = paginateFlightJourneys([directOut, directIn], ["Bali"]);
console.log("Case A (2 direct flights) pages count:", pagesCaseA.length);
if (pagesCaseA.length !== 1) {
  throw new Error(`Expected 1 page for 2 direct flights, got ${pagesCaseA.length}`);
}

// Case B: Connecting Outbound (2 legs) + Direct Inbound (1 leg)
const pagesCaseB = paginateFlightJourneys([leg1, leg2, directIn], ["Bali"]);
console.log("Case B (2 connecting outbound + 1 direct inbound) pages count:", pagesCaseB.length);
if (pagesCaseB.length !== 2) {
  throw new Error(`Expected 2 pages for Case B, got ${pagesCaseB.length}`);
}

// Case C: Connecting Outbound (2 legs) + Connecting Inbound (2 legs)
const pagesCaseC = paginateFlightJourneys([leg1, leg2, returnLeg1, returnLeg2], ["Bali"]);
console.log("Case C (2 connecting outbound + 2 connecting inbound) pages count:", pagesCaseC.length);
if (pagesCaseC.length !== 2) {
  throw new Error(`Expected 2 pages for Case C, got ${pagesCaseC.length}`);
}
console.log("✓ Test 3 Passed!");

console.log("--- TEST 4: Automatic Layover Detection when Legs added manually without direction tags ---");
const manualLeg1 = createLeg({
  departureCode: "DEL",
  departureCity: "New Delhi",
  departureTime: "07:00",
  arrivalCode: "BLR",
  arrivalCity: "Bengaluru",
  arrivalTime: "09:40",
  direction: undefined,
});
const manualLeg2 = createLeg({
  departureCode: "BLR",
  departureCity: "Bengaluru",
  departureTime: "12:15",
  arrivalCode: "DPS",
  arrivalCity: "Bali",
  arrivalTime: "20:00",
  direction: undefined,
});

const manualJourneys = analyzeFlightJourneys([manualLeg1, manualLeg2], ["Bali"]);
console.log("Manual journeys detected:", manualJourneys.length);
if (manualJourneys.length !== 1) {
  throw new Error(`Expected 1 journey, got ${manualJourneys.length}`);
}
if (!manualJourneys[0].isConnecting) {
  throw new Error("Expected isConnecting to be true for DEL->BLR + BLR->DPS");
}
if (manualJourneys[0].layovers.length !== 1 || manualJourneys[0].layovers[0].airportCode !== "BLR") {
  throw new Error(`Expected 1 layover at BLR, got: ${JSON.stringify(manualJourneys[0].layovers)}`);
}
console.log("Auto-detected layover:", manualJourneys[0].layovers[0]);
console.log("✓ Test 4 Passed!");

console.log("--- TEST 5: Airport Metadata Resolution (resolveAirportMetadata) ---");
const metaDEL = resolveAirportMetadata("DEL");
if (metaDEL.code !== "DEL" || metaDEL.city !== "New Delhi" || !metaDEL.airport.includes("Indira Gandhi")) {
  throw new Error(`Expected DEL metadata, got: ${JSON.stringify(metaDEL)}`);
}

const metaPQC = resolveAirportMetadata("phu quoc");
if (metaPQC.code !== "PQC" || metaPQC.city !== "Phu Quoc" || !metaPQC.airport.includes("Phu Quoc")) {
  throw new Error(`Expected PQC metadata for 'phu quoc', got: ${JSON.stringify(metaPQC)}`);
}

const metaParen = resolveAirportMetadata("Bengaluru (BLR)");
if (metaParen.code !== "BLR" || metaParen.city !== "Bengaluru") {
  throw new Error(`Expected BLR metadata for 'Bengaluru (BLR)', got: ${JSON.stringify(metaParen)}`);
}

const metaFallback = resolveAirportMetadata("XYZ");
if (metaFallback.code !== "XYZ" || metaFallback.city !== "XYZ") {
  throw new Error(`Expected XYZ fallback metadata, got: ${JSON.stringify(metaFallback)}`);
}
console.log("✓ Test 5 Passed!");

console.log("--- TEST 6: Flight Duration Computation (calculateFlightDuration) ---");
const dur1 = calculateFlightDuration("00:05", "05:35");
if (dur1.formatted !== "5h 30m" || dur1.minutes !== 330) {
  throw new Error(`Expected 5h 30m, got ${JSON.stringify(dur1)}`);
}

// Cross-midnight flight
const durMidnight = calculateFlightDuration("22:15", "02:45");
if (durMidnight.formatted !== "4h 30m" || durMidnight.minutes !== 270) {
  throw new Error(`Expected 4h 30m cross-midnight, got ${JSON.stringify(durMidnight)}`);
}

// Explicit next-day dates
const durNextDay = calculateFlightDuration("23:00", "07:00", "2026-11-15", "2026-11-16");
if (durNextDay.formatted !== "8h" || durNextDay.minutes !== 480) {
  throw new Error(`Expected 8h for multi-day flight, got ${JSON.stringify(durNextDay)}`);
}
console.log("✓ Test 6 Passed!");

console.log("--- TEST 7: Flight Leg Normalization (normalizeFlightLeg) ---");
const minimalLeg = normalizeFlightLeg({
  flightNumber: "vj 972",
  departureCode: "DEL",
  arrivalCode: "PQC",
});
if (minimalLeg.flightNumber !== "VJ 972") {
  throw new Error(`Expected uppercase flight number VJ 972, got ${minimalLeg.flightNumber}`);
}
if (minimalLeg.departureCity !== "New Delhi" || !minimalLeg.departureAirport.includes("Indira Gandhi")) {
  throw new Error(`Expected auto-derived Delhi departure metadata, got ${minimalLeg.departureCity} / ${minimalLeg.departureAirport}`);
}
if (minimalLeg.arrivalCity !== "Phu Quoc" || !minimalLeg.arrivalAirport.includes("Phu Quoc")) {
  throw new Error(`Expected auto-derived Phu Quoc arrival metadata, got ${minimalLeg.arrivalCity} / ${minimalLeg.arrivalAirport}`);
}
if (!minimalLeg.checkInBaggage || !minimalLeg.cabinBaggage) {
  throw new Error(`Expected default baggage allowances to be populated`);
}
console.log("✓ Test 7 Passed!");

console.log("--- TEST 8: Journey Partitioning & Auto-Direction Detection (groupFlightsByJourney) ---");
// 4 legs connecting roundtrip: DEL -> HAN -> PQC (Outbound) and PQC -> HAN -> DEL (Inbound)
// Directions are intentionally left undefined to test auto-inference
const roundtripLegs: FlightLeg[] = [
  createLeg({
    airline: "VietJet Air",
    flightNumber: "VJ 972",
    departureCode: "DEL",
    departureTime: "00:05",
    arrivalCode: "HAN",
    arrivalTime: "05:35",
    direction: undefined,
  }),
  createLeg({
    airline: "VietJet Air",
    flightNumber: "VJ 449",
    departureCode: "HAN",
    departureTime: "10:10",
    arrivalCode: "PQC",
    arrivalTime: "12:15",
    direction: undefined,
  }),
  createLeg({
    airline: "VietJet Air",
    flightNumber: "VJ 450",
    departureCode: "PQC",
    departureTime: "14:00",
    arrivalCode: "HAN",
    arrivalTime: "16:10",
    direction: undefined,
  }),
  createLeg({
    airline: "VietJet Air",
    flightNumber: "VJ 971",
    departureCode: "HAN",
    departureTime: "19:25",
    arrivalCode: "DEL",
    arrivalTime: "22:40",
    direction: undefined,
  }),
];

const grouped = groupFlightsByJourney(roundtripLegs, ["Phu Quoc"]);

if (grouped.outbound.length !== 1 || grouped.inbound.length !== 1) {
  throw new Error(`Expected 1 outbound and 1 inbound journey, got ${grouped.outbound.length} out / ${grouped.inbound.length} in`);
}
if (!grouped.hasConnecting) {
  throw new Error("Expected hasConnecting to be true");
}
if (grouped.outbound[0].legs.length !== 2 || grouped.inbound[0].legs.length !== 2) {
  throw new Error(`Expected 2 legs per journey, got out=${grouped.outbound[0].legs.length}, in=${grouped.inbound[0].legs.length}`);
}

// Check layover in Hanoi
const outLayover = grouped.outbound[0].layovers[0];
if (!outLayover || outLayover.airportCode !== "HAN" || !outLayover.durationFormatted.includes("4h 35m")) {
  throw new Error(`Expected 4h 35m layover in HAN for outbound, got ${JSON.stringify(outLayover)}`);
}

const inLayover = grouped.inbound[0].layovers[0];
if (!inLayover || inLayover.airportCode !== "HAN" || !inLayover.durationFormatted.includes("3h 15m")) {
  throw new Error(`Expected 3h 15m layover in HAN for inbound, got ${JSON.stringify(inLayover)}`);
}

// Check route summaries
if (!grouped.summary.outboundRoute.includes("DEL ➔ PQC (1 Stop via HAN)")) {
  throw new Error(`Expected outbound route summary 'DEL ➔ PQC (1 Stop via HAN)', got ${grouped.summary.outboundRoute}`);
}
if (!grouped.summary.returnRoute.includes("PQC ➔ DEL (1 Stop via HAN)")) {
  throw new Error(`Expected return route summary 'PQC ➔ DEL (1 Stop via HAN)', got ${grouped.summary.returnRoute}`);
}

console.log("Grouped Outbound route summary:", grouped.summary.outboundRoute);
console.log("Grouped Return route summary:", grouped.summary.returnRoute);
console.log("✓ Test 8 Passed!");

console.log("--- TEST 9: Cross-Midnight Flight Layover Calculation (ATQ->KUL + KUL->DPS) ---");
const crossMidnightLeg1 = createLeg({
  departureCode: "ATQ",
  departureCity: "Amritsar",
  departureTime: "20:00",
  arrivalCode: "KUL",
  arrivalCity: "Kuala Lumpur",
  arrivalTime: "04:20",
  date: "2026-12-02",
});
const crossMidnightLeg2 = createLeg({
  departureCode: "KUL",
  departureCity: "Kuala Lumpur",
  departureTime: "09:00",
  arrivalCode: "DPS",
  arrivalCity: "Bali",
  arrivalTime: "12:00",
  date: "2026-12-03",
});

const crossLayover = calculateLayover(crossMidnightLeg1, crossMidnightLeg2);
console.log("Cross midnight layover:", crossLayover);
if (!crossLayover || crossLayover.durationFormatted !== "4h 40m" || crossLayover.isOvernight) {
  throw new Error(`Test 9 Failed: Expected 4h 40m layover, got ${JSON.stringify(crossLayover)}`);
}
console.log("✓ Test 9 Passed!");

console.log("All flight journey unit tests passed successfully!");
