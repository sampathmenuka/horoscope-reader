import { DailyTransitsSchema, type DailyTransits } from "@/lib/daily";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export function colomboToday(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());
}

/** `date` plus `days`, as YYYY-MM-DD (calendar arithmetic only, so no timezone drift). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export async function fetchTransits(date: string): Promise<DailyTransits> {
  const res = await fetch(`${BACKEND_URL}/api/daily-transits?day=${date}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`daily-transits returned ${res.status}`);
  return DailyTransitsSchema.parse(await res.json());
}
