import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  companyName: text("company_name").notNull().default("My company"),
  fullName: text("full_name").notNull().default(""),
  ...timestamps,
});

export const rfps = pgTable("rfps", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  rawText: text("raw_text").notNull(),
  requestedSections: jsonb("requested_sections").$type<string[]>().notNull().default([]),
  ...timestamps,
});

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  rfpId: uuid("rfp_id").notNull().references(() => rfps.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  tone: text("tone").notNull().default("professional"),
  status: text("status").notNull().default("draft"),
  sections: jsonb("sections").$type<Record<string, string>>().notNull().default({}),
  ...timestamps,
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("company_profile"),
  blobKey: text("blob_key").notNull(),
  sizeBytes: text("size_bytes").notNull().default("0"),
  status: text("status").notNull().default("processed"),
  chunkCount: text("chunk_count").notNull().default("0"),
  ...timestamps,
});

export const usageRecords = pgTable("usage_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  ...timestamps,
});
