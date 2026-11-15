import { z } from "zod";
import { LAGNA_IDS, houseFrom, type DailyTransits } from "@/lib/daily";
import { cached } from "@/lib/dailyCache";
import { FAST_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { PLANET_NAMES, RASHI_NAMES, isLang, type Lang } from "@/lib/i18n";
import {
  HOUSE_THEME,
  OUTLOOK_PERIODS,
  PERIOD_OFFSETS,
  lagnaAbout,
  ruleOutlook,
  type LagnaOutlook,
  type OutlookPeriod,
} from "@/lib/lagnaOutlook";
import { addDays, colomboToday, fetchTransits } from "@/lib/transits";

export const maxDuration = 60;

const DAY_MS = 26 * 60 * 60 * 1000;
// Rule-based results are cheap; cache them briefly so a newly added key is picked up soon.
const RULES_TTL_MS = 10 * 60 * 1000;
// Bump whenever the LagnaOutlook shape changes, so older cached entries are never served.
const CACHE_VERSION = 1;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: { week: { type: "string" }, month: { type: "string" }, year: { type: "string" } },
  required: ["week", "month", "year"],
};

const GeminiOutput = z.object({ week: z.string().min(40), month: z.string().min(40), year: z.string().min(40) });

const SYSTEM_PROMPT = `You are an experienced Sri Lankan astrologer writing longer-range horoscopes (ඉදිරි සතිය, ඉදිරි මාසය, ඉදිරි අවුරුද්ද) for one Lagna, as printed in Sri Lankan newspapers.

Use only the transit facts supplied: the sidereal (Lahiri) positions of the planets on several future dates, shown as the house each planet occupies counted from the Lagna. Judge the week mainly by the Sun, Mars and Mercury, the month by Venus, Mars and the Sun, and the year by Jupiter and Saturn (the slow planets), with Rahu and Ketu as background. Mention when Jupiter or Saturn changes house during the year.

Write 4-5 sentences for each of the three periods, covering work and money, family and relationships, and health. Be warm, practical and respectful. Never predict death, accidents or illness as certain, and present difficulties with simple advice. Keep the three periods clearly different from each other.`;

function languageInstruction(lang: Lang): string {
  return lang === "si"
    ? `Write every text in Sinhala (සිංහල). ${SINHALA_STYLE} Do not use English words.`
    : "Write every text in clear, natural English.";
}

function digest(lagnaIndex: number, today: string, samples: Record<number, DailyTransits>): string {
  const lines = [`Lagna: ${RASHI_NAMES.en[lagnaIndex]}. Today is ${today} (Sri Lanka).`, "House of each planet counted from the Lagna:"];
  for (const [offset, t] of Object.entries(samples)) {
    const houses = t.planets
      .filter((p) => p.key !== "moon")
      .map((p) => `${PLANET_NAMES[p.key].en} H${houseFrom(p.rashi_index, lagnaIndex)}${p.retrograde && p.key !== "rahu" && p.key !== "ketu" ? " (retrograde)" : ""}`)
      .join(", ");
    lines.push(`- ${t.date} (today + ${offset} days): ${houses}`);
  }
  lines.push("", "What the houses mean: " + Object.entries(HOUSE_THEME).map(([h, v]) => `H${h} ${v.en}`).join("; "));
  return lines.join("\n");
}

async function build(lagnaIndex: number, lang: Lang, today: string): Promise<{ value: LagnaOutlook; ttlMs: number }> {
  const offsets = [...new Set(OUTLOOK_PERIODS.flatMap((p) => PERIOD_OFFSETS[p]))];
  const fetched = await Promise.all(offsets.map((o) => fetchTransits(addDays(today, o))));
  const samples = Object.fromEntries(offsets.map((o, i) => [o, fetched[i]])) as Record<number, DailyTransits>;

  let texts: Record<OutlookPeriod, string> | null = null;
  const key = geminiKey();
  if (key) {
    try {
      texts = await generateJson({
        key,
        model: FAST_MODEL,
        system: SYSTEM_PROMPT,
        prompt: `${languageInstruction(lang)}\n\n<transits>\n${digest(lagnaIndex, today, samples)}\n</transits>`,
        jsonSchema: OUTPUT_SCHEMA,
        validate: GeminiOutput,
        timeoutMs: 40_000,
      });
    } catch (error) {
      logGeminiError("api/lagna-outlook", error);
    }
  }

  const period = (p: OutlookPeriod) => texts?.[p].trim() ?? ruleOutlook(p, lagnaIndex, PERIOD_OFFSETS[p].map((o) => samples[o]), lang);
  const value: LagnaOutlook = {
    date: today,
    lang,
    lagnaId: LAGNA_IDS[lagnaIndex],
    source: texts ? "llm" : "rules",
    about: lagnaAbout(lagnaIndex, lang),
    week: period("week"),
    month: period("month"),
    year: period("year"),
  };
  return { value, ttlMs: texts ? DAY_MS : RULES_TTL_MS };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lang: Lang = isLang(params.get("lang")) ? (params.get("lang") as Lang) : "si";
  const lagnaIndex = LAGNA_IDS.indexOf(params.get("lagna") as (typeof LAGNA_IDS)[number]);
  if (lagnaIndex < 0) return Response.json({ error: "invalid_input" }, { status: 400 });

  const today = colomboToday();
  try {
    const outlook = await cached(`${today}-outlook-v${CACHE_VERSION}-${lagnaIndex}-${lang}`, today, () => build(lagnaIndex, lang, today));
    return Response.json(outlook, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("[api/lagna-outlook] failed:", error);
    const unreachable = error instanceof TypeError || (error as Error).name === "TimeoutError";
    return Response.json({ error: unreachable ? "backend_unreachable" : "predict_failed" }, { status: 502 });
  }
}
