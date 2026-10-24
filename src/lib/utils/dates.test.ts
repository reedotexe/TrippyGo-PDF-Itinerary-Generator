import assert from "node:assert/strict";
import {
  computeTripDates,
  getKolkataToday,
  parseDateSafe,
  formatDateEnGb,
  formatWeekday,
} from "./dates";

console.log("=== RUNNING DATE COMPUTATION INTEGRATION TEST SUITE ===\n");

// 1. Asia/Kolkata "Today" calculation
console.log("[Test 1] Testing Asia/Kolkata timezone anchor...");
const kolkata = getKolkataToday();
assert.ok(kolkata.iso.match(/^\d{4}-\d{2}-\d{2}$/), "ISO date format must be YYYY-MM-DD");
assert.ok(kolkata.year >= 2026, "Year should be >= 2026");
assert.ok(kolkata.month >= 1 && kolkata.month <= 12, "Month between 1 and 12");
assert.ok(kolkata.day >= 1 && kolkata.day <= 31, "Day between 1 and 31");
console.log(`  -> Current Asia/Kolkata Date: ${kolkata.iso} (Passed)`);

// 2. Year Rollover Test: 30 Dec 2026 start for 5-day trip (4 nights)
console.log("[Test 2] Testing Year Rollover across 31 Dec -> 01 Jan boundary...");
const rolloverTrip = computeTripDates({
  startDate: "2026-12-30",
  daysCount: 5,
  nights: 4,
  validityDays: 7,
});

assert.equal(rolloverTrip.startDateFormatted, "30 Dec 2026");
assert.equal(rolloverTrip.endDateFormatted, "3 Jan 2027");
assert.equal(rolloverTrip.days.length, 5);

// Check sequential days across new year
assert.equal(rolloverTrip.days[0].calendarDate, "30 Dec 2026");
assert.equal(rolloverTrip.days[0].weekday, "Wednesday");
assert.equal(rolloverTrip.days[0].isoDate, "2026-12-30");

assert.equal(rolloverTrip.days[1].calendarDate, "31 Dec 2026");
assert.equal(rolloverTrip.days[1].weekday, "Thursday");
assert.equal(rolloverTrip.days[1].isoDate, "2026-12-31");

assert.equal(rolloverTrip.days[2].calendarDate, "1 Jan 2027");
assert.equal(rolloverTrip.days[2].weekday, "Friday");
assert.equal(rolloverTrip.days[2].isoDate, "2027-01-01");

assert.equal(rolloverTrip.days[3].calendarDate, "2 Jan 2027");
assert.equal(rolloverTrip.days[3].weekday, "Saturday");
assert.equal(rolloverTrip.days[3].isoDate, "2027-01-02");

assert.equal(rolloverTrip.days[4].calendarDate, "3 Jan 2027");
assert.equal(rolloverTrip.days[4].weekday, "Sunday");
assert.equal(rolloverTrip.days[4].isoDate, "2027-01-03");
console.log("  -> 2026 to 2027 Year Rollover validated successfully.");

// 3. Leap Year Test: 28 Feb 2028 (2028 is a leap year) for 3-day trip
console.log("[Test 3] Testing Leap Year calculation (28 Feb 2028 leap year)...");
const leapTrip = computeTripDates({
  startDate: "2028-02-28",
  daysCount: 3,
  nights: 2,
});

assert.equal(leapTrip.startDateFormatted, "28 Feb 2028");
assert.equal(leapTrip.endDateFormatted, "1 Mar 2028");
assert.equal(leapTrip.days.length, 3);

assert.equal(leapTrip.days[0].calendarDate, "28 Feb 2028");
assert.equal(leapTrip.days[0].weekday, "Monday");

assert.equal(leapTrip.days[1].calendarDate, "29 Feb 2028");
assert.equal(leapTrip.days[1].weekday, "Tuesday");
assert.equal(leapTrip.days[1].isoDate, "2028-02-29");

assert.equal(leapTrip.days[2].calendarDate, "1 Mar 2028");
assert.equal(leapTrip.days[2].weekday, "Wednesday");
assert.equal(leapTrip.days[2].isoDate, "2028-03-01");
console.log("  -> 29 Feb leap day correctly computed.");

// 4. Common (Non-Leap) Year Test: 28 Feb 2027 for 2-day trip
console.log("[Test 4] Testing Non-Leap Year calculation (28 Feb 2027)...");
const nonLeapTrip = computeTripDates({
  startDate: "2027-02-28",
  daysCount: 2,
  nights: 1,
});

assert.equal(nonLeapTrip.days[0].calendarDate, "28 Feb 2027");
assert.equal(nonLeapTrip.days[0].weekday, "Sunday");

assert.equal(nonLeapTrip.days[1].calendarDate, "1 Mar 2027");
assert.equal(nonLeapTrip.days[1].weekday, "Monday");
assert.equal(nonLeapTrip.days[1].isoDate, "2027-03-01");
console.log("  -> 28 Feb 2027 rolls over directly to 1 Mar 2027.");

// 5. 1-Night Trip Test: 2 days, 1 night
console.log("[Test 5] Testing 1-night trip calculation...");
const weekendTrip = computeTripDates({
  startDate: "2026-11-14",
  daysCount: 2,
  nights: 1,
});

assert.equal(weekendTrip.startDateFormatted, "14 Nov 2026");
assert.equal(weekendTrip.endDateFormatted, "15 Nov 2026");
assert.equal(weekendTrip.days.length, 2);
console.log("  -> 1-night trip duration correctly calculated.");

// 6. Flexible Dates (startDate = null)
console.log("[Test 6] Testing Flexible Dates (startDate = null)...");
const flexTrip = computeTripDates({
  startDate: null,
  daysCount: 4,
  validityDays: 10,
});

assert.equal(flexTrip.startDateFormatted, null);
assert.equal(flexTrip.endDateFormatted, null);
assert.ok(flexTrip.validUntilFormatted.length > 5, "Quote validity should still be generated");
assert.equal(flexTrip.days.length, 4);
assert.equal(flexTrip.days[0].calendarDate, null);
console.log("  -> Flexible dates handled gracefully with null labels.");

console.log("\nPASS: ALL DATE COMPUTATION TESTS PASSED 100%!\n");
