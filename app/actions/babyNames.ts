"use server";

import { z } from "zod";
import { FAST_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { NAKSHATRA_NAMES } from "@/lib/i18n";
import { syllableFor } from "@/lib/nameSyllables";

export interface NameSuggestion {
  si: string;
  en: string;
  meaning: string;
}

export type BabyNamesResult =
  | { ok: true; names: NameSuggestion[] }
  | { ok: false; reason: "no_key" | "failed" | "invalid" };

const InputSchema = z.object({
  nakshatraIndex: z.number().int().min(0).max(26),
  pada: z.number().int().min(1).max(4),
  gender: z.enum(["boy", "girl"]),
  lang: z.enum(["si", "en"]),
});

const OutputSchema = z.object({
  names: z.array(z.object({ si: z.string().min(1), en: z.string().min(1), meaning: z.string().min(1) })).min(1),
});

/** First letter (vowel or consonant) of a Sinhala string, ignoring vowel signs. */
const firstLetter = (text: string) => text.trim().charAt(0);

/**
 * Server action: 20 modern, meaningful Sinhala names that begin with the
 * traditional syllable for the given nakshatra and pada.
 * The syllable is looked up here from the nakshatra/pada, never taken from the client.
 */
export async function suggestBabyNames(input: z.infer<typeof InputSchema>): Promise<BabyNamesResult> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const { nakshatraIndex, pada, gender, lang } = parsed.data;

  const key = geminiKey();
  if (!key) return { ok: false, reason: "no_key" };

  const syllable = syllableFor(nakshatraIndex, pada);
  const meaningLang =
    lang === "si" ? `Write each meaning as a short phrase in Sinhala. ${SINHALA_STYLE}` : "Write each meaning as a short phrase in English.";

  try {
    const result = await generateJson({
      key,
      model: FAST_MODEL,
      system:
        "You are a Sri Lankan naming adviser who knows Sinhala, Pali and Sanskrit name traditions. Suggest only real, pleasant, culturally appropriate given names with positive meanings.",
      prompt: [
        `Suggest 20 modern, meaningful Sinhala ${gender === "boy" ? "boys'" : "girls'"} names for a child born in ${NAKSHATRA_NAMES.en[nakshatraIndex]} nakshatra, pada ${pada}.`,
        `Every name MUST begin with the sound "${syllable.en}" — written in Sinhala script it must start with "${syllable.si}" (the same first letter; a closely related vowel sign is acceptable).`,
        `Give: si = the name in Sinhala script, en = the English transliteration, meaning = its meaning. ${meaningLang}`,
        "No duplicates, no surnames, no names of living celebrities.",
      ].join("\n"),
      jsonSchema: {
        type: "object",
        properties: {
          names: {
            type: "array",
            items: {
              type: "object",
              properties: { si: { type: "string" }, en: { type: "string" }, meaning: { type: "string" } },
              required: ["si", "en", "meaning"],
            },
          },
        },
        required: ["names"],
      },
      validate: OutputSchema,
      maxOutputTokens: 8192,
    });

    // Keep only names that really start with the syllable's letter, without duplicates.
    const seen = new Set<string>();
    const names = result.names
      .map((n) => ({ si: n.si.trim(), en: n.en.trim(), meaning: n.meaning.trim() }))
      .filter((n) => firstLetter(n.si) === firstLetter(syllable.si) && !seen.has(n.si) && seen.add(n.si))
      .slice(0, 20);
    return names.length ? { ok: true, names } : { ok: false, reason: "failed" };
  } catch (error) {
    logGeminiError("actions/babyNames", error);
    return { ok: false, reason: "failed" };
  }
}
