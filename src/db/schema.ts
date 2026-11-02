import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, pgEnum } from "drizzle-orm/pg-core";
import { Itinerary } from "../lib/schema/itinerary";

export const itineraryStatusEnum = pgEnum("itinerary_status", ["draft", "review", "final"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "salesperson"]);

/**
 * Better Auth: Core User Table
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("salesperson").notNull(),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Better Auth: Sessions Table
 */
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

/**
 * Better Auth: Accounts Table (Credentials, OAuth, etc.)
 */
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

/**
 * Better Auth: Verification Tokens Table (Password Resets, Email Verification, Invites)
 */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// Backward-compatible plural exports
export const users = user;
export const sessions = session;
export const accounts = account;
export const verifications = verification;

/**
 * Primary Itineraries table
 */
export const itineraries = pgTable("itineraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  status: itineraryStatusEnum("status").default("draft").notNull(),
  currentData: jsonb("current_data").$type<Itinerary>().notNull(),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
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
  changedBy: text("changed_by").references(() => user.id, { onDelete: "set null" }),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  pdfS3Key: text("pdf_s3_key"),
  pdfJsonHash: text("pdf_json_hash"),
});

export type UserRow = typeof user.$inferSelect;
export type NewUserRow = typeof user.$inferInsert;

export type SessionRow = typeof session.$inferSelect;
export type NewSessionRow = typeof session.$inferInsert;

export type AccountRow = typeof account.$inferSelect;
export type NewAccountRow = typeof account.$inferInsert;

export type VerificationRow = typeof verification.$inferSelect;
export type NewVerificationRow = typeof verification.$inferInsert;

export type ItineraryRow = typeof itineraries.$inferSelect;
export type NewItineraryRow = typeof itineraries.$inferInsert;

export type ItineraryVersionRow = typeof itineraryVersions.$inferSelect;
export type NewItineraryVersionRow = typeof itineraryVersions.$inferInsert;
