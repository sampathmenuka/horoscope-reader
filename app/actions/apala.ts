"use server";

import { z } from "zod";
import { GENERAL_REMEDY, REMEDIES } from "@/lib/astroData";
import { FAST_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { RASHI_NAMES } from "@/lib/i18n";

export interface Remedy {
  title: string;
  detail: string;
}

export interface ApalaRemedies {
  source: "llm" | "rules";
  remedies: Remedy[];
}

const APALA_KEYS = [
  "erashtaka_first",
  "janma_shani",
  "erashtaka_last",
  "ashtama_shani",
  "lagna_shani",
  "lagna_ashtama_shani",
  "rahu_transit",
] as const;

const InputSchema = z.object({
  keys: z.array(z.enum(APALA_KEYS)).min(1).max(APALA_KEYS.length),
  saturnRashi: z.number().int().min(0).max(11),
  rahuRashi: z.number().int().min(0).max(11),
  lang: z.enum(["si", "en"]),
});

const OutputSchema = z.object({
  remedies: z.array(z.object({ title: z.string().min(1), detail: z.string().min(1) })).min(2).max(8),
});

// Remedies depend only on which apala are active and on the transit signs, which change
// rarely, so identical requests share one Gemini answer for a day.
const cache = new Map<string, { value: ApalaRemedies; expiresAt: number }>();
const DAY_MS = 24 * 60 * 60 * 1000;

const LABELS: Record<(typeof APALA_KEYS)[number], string> = {
  erashtaka_first: "Senasuru Erashtaka, first phase (Saturn 12th from the Janma Rashi)",
  janma_shani: "Janma Shani, peak of the Erashtaka (Saturn over the Janma Rashi)",
  erashtaka_last: "Senasuru Erashtaka, final phase (Saturn 2nd from the Janma Rashi)",
  ashtama_shani: "Ashtama Shani (Saturn 8th from the Janma Rashi)",
  lagna_shani: "Saturn transiting the Lagna",
  lagna_ashtama_shani: "Saturn 8th from the Lagna",
  rahu_transit: "Difficult Rahu transit (over, or 8th from, the Janma Rashi or Lagna)",
};

function traditional(keys: readonly string[], lang: "si" | "en"): ApalaRemedies {
  const planets = [...new Set(keys.map((k) => (k === "rahu_transit" ? "rahu" : "saturn")))] as ("saturn" | "rahu")[];
  const remedies = planets.flatMap((p) =>
    REMEDIES[p].map((r) => ({ title: p === "saturn" ? (lang === "si" ? "ශනි ශාන්තිය" : "For Saturn") : lang === "si" ? "රාහු ශාන්තිය" : "For Rahu", detail: r[lang] })),
  );
  remedies.push({ title: lang === "si" ? "සාමාන්‍ය පිළිවෙත්" : "General practice", detail: GENERAL_REMEDY[lang] });
  return { source: "rules", remedies };
}

/** Server action: culturally appropriate Sri Lankan remedies for the active apala. */
export async function getApalaRemedies(input: z.infer<typeof InputSchema>): Promise<ApalaRemedies> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { source: "rules", remedies: [] };
  const { keys, saturnRashi, rahuRashi, lang } = parsed.data;
  const sortedKeys = [...new Set(keys)].sort();

  const key = geminiKey();
  if (!key) return traditional(sortedKeys, lang);

  const cacheKey = `${sortedKeys.join(",")}|${saturnRashi}|${rahuRashi}|${lang}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  try {
    const result = await generateJson({
      key,
      model: FAST_MODEL,
      system: `You are a respected Sri Lankan astrologer advising on Shanthikarma for difficult planetary periods (apala). Recommend traditional Sri Lankan Buddhist and cultural remedies: Senasuru (Saturday) Bodhi Pooja, Seth Kavi, Navagraha/graha shanthi, Pirith, sil on Poya days, specific dana (almsgiving to monks, elders or those in need), lighting sesame-oil lamps, devalaya offerings, and yantra. If you mention a gemstone, say it should be worn only after a qualified astrologer examines the full chart. Never make medical or financial guarantees, and keep the tone calm and reassuring.`,
      prompt: [
        lang === "si" ? `Write in Sinhala (සිංහල). ${SINHALA_STYLE}` : "Write in clear English.",
        `Active apala: ${sortedKeys.map((k) => LABELS[k as keyof typeof LABELS]).join("; ")}.`,
        `Saturn transits ${RASHI_NAMES.en[saturnRashi]}; Rahu transits ${RASHI_NAMES.en[rahuRashi]}.`,
        "Give 5-6 specific remedies. title = a short name for the remedy; detail = 1-2 sentences on how and when to do it (day of week, offerings, colours).",
      ].join("\n"),
      jsonSchema: {
        type: "object",
        properties: {
          remedies: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } }, required: ["title", "detail"] },
          },
        },
        required: ["remedies"],
      },
      validate: OutputSchema,
      maxOutputTokens: 8192,
    });
    const value: ApalaRemedies = { source: "llm", remedies: result.remedies };
    cache.set(cacheKey, { value, expiresAt: Date.now() + DAY_MS });
    return value;
  } catch (error) {
    logGeminiError("actions/apala", error);
    return traditional(sortedKeys, lang);
  }
}
