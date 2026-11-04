import {
  CAREER_FIELDS,
  DASHA_EFFECTS,
  GENERAL_REMEDY,
  HOUSE_THEMES,
  LAGNA_TRAITS,
  MOON_TRAITS,
  PLANET_KEYWORDS,
  REMEDIES,
} from "@/lib/astroData";
import { deriveFacts, isBenefic, type ChartFacts } from "@/lib/chartFacts";
import {
  NAKSHATRA_NAMES,
  PLANET_NAMES,
  RASHI_NAMES,
  formatDate,
  formatDegree,
  houseOrdinal,
  type Lang,
  type PlanetKey,
} from "@/lib/i18n";
import type { ChartResponse, PredictionBody, PredictionSection } from "@/lib/types";

/** Short planet names read better inside Sinhala prose ("රවි", not "රවි (Sun)"). */
function pn(key: PlanetKey, lang: Lang): string {
  return PLANET_NAMES[key][lang];
}

function rn(index: number, lang: Lang): string {
  return RASHI_NAMES[lang][index];
}

function list(items: string[], lang: Lang): string {
  if (items.length <= 1) return items.join("");
  const joiner = lang === "si" ? " සහ " : " and ";
  return `${items.slice(0, -1).join(", ")}${joiner}${items[items.length - 1]}`;
}

function placement(key: PlanetKey, house: number, lang: Lang): string {
  const kw = PLANET_KEYWORDS[key][lang];
  const theme = HOUSE_THEMES[house - 1][lang];
  if (lang === "si") {
    const tone = isBenefic(key)
      ? "මෙය සාමාන්‍යයෙන් ශුභ ප්‍රතිඵල ලබා දෙයි"
      : "මෙය උත්සාහය සහ ඉවසීම ඉල්ලා සිටින නමුත් කාලයත් සමඟ ශක්තිය ගොඩනඟයි";
    return `${house} වන භාවයේ පිහිටි ${pn(key, lang)} ග්‍රහයා ${kw} යන කරුණු ${theme} සමඟ සම්බන්ධ කරයි; ${tone}.`;
  }
  const tone = isBenefic(key)
    ? "this is generally supportive"
    : "this asks for effort and patience, but builds strength over time";
  return `${pn(key, lang)} in the ${houseOrdinal(house, lang)} house links ${kw} with ${theme}; ${tone}.`;
}

function dignityNote(facts: ChartFacts, key: PlanetKey, lang: Lang): string | null {
  const p = facts.planet[key];
  const sign = rn(p.rashi_index, lang);
  switch (p.dignity) {
    case "exalted":
      return lang === "si"
        ? `${pn(key, lang)} ${sign} රාශියේ උච්ච වීම එහි ශුභ බලය බෙහෙවින් වැඩි කරයි.`
        : `${pn(key, lang)} is exalted in ${sign}, greatly strengthening its good results.`;
    case "own":
      return lang === "si"
        ? `${pn(key, lang)} ස්වක්ෂේත්‍රයේ (${sign}) සිටීම ස්ථාවර සහ විශ්වාසදායක ප්‍රතිඵල ලබා දෙයි.`
        : `${pn(key, lang)} is in its own sign (${sign}), giving steady, reliable results.`;
    case "debilitated":
      return lang === "si"
        ? `${pn(key, lang)} ${sign} රාශියේ නීච බැවින් එයට අදාළ කරුණුවලදී අමතර උත්සාහයක් සහ ශාන්තිකර්ම ප්‍රයෝජනවත් වේ.`
        : `${pn(key, lang)} is debilitated in ${sign}, so its matters need extra effort and benefit from remedies.`;
    default:
      return null;
  }
}

function lordSentence(facts: ChartFacts, house: number, lang: Lang): string {
  const h = facts.houses[house - 1];
  const theme = HOUSE_THEMES[house - 1][lang];
  const lordTheme = HOUSE_THEMES[h.lordHouse - 1][lang];
  if (lang === "si") {
    return `${house} වන භාවය (${theme}) ${rn(h.rashiIndex, lang)} රාශිය වන අතර එහි අධිපති ${pn(h.lord, lang)} ${h.lordHouse} වන භාවයේ පිහිටීම නිසා මෙම කරුණු ${lordTheme} සමඟ බැඳේ.`;
  }
  return `Your ${houseOrdinal(house, lang)} house (${theme}) is ${rn(h.rashiIndex, lang)}; its lord ${pn(h.lord, lang)} sits in the ${houseOrdinal(h.lordHouse, lang)} house, tying these matters to ${lordTheme}.`;
}

function summary(facts: ChartFacts, lang: Lang): PredictionSection {
  const { chart } = facts;
  const nak = NAKSHATRA_NAMES[lang][chart.nakshatra.index];
  const bal = chart.dasha.birth_balance;
  const lagna = rn(chart.lagna.rashi_index, lang);
  const nav = rn(chart.lagna.navamsha_rashi_index, lang);
  const moon = rn(chart.moon_sign.rashi_index, lang);

  const paragraphs =
    lang === "si"
      ? [
          `${chart.birth.name} ${chart.birth.place ? `${chart.birth.place} හිදී ` : ""}උපත ලැබූ මොහොතේ නැගෙනහිර ක්ෂිතිජයේ උදාවෙමින් තිබුණේ ${lagna} රාශියයි (${formatDegree(chart.lagna.degree_in_sign)}). එබැවින් ලග්නය ${lagna} වන අතර ලග්නාධිපති ${pn(facts.lagnaLord, lang)} වේ. නවාංශක ලග්නය ${nav} වේ.`,
          `උපතේදී චන්ද්‍රයා ${moon} රාශියේ ${nak} නැකතේ ${chart.nakshatra.pada} වන පාදයේ සිටි බැවින් ඔබේ උපන් නැකත ${nak} වන අතර චන්ද්‍ර රාශිය ${moon}, රාශි අධිපති ${pn(chart.rashi_lord, lang)} වේ.`,
          `උපතේදී ගත වෙමින් තිබුණේ ${pn(bal.lord, lang)} මහ දශාවයි; එහි ඉතිරි කාලය අවුරුදු ${bal.years} මාස ${bal.months} දින ${bal.days} කි.`,
        ]
      : [
          `At the moment of ${chart.birth.name}'s birth${chart.birth.place ? ` in ${chart.birth.place}` : ""}, ${lagna} was rising on the eastern horizon (${formatDegree(chart.lagna.degree_in_sign)}). The Lagna is therefore ${lagna}, ruled by ${pn(facts.lagnaLord, lang)}, and the Navamsha Lagna is ${nav}.`,
          `The Moon was in ${moon}, in ${nak} nakshatra pada ${chart.nakshatra.pada}. Your birth star (Upan Nakatha) is ${nak}, your Rashi is ${moon} and its lord is ${pn(chart.rashi_lord, lang)}.`,
          `You were born in the Maha Dasha of ${pn(bal.lord, lang)}, with ${bal.years} years, ${bal.months} months and ${bal.days} days of it remaining.`,
        ];

  const highlights =
    lang === "si"
      ? [
          `ලග්නය: ${lagna}`,
          `නවාංශක ලග්නය: ${nav}`,
          `උපන් නැකත: ${nak} (${chart.nakshatra.pada} පාදය)`,
          `චන්ද්‍ර රාශිය: ${moon}`,
          `රාශි අධිපති: ${pn(chart.rashi_lord, lang)}`,
          `ලග්නාධිපති: ${pn(facts.lagnaLord, lang)}`,
        ]
      : [
          `Lagna: ${lagna}`,
          `Navamsha Lagna: ${nav}`,
          `Nakshatra: ${nak} (pada ${chart.nakshatra.pada})`,
          `Moon sign: ${moon}`,
          `Rashi lord: ${pn(chart.rashi_lord, lang)}`,
          `Lagna lord: ${pn(facts.lagnaLord, lang)}`,
        ];
  return { paragraphs, highlights };
}

function personality(facts: ChartFacts, lang: Lang): PredictionSection {
  const { chart } = facts;
  const paragraphs: string[] = [LAGNA_TRAITS[chart.lagna.rashi_index][lang]];

  const first = facts.houses[0].occupants;
  if (first.length) {
    paragraphs.push(first.map((k) => placement(k, 1, lang)).join(" "));
  } else {
    paragraphs.push(
      lang === "si"
        ? "ලග්න භාවයේ ග්‍රහයින් නොමැති බැවින් ඔබේ පෞරුෂය ප්‍රධාන වශයෙන් ලග්නාධිපතියාගේ පිහිටීම අනුව හැඩගැසේ."
        : "No planets occupy the Lagna, so your personality is shaped mainly by the placement of the Lagna lord.",
    );
  }
  const ll = facts.planet[facts.lagnaLord];
  paragraphs.push(
    lang === "si"
      ? `ලග්නාධිපති ${pn(facts.lagnaLord, lang)} ${ll.house} වන භාවයේ පිහිටා සිටින බැවින් ඔබේ ජීවිතයේ අවධානය ${HOUSE_THEMES[ll.house - 1][lang]} කෙරෙහි යොමු වේ. ${dignityNote(facts, facts.lagnaLord, lang) ?? ""}`.trim()
      : `With the Lagna lord ${pn(facts.lagnaLord, lang)} in the ${houseOrdinal(ll.house, lang)} house, much of your life's focus turns towards ${HOUSE_THEMES[ll.house - 1][lang]}. ${dignityNote(facts, facts.lagnaLord, lang) ?? ""}`.trim(),
  );

  paragraphs.push(
    `${MOON_TRAITS[chart.moon_sign.rashi_index][lang]} ${
      lang === "si"
        ? `${NAKSHATRA_NAMES.si[chart.nakshatra.index]} නැකතේ අධිපති ${pn(chart.nakshatra.lord, lang)} වන බැවින් එම ග්‍රහයාගේ ගතිගුණද ඔබේ මනසට බලපායි.`
        : `As ${NAKSHATRA_NAMES.en[chart.nakshatra.index]} is ruled by ${pn(chart.nakshatra.lord, lang)}, that planet's qualities also colour your mind.`
    }`,
  );

  const highlights = [
    ...facts.strongPlanets.map((k) => (lang === "si" ? `බලවත් ග්‍රහයා: ${pn(k, lang)}` : `Strong planet: ${pn(k, lang)}`)),
    ...facts.weakPlanets.map((k) => (lang === "si" ? `දුර්වල ග්‍රහයා: ${pn(k, lang)}` : `Weak planet: ${pn(k, lang)}`)),
  ];
  return { paragraphs, highlights };
}

function career(facts: ChartFacts, lang: Lang): PredictionSection {
  const paragraphs: string[] = [];
  for (const house of [2, 4, 5, 10, 11]) {
    const parts = [lordSentence(facts, house, lang)];
    for (const k of facts.houses[house - 1].occupants) parts.push(placement(k, house, lang));
    paragraphs.push(parts.join(" "));
  }

  // Career significators: planets in the 10th, else the 10th lord.
  const tenth = facts.houses[9];
  const significators: PlanetKey[] = tenth.occupants.length ? [...tenth.occupants] : [tenth.lord];
  if (!significators.includes(tenth.lord)) significators.push(tenth.lord);
  const fields = significators.map((k) => CAREER_FIELDS[k][lang]);

  paragraphs.push(
    lang === "si"
      ? `දසවන භාවයට බලපාන ${list(significators.map((k) => pn(k, lang)), lang)} ග්‍රහයින් අනුව ${list(fields, lang)} වැනි ක්ෂේත්‍ර ඔබට ගැළපේ. පස්වන භාවය සහ බුධ-ගුරු ග්‍රහයින්ගේ පිහිටීම අධ්‍යාපන කටයුතුවලට, දෙවන හා එකොළොස්වන භාව ධනය හා ආදායමට බලපායි.`
      : `Based on ${list(significators.map((k) => pn(k, lang)), lang)} influencing the 10th house, fields such as ${list(fields, lang)} suit you. The 5th house with Mercury and Jupiter guides education, while the 2nd and 11th houses show savings and income.`,
  );

  const notes = (["mercury", "jupiter"] as PlanetKey[]).map((k) => dignityNote(facts, k, lang)).filter(Boolean) as string[];
  if (notes.length) paragraphs.push(notes.join(" "));

  const highlights = significators.map((k) =>
    lang === "si" ? `සුදුසු ක්ෂේත්‍ර: ${CAREER_FIELDS[k].si}` : `Suitable fields: ${CAREER_FIELDS[k].en}`,
  );
  return { paragraphs, highlights };
}

function marriage(facts: ChartFacts, lang: Lang): PredictionSection {
  const paragraphs: string[] = [];
  const seventh = facts.houses[6];
  const parts = [lordSentence(facts, 7, lang)];
  if (seventh.occupants.length) {
    for (const k of seventh.occupants) parts.push(placement(k, 7, lang));
  } else {
    parts.push(
      lang === "si"
        ? "සත්වන භාවයේ ග්‍රහයින් නොමැති බැවින් විවාහ කරුණු ප්‍රධාන වශයෙන් සත්වන අධිපතියා සහ ශුක්‍රයා අනුව තීරණය වේ."
        : "With no planets in the 7th house, marriage is judged mainly from the 7th lord and Venus.",
    );
  }
  paragraphs.push(parts.join(" "));

  const venus = facts.planet.venus;
  const karaka: PlanetKey = facts.chart.birth.gender === "female" ? "jupiter" : "venus";
  paragraphs.push(
    [
      lang === "si"
        ? `විවාහ කාරක ශුක්‍රයා ${rn(venus.rashi_index, lang)} රාශියේ ${venus.house} වන භාවයේ පිහිටා ඇත.`
        : `Venus, the significator of marriage, is in ${rn(venus.rashi_index, lang)} in the ${houseOrdinal(venus.house, lang)} house.`,
      dignityNote(facts, "venus", lang),
      karaka === "jupiter"
        ? lang === "si"
          ? `ස්ත්‍රී කේන්දරයක ස්වාමි කාරක ගුරු ${facts.planet.jupiter.house} වන භාවයේ ${rn(facts.planet.jupiter.rashi_index, lang)} රාශියේ සිටී. ${dignityNote(facts, "jupiter", lang) ?? ""}`.trim()
          : `In a woman's chart Jupiter signifies the husband; it is in ${rn(facts.planet.jupiter.rashi_index, lang)} in the ${houseOrdinal(facts.planet.jupiter.house, lang)} house. ${dignityNote(facts, "jupiter", lang) ?? ""}`.trim()
        : null,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const nav7 = facts.navamshaHouses[6];
  paragraphs.push(
    lang === "si"
      ? `නවාංශක කේන්දරයේ සත්වන භාවය ${rn(nav7.rashiIndex, lang)} වන අතර එහි අධිපති ${pn(nav7.lord, lang)} වේ${nav7.occupants.length ? `; එහි ${list(nav7.occupants.map((k) => pn(k, lang)), lang)} පිහිටා ඇත` : ""}. නවාංශකය විවාහ ජීවිතයේ ගුණාත්මකභාවය පෙන්වන බැවින් ${isBenefic(nav7.lord) ? "මෙය සහකරු/සහකාරිය සමඟ සුහදතාව සහ සහයෝගය පෙන්නුම් කරයි" : "අන්‍යෝන්‍ය අවබෝධය සහ ඉවසීම මගින් බැඳීම ශක්තිමත් වේ"}.`
      : `In the Navamsha, the 7th house is ${rn(nav7.rashiIndex, lang)}, ruled by ${pn(nav7.lord, lang)}${nav7.occupants.length ? `, occupied by ${list(nav7.occupants.map((k) => pn(k, lang)), lang)}` : ""}. As the Navamsha shows the quality of married life, ${isBenefic(nav7.lord) ? "this points to warmth and mutual support with your partner" : "patience and mutual understanding will steadily deepen the bond"}.`,
  );

  paragraphs.push(
    facts.kujaDosha
      ? lang === "si"
        ? `කුජයා ලග්නයේ සිට ${facts.planet.mars.house} වන භාවයේ සිටින බැවින් කුජ දෝෂයක් පවතී. විවාහයට පෙර පොරොන්දම් ගැලපීමේදී මෙය සැලකිල්ලට ගැනීම සම්ප්‍රදායයි.`
        : `Mars is in the ${houseOrdinal(facts.planet.mars.house, lang)} house from Lagna, so Kuja dosha is present. Traditionally this is weighed carefully during porondam (horoscope matching) before marriage.`
      : lang === "si"
        ? "කුජ දෝෂයක් නොමැත."
        : "There is no Kuja dosha in this chart.",
  );

  const highlights =
    lang === "si"
      ? [`සත්වන භාවය: ${rn(seventh.rashiIndex, lang)}`, `සත්වන අධිපති: ${pn(seventh.lord, lang)}`, `කුජ දෝෂය: ${facts.kujaDosha ? "ඇත" : "නැත"}`]
      : [`7th house: ${rn(seventh.rashiIndex, lang)}`, `7th lord: ${pn(seventh.lord, lang)}`, `Kuja dosha: ${facts.kujaDosha ? "present" : "absent"}`];
  return { paragraphs, highlights };
}

function future(facts: ChartFacts, lang: Lang): PredictionSection {
  const paragraphs: string[] = [];
  const highlights: string[] = [];
  const maha = facts.currentMaha;
  const antar = facts.currentAntar;

  if (maha) {
    const p = facts.planet[maha.lord];
    paragraphs.push(
      lang === "si"
        ? `වර්තමානයේ ඔබ ගත කරන්නේ ${pn(maha.lord, lang)} මහ දශාවයි (${formatDate(maha.start, lang)} සිට ${formatDate(maha.end, lang)} දක්වා). ${DASHA_EFFECTS[maha.lord].si}`
        : `You are currently in the Maha Dasha of ${pn(maha.lord, lang)} (${formatDate(maha.start, lang)} to ${formatDate(maha.end, lang)}). ${DASHA_EFFECTS[maha.lord].en}`,
    );
    paragraphs.push([placement(maha.lord, p.house, lang), dignityNote(facts, maha.lord, lang)].filter(Boolean).join(" "));
    highlights.push(
      lang === "si"
        ? `මහ දශාව: ${pn(maha.lord, lang)} (${formatDate(maha.end, lang)} දක්වා)`
        : `Maha Dasha: ${pn(maha.lord, lang)} (until ${formatDate(maha.end, lang)})`,
    );
  }

  if (antar && maha) {
    const ap = facts.planet[antar.lord];
    paragraphs.push(
      lang === "si"
        ? `මේ වන විට ${pn(antar.lord, lang)} අන්තර් දශාව ${formatDate(antar.end, lang)} දක්වා ක්‍රියාත්මක වේ. ${ap.house} වන භාවයේ සිටින ${pn(antar.lord, lang)} නිසා මෙම කාලයේදී ${HOUSE_THEMES[ap.house - 1].si} පිළිබඳ කරුණු විශේෂයෙන් ඉස්මතු වේ.`
        : `The ${pn(antar.lord, lang)} Antar Dasha runs until ${formatDate(antar.end, lang)}. With ${pn(antar.lord, lang)} in the ${houseOrdinal(ap.house, lang)} house, matters of ${HOUSE_THEMES[ap.house - 1].en} come especially to the fore in this sub-period.`,
    );
    highlights.push(
      lang === "si"
        ? `අන්තර් දශාව: ${pn(antar.lord, lang)} (${formatDate(antar.end, lang)} දක්වා)`
        : `Antar Dasha: ${pn(antar.lord, lang)} (until ${formatDate(antar.end, lang)})`,
    );
  }

  if (facts.nextMaha) {
    paragraphs.push(
      lang === "si"
        ? `${formatDate(facts.nextMaha.start, lang)} සිට ${pn(facts.nextMaha.lord, lang)} මහ දශාව ආරම්භ වේ. ${DASHA_EFFECTS[facts.nextMaha.lord].si}`
        : `From ${formatDate(facts.nextMaha.start, lang)} the Maha Dasha of ${pn(facts.nextMaha.lord, lang)} begins. ${DASHA_EFFECTS[facts.nextMaha.lord].en}`,
    );
  }

  if (!paragraphs.length) {
    paragraphs.push(
      lang === "si"
        ? "යොමු දිනය උපන් දිනයට පෙර බැවින් වර්තමාන දශාවක් පෙන්විය නොහැක."
        : "The reference date is outside the dasha timeline, so no current period can be shown.",
    );
  }
  return { paragraphs, highlights };
}

function remedies(facts: ChartFacts, lang: Lang): string[] {
  const lords: PlanetKey[] = [];
  if (facts.currentMaha) lords.push(facts.currentMaha.lord);
  if (facts.currentAntar && !lords.includes(facts.currentAntar.lord)) lords.push(facts.currentAntar.lord);
  for (const weak of facts.weakPlanets) if (!lords.includes(weak)) lords.push(weak);
  const out = lords.flatMap((k) => REMEDIES[k].map((r) => r[lang]));
  out.push(GENERAL_REMEDY[lang]);
  return out;
}

export function generateRulePrediction(chart: ChartResponse, lang: Lang): PredictionBody {
  const facts = deriveFacts(chart);
  return {
    sections: {
      summary: summary(facts, lang),
      personality: personality(facts, lang),
      career: career(facts, lang),
      marriage: marriage(facts, lang),
      future: future(facts, lang),
    },
    remedies: remedies(facts, lang),
  };
}
