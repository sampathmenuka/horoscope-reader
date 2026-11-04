import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, gt, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyHoroscopeCache } from "@/lib/db/schema";

/**
 * Small server-side cache for the daily horoscope, keyed "{YYYY-MM-DD}-{lang}".
 *
 * - In memory for speed, mirrored to the database (or `.cache/daily-horoscope/`
 *   when DATABASE_URL isn't set) so a server restart doesn't trigger another
 *   Gemini call the same day.
 * - Concurrent misses for the same key share one in-flight generation.
 * - Entries carry their own expiry, so a fallback result can be cached briefly
 *   and retried, while a good result lives for the whole day.
 *
 * The database mirror is shared by every server instance. A database error only
 * costs a cache miss. Two instances that miss at the same moment can each generate
 * once; the last write wins. The disk mirror assumes a single long-running server
 * and may be read-only on serverless hosts (errors are ignored).
 */

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const CACHE_DIR = path.join(process.cwd(), ".cache", "daily-horoscope");
const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function fileFor(key: string): string {
  return path.join(CACHE_DIR, `${key.replace(/[^a-z0-9-]/gi, "_")}.json`);
}

async function readDisk<T>(key: string): Promise<Entry<T> | null> {
  try {
    const entry = JSON.parse(await readFile(fileFor(key), "utf8")) as Entry<T>;
    return entry.expiresAt > Date.now() ? entry : null;
  } catch {
    return null;
  }
}

async function writeDisk<T>(key: string, entry: Entry<T>): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(fileFor(key), JSON.stringify(entry), "utf8");
  } catch (error) {
    console.warn("[dailyCache] could not persist cache entry:", (error as Error).message);
  }
}

async function readStored<T>(key: string): Promise<Entry<T> | null> {
  if (!db) return readDisk<T>(key);
  try {
    const [row] = await db
      .select()
      .from(dailyHoroscopeCache)
      .where(and(eq(dailyHoroscopeCache.key, key), gt(dailyHoroscopeCache.expiresAt, new Date())));
    return row ? { value: row.value as T, expiresAt: row.expiresAt.getTime() } : null;
  } catch (error) {
    console.warn("[dailyCache] could not read from the database:", (error as Error).message);
    return null;
  }
}

async function writeStored<T>(key: string, entry: Entry<T>): Promise<void> {
  if (!db) return writeDisk(key, entry);
  try {
    const expiresAt = new Date(entry.expiresAt);
    await db
      .insert(dailyHoroscopeCache)
      .values({ key, value: entry.value, expiresAt })
      .onConflictDoUpdate({ target: dailyHoroscopeCache.key, set: { value: entry.value, expiresAt } });
  } catch (error) {
    console.warn("[dailyCache] could not write to the database:", (error as Error).message);
  }
}

/** Drop entries from previous days (memory, and the database or disk). */
async function prune(currentDate: string): Promise<void> {
  for (const key of memory.keys()) {
    if (!key.startsWith(currentDate)) memory.delete(key);
  }
  if (db) {
    try {
      await db.delete(dailyHoroscopeCache).where(lte(dailyHoroscopeCache.expiresAt, new Date()));
    } catch (error) {
      console.warn("[dailyCache] could not prune the database:", (error as Error).message);
    }
    return;
  }
  try {
    for (const name of await readdir(CACHE_DIR)) {
      if (!name.startsWith(currentDate)) await rm(path.join(CACHE_DIR, name), { force: true });
    }
  } catch {
    // Directory may not exist yet.
  }
}

/**
 * Returns the cached value for `key`, or runs `produce` once (shared across
 * concurrent callers) and caches its result for the returned `ttlMs`.
 */
export async function cached<T>(
  key: string,
  currentDate: string,
  produce: () => Promise<{ value: T; ttlMs: number }>,
): Promise<T> {
  const hit = memory.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const job = (async () => {
    const stored = await readStored<T>(key);
    if (stored) {
      memory.set(key, stored);
      return stored.value;
    }
    const { value, ttlMs } = await produce();
    const entry: Entry<T> = { value, expiresAt: Date.now() + ttlMs };
    memory.set(key, entry);
    await prune(currentDate);
    await writeStored(key, entry);
    return value;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}
