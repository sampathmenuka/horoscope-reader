import { z } from "zod";
import { RASHI_LORDS } from "@/lib/astroData";
import { PLANET_KEYS, RASHI_NAMES, type Lang, type PlanetKey } from "@/lib/i18n";

/* ---------- FastAPI /api/daily-transits (mirrors backend DailyTransits) ---------- */

const bilingual = z.object({ en: z.string(), si: z.string() });
const planetKey = z.enum(PLANET_KEYS);

const transitNakshatra = z.object({
  index: z.number().int().min(0).max(26),
  name: bilingual,
  pada: z.number().int().min(1).max(4),
  lord: planetKey,
});

const transitPlanet = z.object({
  key: planetKey,
  rashi_index: z.number().int().min(0).max(11),
  degree_in_sign: z.number(),
  retrograde: z.boolean(),
  nakshatra: transitNakshatra,
});

export const DailyTransitsSchema = z.object({
  date: z.string(),
  weekday_index: z.number().int().min(0).max(6),
  weekday: bilingual,
  weekday_lord: planetKey,
  location: z.string(),
  sunrise: z.string(),
  sunset: z.string(),
  rahu_kalaya: z.object({ start: z.string(), end: z.string() }),
  maru_soolama: z.object({ code: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]), name: bilingual }),
  suba_dishawa: z.object({ code: z.enum(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]), name: bilingual }),
  nakshatra: transitNakshatra,
  nakshatra_ends_at: z.string().nullable(),
  moon: transitPlanet,
  moon_sign_changes_at: z.string().nullable(),
  next_moon_rashi_index: z.number().int().min(0).max(11).nullable(),
  planets: z.array(transitPlanet).length(9),
});
export type DailyTransits = z.infer<typeof DailyTransitsSchema>;

/* ---------- /api/daily-horoscope response ---------- */

export const LAGNA_IDS = [
  "mesha",
  "vrushabha",
  "mithuna",
  "kataka",
  "sinha",
  "kanya",
  "thula",
  "vrushchika",
  "dhanu",
  "makara",
  "kumbha",
  "meena",
] as const;
export type LagnaId = (typeof LAGNA_IDS)[number];

export interface DailyLagnaReading {
  lagnaId: LagnaId;
  lagnaIndex: number;
  lagnaName: string;
  moodRating: number; // 1-5
  generalPrediction: string;
  jayaAnkaya: string; // ජය අංකය, e.g. "03, 09"
  jayaPata: { name: string; hexColor: string }; // ජය වර්ණය
  subaDishawa: string; // සුබ දිශාව, in the reading's language only
  /** Compass code for the direction arrow. */
  dishawaCode: DirectionCode;
  moonHouse: number;
  chandrashtama: boolean;
}

export interface DailyPanchanga {
  weekdayIndex: number;
  sunrise: string;
  sunset: string;
  rahuKalaya: { start: string; end: string };
  /** මරු සූලම: direction to avoid setting out towards today (weekday rule). */
  maruSoolama?: { code: DirectionCode; name: { en: string; si: string } };
  /** සුබ දිශාව for the day: opposite the Maru Soolama. */
  subaDishawa?: { code: DirectionCode; name: { en: string; si: string } };
  nakshatraIndex: number;
  nakshatraPada: number;
  nakshatraEndsAt: string | null;
  moonRashiIndex: number;
  moonSignChangesAt: string | null;
  nextMoonRashiIndex: number | null;
  location: string;
}

export interface DailyHoroscope {
  date: string;
  lang: Lang;
  source: "llm" | "rules";
  model?: string;
  generatedAt: string;
  panchanga: DailyPanchanga;
  transits: { key: PlanetKey; rashiIndex: number; retrograde: boolean }[];
  lagnas: DailyLagnaReading[];
}

/* ---------- Deterministic daily indicators ---------- */

/** Numerological numbers of the grahas used for ජය අංකය. */
const PLANET_NUMBER: Record<PlanetKey, number> = {
  sun: 1,
  moon: 2,
  jupiter: 3,
  rahu: 4,
  mercury: 5,
  venus: 6,
  ketu: 7,
  saturn: 8,
  mars: 9,
};

type SignLord = Exclude<PlanetKey, "rahu" | "ketu">;

const PLANET_COLOUR: Record<SignLord, { si: string; en: string; hex: string }> = {
  sun: { si: "තැඹිලි", en: "Orange", hex: "#F28C28" },
  moon: { si: "සුදු", en: "White", hex: "#F5F3EE" },
  mars: { si: "රතු", en: "Red", hex: "#D63A3A" },
  mercury: { si: "කොළ", en: "Green", hex: "#2FA36B" },
  jupiter: { si: "කහ", en: "Yellow", hex: "#F2C230" },
  venus: { si: "ලා රෝස", en: "Light Pink", hex: "#F4A6C1" },
  saturn: { si: "තද නිල්", en: "Dark Blue", hex: "#2B4C9B" },
};

export type DirectionCode = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

/** Compass bearing of each direction, for rotating the arrow (N = 0°). */
export const DIRECTION_DEGREES: Record<DirectionCode, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

/** Dikpala directions of the grahas. */
const PLANET_DIRECTION: Record<SignLord, { si: string; en: string; code: DirectionCode }> = {
  sun: { si: "නැගෙනහිර", en: "East", code: "E" },
  venus: { si: "ගිනිකොන", en: "South-East", code: "SE" },
  mars: { si: "දකුණ", en: "South", code: "S" },
  saturn: { si: "බටහිර", en: "West", code: "W" },
  moon: { si: "වයඹ", en: "North-West", code: "NW" },
  mercury: { si: "උතුර", en: "North", code: "N" },
  jupiter: { si: "ඊසාන", en: "North-East", code: "NE" },
};

/** Gochara strength of the Moon by house counted from the Lagna. */
const MOON_HOUSE_RATING: Record<number, number> = { 1: 4, 2: 3, 3: 5, 4: 3, 5: 3, 6: 4, 7: 4, 8: 1, 9: 4, 10: 5, 11: 5, 12: 2 };

export function houseFrom(signIndex: number, lagnaIndex: number): number {
  return ((signIndex - lagnaIndex + 12) % 12) + 1;
}

export interface LagnaDayFacts {
  lagnaIndex: number;
  lagnaId: LagnaId;
  moonHouse: number;
  chandrashtama: boolean;
  moodRating: number;
  planetHouses: Record<PlanetKey, number>;
  jayaAnkaya: string;
  jayaPata: { name: string; hexColor: string };
  subaDishawa: string;
  dishawaCode: DirectionCode;
}

export function lagnaDayFacts(transits: DailyTransits, lagnaIndex: number, lang: Lang): LagnaDayFacts {
  const planetHouses = Object.fromEntries(
    transits.planets.map((p) => [p.key, houseFrom(p.rashi_index, lagnaIndex)]),
  ) as Record<PlanetKey, number>;
  const moonSign = transits.moon.rashi_index;
  const moonHouse = planetHouses.moon;
  const chandrashtama = moonHouse === 8;

  // Moon with Jupiter/Venus lifts the day; with Saturn/Rahu/Ketu it weighs on it.
  const withMoon = transits.planets.filter((p) => p.key !== "moon" && p.rashi_index === moonSign).map((p) => p.key);
  let rating = MOON_HOUSE_RATING[moonHouse];
  if (!chandrashtama && withMoon.some((k) => k === "jupiter" || k === "venus")) rating += 1;
  if (withMoon.some((k) => k === "saturn" || k === "rahu" || k === "ketu")) rating -= 1;
  const moodRating = Math.min(5, Math.max(1, rating));

  // The day's favourable graha: lord of the Moon's sign, unless the Moon is in a
  // dusthana (6/8/12), when the Lagna lord is strengthened instead.
  const lagnaLord = RASHI_LORDS[lagnaIndex] as SignLord;
  const favourable = ([6, 8, 12].includes(moonHouse) ? lagnaLord : RASHI_LORDS[moonSign]) as SignLord;

  const numbers = [...new Set([PLANET_NUMBER[favourable], PLANET_NUMBER[lagnaLord], PLANET_NUMBER[transits.weekday_lord]])]
    .slice(0, 2)
    .sort((a, b) => a - b)
    .map((n) => String(n).padStart(2, "0"));

  const colour = PLANET_COLOUR[favourable];
  const direction = PLANET_DIRECTION[favourable];

  return {
    lagnaIndex,
    lagnaId: LAGNA_IDS[lagnaIndex],
    moonHouse,
    chandrashtama,
    moodRating,
    planetHouses,
    jayaAnkaya: numbers.join(", "),
    jayaPata: { name: colour[lang], hexColor: colour.hex },
    subaDishawa: direction[lang],
    dishawaCode: direction.code,
  };
}

export function lagnaName(lagnaIndex: number, lang: Lang): string {
  return RASHI_NAMES[lang][lagnaIndex];
}

/* ---------- Rule-based prose (used without a Gemini key or if Gemini fails) ---------- */

/** Moon's transit through each house from the Lagna: overall, work/money, family, health. */
const MOON_HOUSE_TEXT: Record<number, Record<Lang, string>> = {
  1: {
    en: "The Moon in your Lagna brings energy and a clear mind for the day. Personal plans move forward and people respond warmly to you. Spend time with family in the evening, and avoid skipping meals.",
    si: "චන්ද්‍රයා ඔබේ ලග්නයේ ගමන් කරන බැවින් අද දිනය සිතට ප්‍රබෝධයක් සහ පැහැදිලි අදහස් ගෙන එයි. පෞද්ගලික සැලසුම් ඉදිරියට යන අතර අන් අය ඔබට හිතවත්ව ප්‍රතිචාර දක්වයි. සවස පවුලේ අය සමඟ කාලය ගත කරන්න; ආහාර වේල් මඟ නොහරින්න.",
  },
  2: {
    en: "Today centres on money, family and speech. Small financial gains are possible, but spend carefully. Speak gently at home to keep harmony, and watch for minor throat or eye strain.",
    si: "අද දිනය මුදල්, පවුල සහ කථනය වටා කේන්ද්‍ර වේ. සුළු මූල්‍ය වාසි ලැබිය හැකි නමුත් වියදම් පාලනය කරන්න. නිවසේ සමගිය රැකීමට මෘදුව කතා කරන්න; ඇස් සහ උගුර පිළිබඳ සැලකිලිමත් වන්න.",
  },
  3: {
    en: "A courageous and productive day. Short journeys, calls and new initiatives go well, and colleagues support your efforts. Siblings bring good news, and your health and stamina are strong.",
    si: "කරන කියන කටයුතු සාර්ථක වන, උද්යෝගිමත් දිනයකි. කෙටි ගමන් බිමන් සහ අලුත් වැඩ ආරම්භ කිරීමට සුබය; හිතමිතුරන්ගේ සහ රැකියා ස්ථානයේ අයගේ සහයෝගය හිමිවේ. සහෝදර සහෝදරියන්ගෙන් සුබ ආරංචි ලැබිය හැකි අතර ශරීර ශක්තියද හොඳින් පවතී.",
  },
  4: {
    en: "Attention turns to home, mother and comfort. Work may feel slow, so finish pending tasks rather than starting new ones. Family time brings peace; avoid travelling late and rest well.",
    si: "අවධානය නිවස, මව සහ සුවපහසුව කෙරෙහි යොමු වේ. රැකියා කටයුතු තරමක් මන්දගාමී විය හැකි බැවින් නව දේ ආරම්භ කිරීමට වඩා ඉතිරි වැඩ නිම කරන්න. පවුල සමඟ ගත කරන කාලය සැනසීම ගෙන එයි; රාත්‍රී ගමන් මඟහැර හොඳින් විවේක ගන්න.",
  },
  5: {
    en: "A thoughtful, creative day, good for study and planning. Avoid speculative investments today. Children or younger relatives may need your attention; keep stress low and sleep early.",
    si: "කල්පනාකාරී සහ නිර්මාණශීලී දිනයකි; අධ්‍යාපනයට සහ සැලසුම් කිරීමට සුදුසුය. අද සූදු ස්වභාවයේ ආයෝජනවලින් වළකින්න. දරුවන්ට හෝ බාල ඥාතීන්ට ඔබේ අවධානය අවශ්‍ය විය හැක; ආතතිය අඩු කර කලින් නින්දට යන්න.",
  },
  6: {
    en: "You overcome obstacles and competitors today. Work and service tasks get done efficiently, and old debts can be settled. Keep family discussions calm, and pay attention to digestion.",
    si: "අද දිනයේ බාධක සහ විරුද්ධවාදීන් ජය ගැනීමට හැකි වේ. රැකියා සහ සේවා කටයුතු කාර්යක්ෂමව නිම වන අතර පැරණි ණය බේරුම් කිරීමට අවස්ථාව ලැබේ. පවුලේ සාකච්ඡා සන්සුන්ව පවත්වන්න; ආහාර දිරවීම ගැන සැලකිලිමත් වන්න.",
  },
  7: {
    en: "Partnerships and relationships are favoured. Business meetings and agreements go smoothly, and your spouse or partner is supportive. Social outings are pleasant; avoid overeating.",
    si: "හවුල්කාරිත්ව සහ සබඳතාවලට හිතකර දිනයකි. ව්‍යාපාරික හමුවීම් සහ ගිවිසුම් සුමටව සිදු වන අතර කලත්‍රයාගෙන් සහාය ලැබේ. සමාජ හමුවීම් ප්‍රසන්න වේ; අධික ලෙස ආහාර ගැනීමෙන් වළකින්න.",
  },
  8: {
    en: "The mind may feel unsettled and plans can meet unexpected delays today. Avoid new ventures, signing agreements and large payments if you can. Stay patient with family, travel carefully, and give yourself extra rest.",
    si: "අද දිනයේ සිත නොසන්සුන් විය හැකි අතර සැලසුම්වලට අනපේක්ෂිත ප්‍රමාද ඇති විය හැක. හැකි නම් නව ව්‍යාපාර, ගිවිසුම් අත්සන් කිරීම සහ විශාල ගෙවීම්වලින් වළකින්න. පවුලේ අය සමඟ ඉවසීමෙන් කටයුතු කරන්න, ගමන් බිමන්වලදී පරිස්සම් වී වැඩිපුර විවේක ගන්න.",
  },
  9: {
    en: "Fortune and blessings support you today. Guidance from elders or teachers proves valuable, and religious or charitable activities bring peace. Long-term plans look promising, and your health is good.",
    si: "අද දිනයේ භාග්‍යය සහ ආශීර්වාද ඔබට සහාය වේ. වැඩිහිටියන්ගේ හෝ ගුරුවරුන්ගේ උපදෙස් වටිනා වන අතර ආගමික හා පුණ්‍ය කටයුතු සිතට සැනසීම ගෙන එයි. දිගුකාලීන සැලසුම් සඳහා හොඳ දිනයක් වන අතර සෞඛ්‍යය යහපත්ය.",
  },
  10: {
    en: "An excellent day for career and reputation. Your work is noticed by superiors, and official matters move ahead. Family is proud of your progress; balance work with enough rest.",
    si: "රැකියාවට සහ කීර්තියට ඉතා හොඳ දිනයකි. ඔබේ වැඩ ඉහළ නිලධාරීන්ගේ අවධානයට ලක් වන අතර නිල කටයුතු ඉදිරියට යයි. ඔබේ දියුණුව ගැන පවුලේ අය සතුටු වේ; වැඩ සමඟ ප්‍රමාණවත් විවේකයද ලබා ගන්න.",
  },
  11: {
    en: "Gains and fulfilled wishes mark the day. Income, help from friends and good news are likely. Social and family gatherings are joyful, and you feel healthy and optimistic.",
    si: "ලාභ සහ අභිලාෂ ඉටුවීම මේ දිනයේ විශේෂත්වයයි. ආදායම, මිතුරන්ගේ උදව් සහ සුබ ආරංචි ලැබීමට ඉඩ ඇත. පවුලේ සහ සමාජ හමුවීම් සතුට ගෙන දෙන අතර ඔබ නිරෝගී සහ සුබවාදී හැඟීමකින් සිටී.",
  },
  12: {
    en: "Expenses and fatigue may rise today. Keep a close eye on spending and avoid lending money. Quiet time, meditation or a visit to the temple restores balance; get enough sleep.",
    si: "අද දිනයේ වියදම් සහ වෙහෙස වැඩි විය හැක. මුදල් වියදම් කිරීම හොඳින් පාලනය කර, ණයට මුදල් දීමෙන් වළකින්න. භාවනාව, නිහඬ කාලය හෝ විහාරස්ථානයකට යාම සමබරතාව ලබා දෙයි; ප්‍රමාණවත් නින්දක් ලබා ගන්න.",
  },
};

export function rulePrediction(facts: LagnaDayFacts, lang: Lang): string {
  return MOON_HOUSE_TEXT[facts.moonHouse][lang];
}
