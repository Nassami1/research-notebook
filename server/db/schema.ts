import { sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";

export const notebooks = pgTable("notebooks", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id").notNull(),
  rawText: text("raw_text").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  notebookId: text("notebook_id").notNull(),
  // Null for a note the agent merged across sources.
  sourceId: text("source_id"),
  // "ai" | "local" | "seed" — "local" renders the connect-LLM badge.
  draftKind: text("draft_kind").notNull().default("ai"),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`now()`),
});
