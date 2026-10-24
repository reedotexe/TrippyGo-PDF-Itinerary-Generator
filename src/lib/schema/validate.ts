import { Itinerary, ItinerarySchema } from "./itinerary";

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  data?: Itinerary;
  errors?: ValidationError[];
}

/**
 * Validates raw data against the Zod ItinerarySchema and checks structural consistency
 */
export function validateItinerary(data: unknown): ValidationResult {
  const result = ItinerarySchema.safeParse(data);

  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));

    return {
      success: false,
      errors,
    };
  }

  const itinerary = result.data;
  const extraErrors: ValidationError[] = [];

  // Business logic checks:
  // 1. Day count matches nights + 1 (standard package rule)
  if (itinerary.package.days !== itinerary.package.nights + 1) {
    extraErrors.push({
      path: "package.days",
      message: `Package days (${itinerary.package.days}) should equal nights + 1 (${itinerary.package.nights + 1})`,
    });
  }

  // 2. Days array length matches package.days
  if (itinerary.days.length !== itinerary.package.days) {
    extraErrors.push({
      path: "days",
      message: `Number of day items (${itinerary.days.length}) does not match package days (${itinerary.package.days})`,
    });
  }

  // 3. Day numbers sequential with no gaps starting at 1
  for (let i = 0; i < itinerary.days.length; i++) {
    const expected = i + 1;
    if (itinerary.days[i].dayNumber !== expected) {
      extraErrors.push({
        path: `days.${i}.dayNumber`,
        message: `Expected dayNumber ${expected}, but got ${itinerary.days[i].dayNumber}`,
      });
    }
  }

  if (extraErrors.length > 0) {
    return {
      success: false,
      data: itinerary,
      errors: extraErrors,
    };
  }

  return {
    success: true,
    data: itinerary,
  };
}
