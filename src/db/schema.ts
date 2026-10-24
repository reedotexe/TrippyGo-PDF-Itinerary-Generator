import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { Itinerary } from "../lib/schema/itinerary";

export const itineraryStatusEnum = pgEnum("itinerary_status", ["draft", "review", "final"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "sales"]);

/**
 * Users table
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: userRoleEnum("role").default("sales").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Primary Itineraries table
 */
export const itineraries = pgTable("itineraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  status: itineraryStatusEnum("status").default("draft").notNull(),
  currentData: jsonb("current_data").$type<Itinerary>().notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Immutable Itinerary Versions (created whenever a PDF is generated)
 */
export const itineraryVersions = pgTable("itinerary_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  itineraryId: uuid("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  data: jsonb("data").$type<Itinerary>().notNull(),
  changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  pdfS3Key: text("pdf_s3_key"),
  pdfJsonHash: text("pdf_json_hash"),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

export type ItineraryRow = typeof itineraries.$inferSelect;
export type NewItineraryRow = typeof itineraries.$inferInsert;

export type ItineraryVersionRow = typeof itineraryVersions.$inferSelect;
export type NewItineraryVersionRow = typeof itineraryVersions.$inferInsert;
