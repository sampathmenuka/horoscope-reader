import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { BirthFormValues } from "@/lib/birthForm";

/** Birth details a visitor chose to save, owned by their anonymous cookie id. */
export const profiles = pgTable(
  "profiles",
  {
    visitorId: uuid("visitor_id").notNull(),
    id: text("id").notNull(),
    values: jsonb("values").$type<BirthFormValues>().notNull(),
    lagnaIndex: integer("lagna_index"),
    savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.visitorId, table.id] })],
);

/** Generated daily horoscopes, shared by every server instance (see lib/dailyCache.ts). */
export const dailyHoroscopeCache = pgTable(
  "daily_horoscope_cache",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("daily_horoscope_cache_expires_at_idx").on(table.expiresAt)],
);
