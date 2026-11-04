import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/lib/db/schema";

/**
 * Server-only Postgres connection. `db` is null when DATABASE_URL isn't set, so
 * the app still runs without a database: saved profiles stay in the browser and
 * the daily cache uses its disk mirror.
 */

type Database = NodePgDatabase<typeof schema>;

// Reused across dev hot reloads, which would otherwise open a new pool each time.
const globalForDb = globalThis as unknown as { handahanaDb?: Database };

function createDb(url: string): Database {
  const pool = new Pool({
    connectionString: url,
    max: 5,
    // Fail quickly when the database is down; callers fall back instead of waiting.
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  // Without a listener, an idle connection dropped by the server crashes the process.
  pool.on("error", (error) => console.error("[db] idle connection error:", error.message));
  return drizzle(pool, { schema });
}

const url = process.env.DATABASE_URL;

export const db: Database | null = url ? (globalForDb.handahanaDb ??= createDb(url)) : null;
