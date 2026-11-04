import { RASHI_LORDS, BENEFICS } from "@/lib/astroData";
import { NAKSHATRA_NAMES, PLANET_NAMES, RASHI_NAMES, formatDegree, type PlanetKey } from "@/lib/i18n";
import type { ChartResponse, DashaPeriod, MahaDasha, PlanetPosition } from "@/lib/types";

export interface HouseFacts {
  house: number;
  rashiIndex: number;
  lord: PlanetKey;
  lordHouse: number;
  lordDignity: PlanetPosition["dignity"];
  occupants: PlanetKey[];
}

export interface ChartFacts {
  chart: ChartResponse;
  planet: Record<PlanetKey, PlanetPosition>;
  houses: HouseFacts[]; // index 0 = house 1
  navamshaHouses: { house: number; rashiIndex: number; lord: PlanetKey; occupants: PlanetKey[] }[];
  lagnaLord: PlanetKey;
  moonHouse: number;
  kujaDosha: boolean;
  currentMaha: DashaPeriod | null;
  currentAntar: DashaPeriod | null;
  nextMaha: MahaDasha | null;
  strongPlanets: PlanetKey[];
  weakPlanets: PlanetKey[];
}

export function deriveFacts(chart: ChartResponse): ChartFacts {
  const planet = Object.fromEntries(chart.planets.map((p) => [p.key, p])) as Record<PlanetKey, PlanetPosition>;

  const houses: HouseFacts[] = chart.rashi_chart.houses.map((h) => {
    const lord = RASHI_LORDS[h.rashi_index];
    return {
      house: h.house,
      rashiIndex: h.rashi_index,
      lord,
      lordHouse: planet[lord].house,
      lordDignity: planet[lord].dignity,
      occupants: h.occupants,
    };
  });

  const navamshaHouses = chart.navamsha_chart.houses.map((h) => ({
    house: h.house,
    rashiIndex: h.rashi_index,
    lord: RASHI_LORDS[h.rashi_index],
    occupants: h.occupants,
  }));

  const currentIdx = chart.dasha.maha_dashas.findIndex((m) => m.is_current);
  const nextMaha = currentIdx >= 0 ? chart.dasha.maha_dashas[currentIdx + 1] ?? null : null;

  return {
    chart,
    planet,
    houses,
    navamshaHouses,
    lagnaLord: chart.lagna.lord,
    moonHouse: chart.moon_sign.house,
    // Kuja dosha as commonly checked in Sri Lanka: Mars in 1, 2, 4, 7, 8 or 12 from Lagna.
    kujaDosha: [1, 2, 4, 7, 8, 12].includes(planet.mars.house),
    currentMaha: chart.dasha.current_maha,
    currentAntar: chart.dasha.current_antar,
    nextMaha,
    strongPlanets: chart.planets.filter((p) => p.dignity === "exalted" || p.dignity === "own").map((p) => p.key),
    weakPlanets: chart.planets.filter((p) => p.dignity === "debilitated").map((p) => p.key),
  };
}

export function isBenefic(key: PlanetKey): boolean {
  return BENEFICS.includes(key);
}

/**
 * Compact, unambiguous English digest of the chart for the LLM prompt.
 * Every fact the model may use is stated here so it never has to compute positions.
 */
export function chartDigest(facts: ChartFacts): string {
  const { chart, planet } = facts;
  const en = (k: PlanetKey) => PLANET_NAMES[k].en;
  const rashi = (i: number) => RASHI_NAMES.en[i];
  const lines: string[] = [];

  lines.push(`Native: ${chart.birth.name} (${chart.birth.gender})`);
  lines.push(
    `Birth: ${chart.birth.local_datetime} local Sri Lanka time (UTC${chart.birth.utc_offset}), place ${chart.birth.place ?? "—"} (${chart.birth.lat}, ${chart.birth.lon})`,
  );
  lines.push(`Ayanamsha: ${chart.ayanamsha_name} ${formatDegree(chart.ayanamsha)}`);
  lines.push(
    `Lagna: ${rashi(chart.lagna.rashi_index)} ${formatDegree(chart.lagna.degree_in_sign)}; Lagna lord ${en(facts.lagnaLord)} in house ${planet[facts.lagnaLord].house} (${planet[facts.lagnaLord].dignity})`,
  );
  lines.push(`Navamsha Lagna: ${rashi(chart.lagna.navamsha_rashi_index)}; lord ${en(chart.lagna.navamsha_lord)}`);
  lines.push(
    `Moon sign (Rashi): ${rashi(chart.moon_sign.rashi_index)} in house ${chart.moon_sign.house}; Rashi lord ${en(chart.rashi_lord)}`,
  );
  lines.push(
    `Birth Nakshatra: ${NAKSHATRA_NAMES.en[chart.nakshatra.index]} (Sinhala: ${NAKSHATRA_NAMES.si[chart.nakshatra.index]}) pada ${chart.nakshatra.pada}, nakshatra lord ${en(chart.nakshatra.lord)}`,
  );

  lines.push("", "Planets (sidereal, whole-sign houses from Lagna):");
  for (const p of chart.planets) {
    lines.push(
      `- ${en(p.key)}: ${rashi(p.rashi_index)} ${formatDegree(p.degree_in_sign)}, house ${p.house}, nakshatra ${NAKSHATRA_NAMES.en[p.nakshatra.index]} pada ${p.nakshatra.pada}, navamsha ${rashi(p.navamsha_rashi_index)} (D9 house ${p.navamsha_house}), dignity ${p.dignity}${p.retrograde && p.key !== "rahu" && p.key !== "ketu" ? ", retrograde" : ""}`,
    );
  }

  lines.push("", "Rashi chart houses (house: sign, lord -> lord's house, occupants):");
  for (const h of facts.houses) {
    lines.push(
      `- H${h.house}: ${rashi(h.rashiIndex)}, lord ${en(h.lord)} -> H${h.lordHouse} (${h.lordDignity}), occupants: ${h.occupants.length ? h.occupants.map(en).join(", ") : "none"}`,
    );
  }

  lines.push("", "Navamsha (D9) houses:");
  for (const h of facts.navamshaHouses) {
    lines.push(
      `- D9 H${h.house}: ${rashi(h.rashiIndex)}, lord ${en(h.lord)}, occupants: ${h.occupants.length ? h.occupants.map(en).join(", ") : "none"}`,
    );
  }

  lines.push("", `Kuja dosha (Mars in 1/2/4/7/8/12 from Lagna): ${facts.kujaDosha ? "present" : "absent"}`);

  const bal = chart.dasha.birth_balance;
  lines.push(
    "",
    `Vimshottari balance at birth: ${en(bal.lord)} ${bal.years}y ${bal.months}m ${bal.days}d`,
    `Reference date ("today"): ${chart.dasha.as_of}`,
    "Maha Dasha sequence:",
  );
  for (const m of chart.dasha.maha_dashas) {
    lines.push(`- ${en(m.lord)}: ${m.start} to ${m.end}${m.is_current ? "  <-- CURRENT" : ""}`);
  }
  if (facts.currentMaha) {
    lines.push(
      `Current Maha Dasha: ${en(facts.currentMaha.lord)} (${facts.currentMaha.start} to ${facts.currentMaha.end}); lord placed in house ${planet[facts.currentMaha.lord].house}, ${rashi(planet[facts.currentMaha.lord].rashi_index)}, ${planet[facts.currentMaha.lord].dignity}`,
    );
  }
  if (facts.currentAntar) {
    lines.push(
      `Current Antar Dasha: ${en(facts.currentAntar.lord)} (${facts.currentAntar.start} to ${facts.currentAntar.end}); lord in house ${planet[facts.currentAntar.lord].house}`,
    );
  }
  const currentMahaFull = chart.dasha.maha_dashas.find((m) => m.is_current);
  if (currentMahaFull) {
    lines.push("Antar Dashas of the current Maha Dasha:");
    for (const a of currentMahaFull.antar_dashas) {
      lines.push(`- ${en(a.lord)}: ${a.start} to ${a.end}${a.is_current ? "  <-- CURRENT" : ""}`);
    }
  }
  if (facts.nextMaha) {
    lines.push(`Next Maha Dasha: ${en(facts.nextMaha.lord)} from ${facts.nextMaha.start}`);
  }
  return lines.join("\n");
}
