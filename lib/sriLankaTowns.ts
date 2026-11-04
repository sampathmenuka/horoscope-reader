import townData from "@/data/sriLankaTowns.json";
import type { Lang } from "@/lib/i18n";

export interface Town {
  id: string;
  en: string;
  si: string;
  district: { en: string; si: string };
  /** Alternative spellings people commonly type (e.g. බලන්ගොඩ for බලංගොඩ). */
  aliases?: string[];
  lat: number;
  lon: number;
}

export const SRI_LANKA_TOWNS: readonly Town[] = [...(townData as Town[])].sort((a, b) =>
  a.en.localeCompare(b.en),
);

const byId = new Map(SRI_LANKA_TOWNS.map((town) => [town.id, town]));

export function getTown(id: string | null | undefined): Town | undefined {
  return id ? byId.get(id) : undefined;
}

export function townLabel(town: Town, lang: Lang): string {
  return lang === "si" ? town.si : town.en;
}

/**
 * Matches either script so a Sinhala user can type "Kandy" and vice-versa.
 * Ranked: exact name, then names starting with the query, then other name or
 * alias matches, then district matches (so "Colombo" picks Colombo, not Avissawella).
 */
export function searchTowns(query: string): Town[] {
  const raw = query.trim();
  const q = raw.toLowerCase();
  if (!q) return [...SRI_LANKA_TOWNS];

  const names = (town: Town) => [town.en.toLowerCase(), town.si, ...(town.aliases ?? []).map((a) => a.toLowerCase())];
  const rank = (town: Town): number => {
    const n = names(town);
    if (n.some((x) => x === q || x === raw)) return 0;
    if (n.some((x) => x.startsWith(q) || x.startsWith(raw))) return 1;
    if (n.some((x) => x.includes(q) || x.includes(raw))) return 2;
    if (town.district.en.toLowerCase().includes(q) || town.district.si.includes(raw)) return 3;
    return -1;
  };

  return SRI_LANKA_TOWNS.map((town) => ({ town, r: rank(town) }))
    .filter((x) => x.r >= 0)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.town);
}
