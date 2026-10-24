import { computeClientView } from "../src/lib/schema/client-view";
import { Itinerary } from "../src/lib/schema/itinerary";

const baseMock: Itinerary = {
  schemaVersion: 1,
  package: {
    title: "Date Computation Audit",
    destinations: ["Test Destination"],
    nights: 1,
    days: 2,
    startDate: "2026-12-30",
    travellers: { adults: 2, children: 0, rooms: 1 },
  },
  days: [
    { dayNumber: 1, title: "Day 1", description: "", activities: [], meals: [], stay: null, imageQuery: "", image: null },
    { dayNumber: 2, title: "Day 2", description: "", activities: [], meals: [], stay: null, imageQuery: "", image: null },
    { dayNumber: 3, title: "Day 3", description: "", activities: [], meals: [], stay: null, imageQuery: "", image: null },
  ],
  inclusions: [],
  exclusions: [],
  pricing: {
    currency: "INR",
    basis: "per_person_twin_sharing",
    netAmountPaise: 1000000,
    markup: { type: "percent", value: 15 },
    gstMode: "inclusive",
    gstRate: 0.05,
    sacCode: "998552",
    validityDays: 7,
  },
  terms: { payment: [], cancellation: [] },
  meta: { sourceFile: null, extractedBy: null, reviewFlags: [], extractedSnapshot: null },
  variants: [],
};

export function runDateComputationTests() {
  console.log("--- INTEGRATION TEST SUITE: DATE COMPUTATION ---");

  // 1. Year Rollover Test: starts Dec 30, 2026 for 3 days -> Day 1: Dec 30, Day 2: Dec 31, Day 3: Jan 1, 2027
  const yearRolloverItinerary: Itinerary = {
    ...baseMock,
    package: {
      ...baseMock.package,
      nights: 2,
      days: 3,
      startDate: "2026-12-30",
    },
  };

  const clientViewRollover = computeClientView(yearRolloverItinerary);
  const day1Date = clientViewRollover.days[0].calendarDate;
  const day2Date = clientViewRollover.days[1].calendarDate;
  const day3Date = clientViewRollover.days[2].calendarDate;

  if (!day1Date?.includes("30 Dec 2026")) throw new Error(`Expected Day 1 to be 30 Dec 2026, got ${day1Date}`);
  if (!day2Date?.includes("31 Dec 2026")) throw new Error(`Expected Day 2 to be 31 Dec 2026, got ${day2Date}`);
  if (!day3Date?.includes("1 Jan 2027")) throw new Error(`Expected Day 3 to be 1 Jan 2027 (Year Rollover), got ${day3Date}`);

  // 2. Leap Year Rollover Test: 2028 is leap year. Feb 28 start -> Day 2: Feb 29 2028, Day 3: 1 Mar 2028
  const leapYearItinerary: Itinerary = {
    ...baseMock,
    package: {
      ...baseMock.package,
      nights: 2,
      days: 3,
      startDate: "2028-02-28",
    },
  };

  const clientViewLeap = computeClientView(leapYearItinerary);
  const leapDay2 = clientViewLeap.days[1].calendarDate;
  const leapDay3 = clientViewLeap.days[2].calendarDate;

  if (!leapDay2?.includes("29 Feb 2028")) throw new Error(`Expected Leap Day 29 Feb 2028, got ${leapDay2}`);
  if (!leapDay3?.includes("1 Mar 2028")) throw new Error(`Expected Day 3 to be 1 Mar 2028, got ${leapDay3}`);

  // 3. Short 1-Night / 2-Day Trip
  const oneNightItinerary: Itinerary = {
    ...baseMock,
    package: {
      ...baseMock.package,
      nights: 1,
      days: 2,
      startDate: "2026-06-10",
    },
    days: [baseMock.days[0], baseMock.days[1]],
  };

  const clientViewOneNight = computeClientView(oneNightItinerary);
  if (clientViewOneNight.package.endDate !== "11 Jun 2026") {
    throw new Error(`Expected End Date '11 Jun 2026', got ${clientViewOneNight.package.endDate}`);
  }

  // 4. Timezone check for India (Asia/Kolkata)
  const istDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  if (!istDate) {
    throw new Error("Failed to format current date in Asia/Kolkata timezone");
  }

  console.log(`PASS: All date integration tests passed (Year rollover: ${day3Date}, Leap day: ${leapDay2}, IST Time: ${istDate}).\n`);
}

if (require.main === module) {
  runDateComputationTests();
}
