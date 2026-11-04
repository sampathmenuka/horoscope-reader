import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { BirthFormValues } from "@/lib/birthForm";
import { MAX_PROFILES } from "@/lib/types";

/**
 * Saved family profiles. localStorage keeps the list instantly available, and
 * /api/profiles stores a copy in the database, tied to this browser's cookie.
 * A convenience: if either is unavailable the app carries on with the other.
 * Profiles saved before the database existed stay local until they are re-saved.
 */

export interface SavedProfile {
  id: string;
  values: BirthFormValues;
  /** Lagna from the last calculation, shown on the chip. */
  lagnaIndex?: number;
  savedAt: string;
}

const STORAGE_KEY = "handahana.profiles";
const CHANGE_EVENT = "handahana:profiles";
const API_PATH = "/api/profiles";

// Removed this page load: a sync already in flight must not bring these back.
const removedIds = new Set<string>();
let syncStarted = false;

function profileId(values: BirthFormValues): string {
  return [values.name.trim().toLowerCase(), values.year, values.month, values.day].join("|");
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function parse(raw: string): SavedProfile[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (p): p is SavedProfile => typeof p?.id === "string" && typeof p?.values?.name === "string" && typeof p?.values?.year === "string",
    );
  } catch {
    return [];
  }
}

function write(list: SavedProfile[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: saving profiles is optional.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Saves (or updates) a profile; the most recent comes first. */
export function saveProfile(values: BirthFormValues, lagnaIndex?: number): void {
  const id = profileId(values);
  const rest = parse(readRaw()).filter((p) => p.id !== id);
  removedIds.delete(id);
  write([{ id, values, lagnaIndex, savedAt: new Date().toISOString() }, ...rest].slice(0, MAX_PROFILES));
  void fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, values, lagnaIndex }),
  }).catch(() => {
    // Offline or no database: the local copy is enough.
  });
}

export function removeProfile(id: string): void {
  removedIds.add(id);
  write(parse(readRaw()).filter((p) => p.id !== id));
  void fetch(`${API_PATH}?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {
    // Offline or no database: the local copy is already gone.
  });
}

/** Adds profiles stored in the database to the local list; the newest copy of each wins. */
async function syncFromServer(): Promise<void> {
  try {
    const res = await fetch(API_PATH);
    if (!res.ok) return;
    const data: { profiles?: unknown } = await res.json();
    const remote = parse(JSON.stringify(data.profiles ?? [])).filter((p) => !removedIds.has(p.id));
    if (!remote.length) return;

    const merged = new Map(parse(readRaw()).map((p) => [p.id, p]));
    for (const profile of remote) {
      const local = merged.get(profile.id);
      if (!local || Date.parse(profile.savedAt) > Date.parse(local.savedAt)) merged.set(profile.id, profile);
    }
    const next = [...merged.values()].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)).slice(0, MAX_PROFILES);
    if (JSON.stringify(next) !== JSON.stringify(parse(readRaw()))) write(next);
  } catch {
    // Offline or no database: keep the local list.
  }
}

export function useSavedProfiles(): SavedProfile[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  useEffect(() => {
    if (syncStarted) return;
    syncStarted = true;
    void syncFromServer();
  }, []);
  return useMemo(() => parse(raw), [raw]);
}
