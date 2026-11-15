import { houseFrom, type DailyTransits } from "@/lib/daily";
import { PLANET_NAMES, houseOrdinal, type Lang, type PlanetKey } from "@/lib/i18n";

/** The longer-range readings offered under "See more". */
export const OUTLOOK_PERIODS = ["week", "month", "year"] as const;
export type OutlookPeriod = (typeof OUTLOOK_PERIODS)[number];

export interface LagnaOutlook {
  date: string;
  lang: Lang;
  lagnaId: string;
  source: "llm" | "rules";
  /** Nature, strengths and cautions of the Lagna; the same every day. */
  about: string;
  week: string;
  month: string;
  year: string;
}

/**
 * Days after today at which each period is sampled. The middle of the period is
 * used for the rule-based text; the year also looks at its end to catch a sign change.
 */
export const PERIOD_OFFSETS: Record<OutlookPeriod, number[]> = {
  week: [4],
  month: [15],
  year: [182, 365],
};

/* ---------- Static description of each Lagna ---------- */

type Bilingual = Record<Lang, string>;

export const LAGNA_ABOUT: Bilingual[] = [
  {
    en: "Mesha (Aries) is ruled by Mars. People born under it are energetic, brave and quick to act, and they like to lead rather than follow. Their strengths are courage, determination and honesty. They should watch a short temper, impatience and hasty decisions, and rest enough to keep their health strong.",
    si: "මේෂ ලග්නයේ අධිපති අඟහරු ය. මේ ලග්නයේ උපන් අය ශක්තිමත්, නිර්භීත සහ ඉක්මනින් ක්‍රියාත්මක වන අය වන අතර අන් අයව අනුගමනය කරනවාට වඩා නායකත්වය ගැනීමට කැමැත්තක් දක්වති. ධෛර්යය, අධිෂ්ඨානය සහ අවංකභාවය ඔවුන්ගේ ශක්තියයි. කෝපය, නොඉවසීම සහ ඉක්මන් තීරණවලින් වැළකී, සෞඛ්‍යය රැකීමට ප්‍රමාණවත් විවේකයක් ගන්න.",
  },
  {
    en: "Vrushabha (Taurus) is ruled by Venus. People born under it are steady, patient and fond of comfort, good food and beautiful things. Their strengths are reliability, a practical mind and the ability to build wealth slowly. They should watch stubbornness, resistance to change and overspending on luxuries.",
    si: "වෘෂභ ලග්නයේ අධිපති සිකුරු ය. මේ ලග්නයේ උපන් අය ස්ථිර, ඉවසිලිවන්ත අතර සුවපහසුව, රසවත් ආහාර සහ සුන්දර දේවල් වලට කැමැත්තක් දක්වති. විශ්වාසවන්තභාවය, ප්‍රායෝගික සිත සහ සෙමින් සමෘද්ධිය ගොඩනගා ගැනීමේ හැකියාව ඔවුන්ගේ ශක්තියයි. මුරණ්ඩුකම, වෙනසකට අකැමැති වීම සහ සුඛෝපභෝගී දේවල් සඳහා අධික වියදම් කිරීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Mithuna (Gemini) is ruled by Mercury. People born under it are curious, talkative and quick to learn, with a sharp wit and many interests. Their strengths are communication, adaptability and good business sense. They should watch restlessness, scattered attention and starting more things than they finish.",
    si: "මිථුන ලග්නයේ අධිපති බුධ ය. මේ ලග්නයේ උපන් අය කුතුහලශීලී, කතාබහට ප්‍රිය කරන, ඉක්මනින් ඉගෙන ගන්නා අතර තියුණු බුද්ධියකින් සහ බොහෝ ඇල්මවලින් යුක්ත වෙති. සන්නිවේදනය, අනුවර්තනය වීම සහ ව්‍යාපාරික නුවණ ඔවුන්ගේ ශක්තියයි. නොසන්සුන්කම, අවධානය විසිරී යාම සහ නිම කරනවාට වඩා වැඩ ආරම්භ කිරීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Kataka (Cancer) is ruled by the Moon. People born under it are caring, sensitive and deeply attached to family and home. Their strengths are kindness, intuition and loyalty. They should watch moodiness, worrying too much and holding on to old hurts.",
    si: "කටක ලග්නයේ අධිපති චන්ද්‍රයා ය. මේ ලග්නයේ උපන් අය සැලකිලිමත්, සංවේදී අතර පවුල සහ නිවස කෙරෙහි දැඩි බැඳීමක් දක්වති. කරුණාව, සහජ බුද්ධිය සහ පක්ෂපාතිත්වය ඔවුන්ගේ ශක්තියයි. මනෝභාවයන් වෙනස් වීම, අධික ලෙස කරදර වීම සහ පැරණි වේදනා සිතේ තබා ගැනීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Sinha (Leo) is ruled by the Sun. People born under it are confident, generous and proud, with a natural ability to lead and to be noticed. Their strengths are leadership, warmth and a big heart. They should watch pride, a need for praise and taking criticism too personally.",
    si: "සිංහ ලග්නයේ අධිපති රවි ය. මේ ලග්නයේ උපන් අය ආත්ම විශ්වාසයෙන් යුතු, ත්‍යාගශීලී සහ අභිමානවත් අතර නායකත්වය දැරීමට සහ අන් අයගේ අවධානයට ලක්වීමට සහජ හැකියාවක් ඇත්තෝ වෙති. නායකත්වය, උණුසුම සහ විශාල හදවතක් ඔවුන්ගේ ශක්තියයි. උඩඟුකම, ප්‍රශංසාවට ඇති ආශාව සහ විවේචනය අධික ලෙස සිතට ගැනීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Kanya (Virgo) is ruled by Mercury. People born under it are careful, practical and hardworking, with an eye for detail and a wish to be useful. Their strengths are analysis, discipline and a helpful nature. They should watch over-thinking, being too critical of themselves and others, and stress about small things.",
    si: "කන්‍යා ලග්නයේ අධිපති බුධ ය. මේ ලග්නයේ උපන් අය පරිස්සම්කාරී, ප්‍රායෝගික, මහන්සි වී වැඩ කරන අතර සියුම් කරුණු දෙස සැලකිල්ලෙන් බලා අන් අයට වැඩදායක වීමට කැමති වෙති. විශ්ලේෂණ හැකියාව, විනයගරුකභාවය සහ උදව් කරන ගතිය ඔවුන්ගේ ශක්තියයි. අධික ලෙස කල්පනා කිරීම, තමන්ට සහ අන් අයට වැඩියෙන් දොස් කීම සහ සුළු දේවල් ගැන ආතතියට පත්වීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Thula (Libra) is ruled by Venus. People born under it are fair-minded, charming and peace-loving, and they value harmony in relationships. Their strengths are diplomacy, a sense of beauty and the ability to see both sides. They should watch indecision, avoiding conflict at their own cost and depending too much on others' approval.",
    si: "තුලා ලග්නයේ අධිපති සිකුරු ය. මේ ලග්නයේ උපන් අය සාධාරණ, ආකර්ෂණීය, සාමකාමී අතර සබඳතාවල සමගිය අගය කරති. රාජ්‍ය තාන්ත්‍රික දක්ෂතාව, රසවින්දන හැකියාව සහ දෙපැත්තම දැකීමේ හැකියාව ඔවුන්ගේ ශක්තියයි. තීරණ ගැනීමට පමා වීම, ගැටුම් මඟහරින්නට තමන්ට අපහසුතා විඳීම සහ අන් අයගේ අනුමැතිය මත අධික ලෙස රඳා පැවතීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Vrushchika (Scorpio) is ruled by Mars. People born under it are intense, determined and private, with deep feelings and strong willpower. Their strengths are focus, courage and the ability to recover from setbacks. They should watch jealousy, holding grudges and keeping everything to themselves.",
    si: "වෘශ්චික ලග්නයේ අධිපති අඟහරු ය. මේ ලග්නයේ උපන් අය තීව්‍ර, අධිෂ්ඨානශීලී, තමන්ගේ දේ රහසිගතව තබා ගන්නා අතර ගැඹුරු හැඟීම් සහ දැඩි කැපවීමකින් යුක්ත වෙති. අවධානය, ධෛර්යය සහ බාධක වලින් නැවත නැගී සිටීමේ හැකියාව ඔවුන්ගේ ශක්තියයි. ඊර්ෂ්‍යාව, වෛර බැඳ ගැනීම සහ සියල්ල තමන් තුළම තබා ගැනීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Dhanu (Sagittarius) is ruled by Jupiter. People born under it are optimistic, honest and love freedom, learning and travel. Their strengths are wisdom, generosity and a strong belief in doing what is right. They should watch bluntness, over-promising and taking on more than they can manage.",
    si: "ධනු ලග්නයේ අධිපති ගුරු ය. මේ ලග්නයේ උපන් අය සුබවාදී, අවංක අතර නිදහස, ඉගෙනීම සහ ගමන් බිමන් වලට ප්‍රිය කරති. ප්‍රඥාව, ත්‍යාගශීලීභාවය සහ හරි දේ කිරීමේ දැඩි විශ්වාසය ඔවුන්ගේ ශක්තියයි. ඍජුව කතා කර අන් අයව රිදවීම, වැඩියෙන් පොරොන්දු වීම සහ දරාගත හැකි ප්‍රමාණයට වඩා වැඩ බාරගැනීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Makara (Capricorn) is ruled by Saturn. People born under it are disciplined, ambitious and patient, and they usually do better as the years go by. Their strengths are responsibility, perseverance and a practical approach to money and work. They should watch being too serious, worrying about the future and finding it hard to relax.",
    si: "මකර ලග්නයේ අධිපති සෙනසුරු ය. මේ ලග්නයේ උපන් අය විනයගරුක, අභිලාෂකාමී, ඉවසිලිවන්ත අතර සාමාන්‍යයෙන් වයස ගත වන විට වඩාත් දියුණු වෙති. වගකීම, උත්සාහය සහ මුදල් හා රැකියාව කෙරෙහි ප්‍රායෝගික ආකල්පයක් ඔවුන්ගේ ශක්තියයි. අධික බරපතළ වීම, අනාගතය ගැන කරදර වීම සහ සැනසිල්ලේ සිටීමට අපහසු වීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Kumbha (Aquarius) is ruled by Saturn. People born under it are independent, thoughtful and friendly, with original ideas and a concern for others. Their strengths are creativity, loyalty to friends and a wish to help society. They should watch aloofness, stubborn opinions and being slow to show their feelings.",
    si: "කුම්භ ලග්නයේ අධිපති සෙනසුරු ය. මේ ලග්නයේ උපන් අය ස්වාධීන, කල්පනාකාරී, මිත්‍රශීලී අතර අලුත් අදහස් සහ අන් අය ගැන සැලකිල්ලක් ඇත්තෝ වෙති. නිර්මාණශීලිත්වය, මිතුරන්ට ඇති පක්ෂපාතිත්වය සහ සමාජයට උදව් කිරීමේ ආශාව ඔවුන්ගේ ශක්තියයි. අන් අයගෙන් ඈත් වී සිටීම, මුරණ්ඩු අදහස් දැරීම සහ තමන්ගේ හැඟීම් පෙන්වීමට පමා වීම ගැන පරිස්සම් වන්න.",
  },
  {
    en: "Meena (Pisces) is ruled by Jupiter. People born under it are gentle, imaginative and compassionate, with a strong spiritual side. Their strengths are empathy, creativity and a forgiving heart. They should watch being too trusting, avoiding hard facts and taking on other people's troubles.",
    si: "මීන ලග්නයේ අධිපති ගුරු ය. මේ ලග්නයේ උපන් අය මෘදු ගතිගුණ ඇති, පරිකල්පනශීලී, කරුණාවන්ත අතර ශක්තිමත් ආධ්‍යාත්මික පැත්තකින් යුක්ත වෙති. සංවේදීභාවය, නිර්මාණශීලිත්වය සහ සමාව දෙන සිත ඔවුන්ගේ ශක්තියයි. අධික ලෙස අන් අයව විශ්වාස කිරීම, අමිහිරි කරුණුවලින් ඈත් වීම සහ අන් අයගේ ගැටලු තමන් බාරගැනීම ගැන පරිස්සම් වන්න.",
  },
];

/* ---------- Rule-based outlook (used without a Gemini key or if Gemini fails) ---------- */

/** What each house, counted from the Lagna, stands for. */
export const HOUSE_THEME: Record<number, Bilingual> = {
  1: { en: "health and personal growth", si: "සෞඛ්‍යය සහ පෞද්ගලික දියුණුව" },
  2: { en: "money, family and speech", si: "මුදල්, පවුල සහ කථනය" },
  3: { en: "effort, siblings and short journeys", si: "උත්සාහය, සහෝදර සබඳතා සහ කෙටි ගමන්" },
  4: { en: "home, mother and comfort", si: "නිවස, මව සහ සුවපහසුව" },
  5: { en: "children, studies and creativity", si: "දරුවන්, අධ්‍යාපනය සහ නිර්මාණශීලිත්වය" },
  6: { en: "work, debts and rivals", si: "රැකියා, ණය සහ විරුද්ධවාදීන්" },
  7: { en: "marriage and partnerships", si: "විවාහය සහ හවුල්කාරිත්ව" },
  8: { en: "sudden changes, delays and health", si: "අනපේක්ෂිත වෙනස්කම්, ප්‍රමාද සහ සෞඛ්‍යය" },
  9: { en: "fortune, faith and long journeys", si: "භාග්‍යය, ආගමික කටයුතු සහ දුර ගමන්" },
  10: { en: "career, status and reputation", si: "රැකියාව, තනතුරු සහ කීර්තිය" },
  11: { en: "income, gains and friends", si: "ආදායම්, ලාභ සහ මිතුරන්" },
  12: { en: "expenses, sleep and foreign matters", si: "වියදම්, නින්ද සහ විදේශ කටයුතු" },
};

/** Houses (from the Lagna) in which each graha is traditionally favourable in transit. */
const GOOD_HOUSES: Partial<Record<PlanetKey, readonly number[]>> = {
  sun: [3, 6, 10, 11],
  mars: [3, 6, 11],
  venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  jupiter: [2, 5, 7, 9, 11],
  saturn: [3, 6, 11],
};

/** Two slow-moving grahas whose position sets the tone for each period. */
const PERIOD_PLANETS: Record<OutlookPeriod, [PlanetKey, PlanetKey]> = {
  week: ["sun", "mars"],
  month: ["venus", "mars"],
  year: ["jupiter", "saturn"],
};

const PERIOD_INTRO: Record<OutlookPeriod, Bilingual> = {
  week: { en: "Over the coming week:", si: "ඉදිරි සතිය තුළ:" },
  month: { en: "Over the coming month:", si: "ඉදිරි මාසය තුළ:" },
  year: { en: "Over the coming year:", si: "ඉදිරි වසර තුළ:" },
};

const PERIOD_CLOSING: Record<OutlookPeriod, Record<0 | 1 | 2, Bilingual>> = {
  week: {
    2: { en: "It is a favourable week, so use it to move important matters forward.", si: "මෙය සුබ සතියක් බැවින් වැදගත් කටයුතු ඉදිරියට ගෙන යාමට යොදා ගන්න." },
    1: { en: "It is a mixed week, so stay steady and finish what is already in hand.", si: "මිශ්‍ර ප්‍රතිඵල සහිත සතියක් බැවින් සන්සුන්ව සිට අතේ ඇති වැඩ නිම කරන්න." },
    0: { en: "It is a week to go slowly, avoid big commitments and rest well.", si: "සෙමින් කටයුතු කළ යුතු සතියක් බැවින් විශාල බැඳීම්වලින් වැළකී හොඳින් විවේක ගන්න." },
  },
  month: {
    2: { en: "It is a favourable month for plans and fresh starts.", si: "සැලසුම් සහ අලුත් ආරම්භයන් සඳහා සුබ මාසයකි." },
    1: { en: "It is a mixed month, so balance effort with patience.", si: "මිශ්‍ර ප්‍රතිඵල සහිත මාසයක් බැවින් උත්සාහය සමඟ ඉවසීමද තබා ගන්න." },
    0: { en: "It is a month to be careful with money and decisions, and to keep things simple.", si: "මුදල් සහ තීරණ ගැනීමේදී පරිස්සම් වී, සරලව කටයුතු කළ යුතු මාසයකි." },
  },
  year: {
    2: { en: "Overall it is a supportive year, so plan ahead and make good use of it.", si: "සමස්තයක් ලෙස සහායක වසරක් බැවින් කල්තියා සැලසුම් කර එය හොඳින් යොදා ගන්න." },
    1: { en: "Overall it is a mixed year; steady effort and patience will carry you through.", si: "සමස්තයක් ලෙස මිශ්‍ර ප්‍රතිඵල සහිත වසරක්; නොනැවතී උත්සාහ කිරීම සහ ඉවසීම ඔබව ගොඩ ගනී." },
    0: { en: "It is a year that asks for patience, so avoid risky ventures and look after your health.", si: "ඉවසීම අවශ්‍ය වසරක් බැවින් අවදානම් ව්‍යාපාරවලින් වැළකී සෞඛ්‍යය ගැන සැලකිලිමත් වන්න." },
  },
};

function planetLine(planet: PlanetKey, house: number, lang: Lang): { text: string; good: boolean } {
  const good = (GOOD_HOUSES[planet] ?? []).includes(house);
  const name = PLANET_NAMES[planet][lang];
  const theme = HOUSE_THEME[house][lang];
  const ordinal = houseOrdinal(house, lang);
  if (lang === "si") {
    return {
      good,
      text: good
        ? `${name} ඔබේ ${ordinal} භාවයේ ගමන් කරන නිසා ${theme} සම්බන්ධයෙන් සුබ ප්‍රතිඵල ලැබේ.`
        : `${name} ඔබේ ${ordinal} භාවයේ ගමන් කරන නිසා ${theme} සම්බන්ධයෙන් ඉවසීමෙන් සහ පරිස්සමින් කටයුතු කරන්න.`,
    };
  }
  return {
    good,
    text: good
      ? `${name} moves through your ${ordinal} house, which supports ${theme}.`
      : `${name} moves through your ${ordinal} house, so go carefully with ${theme}.`,
  };
}

/**
 * The rule-based outlook for one period. `samples` holds the transits at each of
 * PERIOD_OFFSETS[period] (the first is the main one).
 */
export function ruleOutlook(period: OutlookPeriod, lagnaIndex: number, samples: DailyTransits[], lang: Lang): string {
  const [first, second] = PERIOD_PLANETS[period];
  const main = samples[0];
  const houseOf = (t: DailyTransits, key: PlanetKey) => {
    const planet = t.planets.find((p) => p.key === key);
    return planet ? houseFrom(planet.rashi_index, lagnaIndex) : 1;
  };

  const lines = [first, second].map((key) => planetLine(key, houseOf(main, key), lang));
  const goodCount = lines.filter((l) => l.good).length as 0 | 1 | 2;
  const parts = [PERIOD_INTRO[period][lang], ...lines.map((l) => l.text)];

  // For the year, point out a Jupiter or Saturn sign change before the year ends.
  const end = samples[1];
  if (period === "year" && end) {
    for (const key of ["jupiter", "saturn"] as const) {
      const before = houseOf(main, key);
      const after = houseOf(end, key);
      if (before === after) continue;
      const name = PLANET_NAMES[key][lang];
      parts.push(
        lang === "si"
          ? `වසර අවසන් වන විට ${name} ඔබේ ${houseOrdinal(after, lang)} භාවයට මාරු වන නිසා ${HOUSE_THEME[after].si} පිළිබඳ ප්‍රතිඵල වෙනස් වේ.`
          : `Later in the year ${name} moves into your ${houseOrdinal(after, lang)} house, so ${HOUSE_THEME[after].en} will feel different.`,
      );
    }
  }

  parts.push(PERIOD_CLOSING[period][goodCount][lang]);
  return parts.join(" ");
}

export function lagnaAbout(lagnaIndex: number, lang: Lang): string {
  return LAGNA_ABOUT[lagnaIndex][lang];
}
