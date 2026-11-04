import { z } from "zod";
import {
  DailyTransitsSchema,
  LAGNA_IDS,
  lagnaDayFacts,
  lagnaName,
  rulePrediction,
  type DailyHoroscope,
  type DailyTransits,
  type LagnaDayFacts,
} from "@/lib/daily";
import { cached } from "@/lib/dailyCache";
import { FAST_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { NAKSHATRA_NAMES, PLANET_NAMES, RASHI_NAMES, isLang, type Lang } from "@/lib/i18n";

export const maxDuration = 300;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";
const MODEL = FAST_MODEL;

const DAY_MS = 26 * 60 * 60 * 1000; // key already includes the date; 26h covers the whole Colombo day
// Rule-based results (no key yet, or Gemini failed) are cheap, so cache them only
// briefly; that way a newly added key or a recovered API is picked up soon.
const RULES_TTL_MS = 10 * 60 * 1000;
// Bump whenever the DailyHoroscope response shape changes, so entries cached by an
// older version (in memory or in .cache/) are never served to the new UI.
const CACHE_VERSION = 2;

function colomboToday(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo" }).format(new Date());
}


async function fetchTransits(date: string): Promise<DailyTransits> {
  const res = await fetch(`${BACKEND_URL}/api/daily-transits?day=${date}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`daily-transits returned ${res.status}`);
  return DailyTransitsSchema.parse(await res.json());
}

/* ---------------- Gemini ---------------- */

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    predictions: {
      type: "array",
      minItems: 12,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          lagnaId: { type: "string", enum: [...LAGNA_IDS] },
          generalPrediction: { type: "string" },
        },
        required: ["lagnaId", "generalPrediction"],
      },
    },
  },
  required: ["predictions"],
};

const GeminiOutput = z.object({
  predictions: z
    .array(z.object({ lagnaId: z.enum(LAGNA_IDS), generalPrediction: z.string().min(20) }))
    .refine((list) => LAGNA_IDS.every((id) => list.some((p) => p.lagnaId === id)), "missing lagnas"),
});

const SYSTEM_PROMPT = `You are an experienced Sri Lankan astrologer writing the daily "අද දවස ඔබට කොහොමද?" horoscope for each of the 12 Lagnas, as printed in Sri Lankan newspapers.

Use only the transit facts supplied: today's sidereal (Lahiri) planetary positions and, for each Lagna, the house each planet occupies counted from that Lagna, plus the day's rating. Give the Moon's house the most weight for a daily reading; note Chandrashtama (Moon in the 8th) with gentle caution. Slow planets (Jupiter, Saturn, Rahu, Ketu) colour the background.

For each Lagna write 3-4 sentences covering the overall day, work and money, family, and health. Keep the tone of each reading consistent with its day rating. Be warm, practical and respectful; never predict death, accidents or illness as certain, and present difficulties with simple advice.`;


function languageInstruction(lang: Lang): string {
  return lang === "si"
    ? `Write every generalPrediction in Sinhala (සිංහල). ${SINHALA_STYLE} Call the Moon "සඳු" or "චන්ද්‍රයා". Do not use English words.`
    : "Write every generalPrediction in clear, natural English.";
}

function transitDigest(transits: DailyTransits, facts: LagnaDayFacts[]): string {
  const en = (k: keyof typeof PLANET_NAMES) => PLANET_NAMES[k].en;
  const lines = [
    `Date: ${transits.date} (${transits.weekday.en}), Sri Lanka. Positions at sunrise.`,
    `Today's nakshatra: ${NAKSHATRA_NAMES.en[transits.nakshatra.index]} pada ${transits.nakshatra.pada}.`,
    `Moon in ${RASHI_NAMES.en[transits.moon.rashi_index]}${
      transits.moon_sign_changes_at && transits.next_moon_rashi_index !== null
        ? `, entering ${RASHI_NAMES.en[transits.next_moon_rashi_index]} at ${transits.moon_sign_changes_at.slice(11, 16)}`
        : ""
    }.`,
    "Planets: " +
      transits.planets
        .map((p) => `${en(p.key)} in ${RASHI_NAMES.en[p.rashi_index]}${p.retrograde && p.key !== "rahu" && p.key !== "ketu" ? " (retrograde)" : ""}`)
        .join("; "),
    "",
    "Per Lagna (house of each planet from the Lagna):",
  ];
  for (const f of facts) {
    const houses = Object.entries(f.planetHouses)
      .map(([k, h]) => `${en(k as keyof typeof PLANET_NAMES)} H${h}`)
      .join(", ");
    lines.push(
      `- ${f.lagnaId} (${RASHI_NAMES.en[f.lagnaIndex]}): Moon in house ${f.moonHouse}${f.chandrashtama ? " (CHANDRASHTAMA)" : ""}; day rating ${f.moodRating}/5; ${houses}`,
    );
  }
  return lines.join("\n");
}

async function geminiPredictions(transits: DailyTransits, facts: LagnaDayFacts[], lang: Lang, key: string) {
  const parsed = await generateJson({
    key,
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: `${languageInstruction(lang)}\n\n<transits>\n${transitDigest(transits, facts)}\n</transits>`,
    jsonSchema: OUTPUT_SCHEMA,
    validate: GeminiOutput,
    // Generated once per day per language, so it may take a little longer.
    timeoutMs: 60_000,
  });
  return new Map(parsed.predictions.map((p) => [p.lagnaId, p.generalPrediction.trim()]));
}

/* ---------------- Assembly ---------------- */

async function buildHoroscope(date: string, lang: Lang): Promise<{ value: DailyHoroscope; ttlMs: number }> {
  const transits = await fetchTransits(date);
  const facts = LAGNA_IDS.map((_, i) => lagnaDayFacts(transits, i, lang));

  let texts: Map<string, string> | null = null;
  const key = geminiKey();
  if (key) {
    try {
      texts = await geminiPredictions(transits, facts, lang, key);
    } catch (error) {
      logGeminiError("api/daily-horoscope", error);
    }
  }

  const value: DailyHoroscope = {
    date: transits.date,
    lang,
    source: texts ? "llm" : "rules",
    model: texts ? MODEL : undefined,
    generatedAt: new Date().toISOString(),
    panchanga: {
      weekdayIndex: transits.weekday_index,
      sunrise: transits.sunrise,
      sunset: transits.sunset,
      rahuKalaya: transits.rahu_kalaya,
      maruSoolama: transits.maru_soolama,
      subaDishawa: transits.suba_dishawa,
      nakshatraIndex: transits.nakshatra.index,
      nakshatraPada: transits.nakshatra.pada,
      nakshatraEndsAt: transits.nakshatra_ends_at,
      moonRashiIndex: transits.moon.rashi_index,
      moonSignChangesAt: transits.moon_sign_changes_at,
      nextMoonRashiIndex: transits.next_moon_rashi_index,
      location: transits.location,
    },
    transits: transits.planets.map((p) => ({ key: p.key, rashiIndex: p.rashi_index, retrograde: p.retrograde })),
    lagnas: facts.map((f) => ({
      lagnaId: f.lagnaId,
      lagnaIndex: f.lagnaIndex,
      lagnaName: lagnaName(f.lagnaIndex, lang),
      moodRating: f.moodRating,
      generalPrediction: texts?.get(f.lagnaId) ?? rulePrediction(f, lang),
      jayaAnkaya: f.jayaAnkaya,
      jayaPata: f.jayaPata,
      subaDishawa: f.subaDishawa,
      dishawaCode: f.dishawaCode,
      moonHouse: f.moonHouse,
      chandrashtama: f.chandrashtama,
    })),
  };
  return { value, ttlMs: texts ? DAY_MS : RULES_TTL_MS };
}

export async function GET(request: Request) {
  const langParam = new URL(request.url).searchParams.get("lang");
  const lang: Lang = isLang(langParam) ? langParam : "si";
  const date = colomboToday();

  try {
    const horoscope = await cached(`${date}-v${CACHE_VERSION}-${lang}`, date, () => buildHoroscope(date, lang));
    // Short private caching (not no-store) so viewing the daily tab doesn't
    // disqualify the page from the back/forward cache; the server cache is per day.
    return Response.json(horoscope, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("[api/daily-horoscope] failed:", error);
    const unreachable = error instanceof TypeError || (error as Error).name === "TimeoutError";
    return Response.json({ error: unreachable ? "backend_unreachable" : "predict_failed" }, { status: 502 });
  }
}
