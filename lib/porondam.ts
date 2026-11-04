import { z } from "zod";
import type { Lang } from "@/lib/i18n";

const bilingual = z.object({ en: z.string(), si: z.string() });

const PersonMoonSchema = z.object({
  name: z.string(),
  nakshatra: z.object({
    index: z.number().int().min(0).max(26),
    name: bilingual,
    pada: z.number().int().min(1).max(4),
  }),
  moon_rashi_index: z.number().int().min(0).max(11),
  moon_rashi: bilingual,
  lagna_rashi_index: z.number().int().min(0).max(11),
  lagna_rashi: bilingual,
  mars_house_from_lagna: z.number().int().min(1).max(12),
  mars_house_from_moon: z.number().int().min(1).max(12),
  kuja_dosha: z.boolean(),
  utc_offset: z.string(),
});

export const PorondamResultSchema = z.object({
  bride: PersonMoonSchema,
  groom: PersonMoonSchema,
  items: z.array(
    z.object({
      key: z.string(),
      name: bilingual,
      passed: z.boolean(),
      critical: z.boolean(),
      detail: bilingual,
    }),
  ),
  passed: z.number().int(),
  total: z.number().int(),
  percentage: z.number().int().min(0).max(100),
  kuja_dosha_note: bilingual.nullable(),
});
export type PorondamResult = z.infer<typeof PorondamResultSchema>;

export interface PorondamResponse {
  result: PorondamResult;
  summary: { paragraphs: string[]; source: "llm" | "rules" };
}

export type Verdict = "excellent" | "good" | "average" | "poor";

/** A failed major porondam (Rajju, Vedha, Nadi) caps the verdict, whatever the score. */
export function verdictOf(result: PorondamResult): Verdict {
  const majorFailed = result.items.some((i) => i.critical && !i.passed);
  const p = result.percentage;
  const base: Verdict = p >= 75 ? "excellent" : p >= 60 ? "good" : p >= 50 ? "average" : "poor";
  if (majorFailed && (base === "excellent" || base === "good")) return "average";
  return base;
}

/** Plain summary used when Gemini is not configured or fails. */
export function ruleSummary(result: PorondamResult, lang: Lang): string[] {
  const verdict = verdictOf(result);
  const failedMajor = result.items.filter((i) => i.critical && !i.passed).map((i) => i.name[lang]);
  const passedNames = result.items.filter((i) => i.passed).map((i) => i.name[lang]);
  const b = result.bride.name;
  const g = result.groom.name;

  if (lang === "si") {
    const opening = {
      excellent: `${b} සහ ${g} අතර පොරොන්දම් ඉතා හොඳින් ගැළපේ. පොරොන්දම් ${result.total}න් ${result.passed}ක් සුබ වීම සමගියෙන් යුත් පවුල් ජීවිතයක් සඳහා යහපත් ලකුණකි.`,
      good: `${b} සහ ${g} අතර පොරොන්දම් සුබ මට්ටමක පවතී. පොරොන්දම් ${result.total}න් ${result.passed}ක් ගැළපෙන බැවින් අන්‍යෝන්‍ය අවබෝධයෙන් සතුටුදායක ජීවිතයක් ගත කළ හැක.`,
      average: `${b} සහ ${g} අතර පොරොන්දම් මධ්‍යම මට්ටමක පවතී (${result.total}න් ${result.passed}ක්). ඉවසීම සහ අවබෝධය මගින් සබඳතාව ශක්තිමත් කර ගත හැක.`,
      poor: `${b} සහ ${g} අතර පොරොන්දම් ගැළපීම අඩු මට්ටමක පවතී (${result.total}න් ${result.passed}ක්). තීරණයකට පෙර සම්පූර්ණ කේන්දර දෙකම ජ්‍යොතිෂවේදියෙකු ලවා සසඳා බැලීම වඩාත් සුදුසුය.`,
    }[verdict];
    const parts = [opening, `සුබ පොරොන්දම්: ${passedNames.join(", ")}.`];
    if (failedMajor.length) parts.push(`ප්‍රධාන පොරොන්දම් වන ${failedMajor.join(", ")} නොගැළපෙන බැවින් ඒ පිළිබඳ විශේෂ සැලකිල්ලක් සහ ශාන්තිකර්ම අවශ්‍ය වේ.`);
    if (result.kuja_dosha_note) parts.push(result.kuja_dosha_note.si);
    return parts;
  }

  const opening = {
    excellent: `${b} and ${g} are an excellent porondam match: ${result.passed} of ${result.total} porondam agree, a strong sign for a harmonious family life.`,
    good: `${b} and ${g} are a favourable match, with ${result.passed} of ${result.total} porondam in agreement; mutual understanding will carry the marriage well.`,
    average: `${b} and ${g} are an average match (${result.passed} of ${result.total}); patience and understanding will strengthen the relationship.`,
    poor: `${b} and ${g} show a weak porondam match (${result.passed} of ${result.total}); it is wise to have both full charts compared by an astrologer before deciding.`,
  }[verdict];
  const parts = [opening, `Favourable porondam: ${passedNames.join(", ")}.`];
  if (failedMajor.length) parts.push(`The major porondam ${failedMajor.join(", ")} do not agree and deserve particular attention and remedies.`);
  if (result.kuja_dosha_note) parts.push(result.kuja_dosha_note.en);
  return parts;
}
