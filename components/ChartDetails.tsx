"use client";

import { useLanguage } from "@/context/LanguageContext";
import {
  NAKSHATRA_NAMES,
  PLANET_ABBR,
  PLANET_NAMES,
  RASHI_NAMES,
  formatDegree,
  type ChartBodyKey,
  type Lang,
} from "@/lib/i18n";
import { getTown } from "@/lib/sriLankaTowns";
import type { ChartResponse } from "@/lib/types";

function formatLocal(iso: string): string {
  // "1996-06-01T10:30:00+06:30" -> "1996-06-01 10:30"
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

export function BirthDetailsCard({ chart, townId }: { chart: ChartResponse; townId: string }) {
  const { lang, t } = useLanguage();
  const town = getTown(townId);
  const rows: [string, string][] = [
    [t.fullName, chart.birth.name],
    [t.gender, t.genders[chart.birth.gender]],
    [t.localTime, formatLocal(chart.birth.local_datetime)],
    [t.utcOffset, `UTC${chart.birth.utc_offset}`],
    [t.utcTime, formatLocal(chart.birth.utc_datetime)],
    [t.placeOfBirth, town ? town[lang] : chart.birth.place ?? "—"],
    [t.coordinates, `${chart.birth.lat.toFixed(4)}°N, ${chart.birth.lon.toFixed(4)}°E`],
    [t.ayanamsha, formatDegree(chart.ayanamsha)],
    [t.lagna, `${RASHI_NAMES[lang][chart.lagna.rashi_index]} ${formatDegree(chart.lagna.degree_in_sign)}`],
    [t.navamshaLagna, RASHI_NAMES[lang][chart.lagna.navamsha_rashi_index]],
    [t.nakshatra, `${NAKSHATRA_NAMES[lang][chart.nakshatra.index]} — ${t.pada} ${chart.nakshatra.pada}`],
    [t.moonSign, RASHI_NAMES[lang][chart.moon_sign.rashi_index]],
    [t.rashiLord, PLANET_NAMES[chart.rashi_lord][lang]],
    [t.lagnaLord, PLANET_NAMES[chart.lagna.lord][lang]],
  ];

  return (
    <section className="glass print-avoid-break rounded-3xl p-4 sm:p-6">
      <h2 className="font-sinhala mb-3 text-lg leading-relaxed font-semibold text-gold-200 sm:mb-4">{t.birthDetails}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm leading-relaxed sm:grid-cols-2 sm:gap-y-2.5 lg:grid-cols-1 print:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-2">
            <dt className="min-w-0 text-indigo-200/65">{label}</dt>
            <dd className="shrink-0 text-right font-medium text-indigo-50">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PlanetTable({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();

  const statusOf = (p: ChartResponse["planets"][number]) =>
    [
      p.dignity !== "neutral" ? t.dignities[p.dignity] : null,
      p.retrograde && p.key !== "rahu" && p.key !== "ketu" ? t.retrograde : null,
    ]
      .filter(Boolean)
      .join(", ");

  const statusColor = (p: ChartResponse["planets"][number]) =>
    p.dignity === "exalted" || p.dignity === "own"
      ? "text-emerald-300"
      : p.dignity === "debilitated"
        ? "text-red-300"
        : "text-indigo-200/70";

  return (
    <section className="glass print-avoid-break rounded-3xl p-4 sm:p-6">
      <h2 className="font-sinhala mb-3 text-lg leading-relaxed font-semibold text-gold-200 sm:mb-4">{t.planetTable}</h2>

      {/* Cards on phones and in the half-width desktop column; the full table on tablets and in print. */}
      <ul className="grid grid-cols-2 gap-2.5 md:hidden lg:grid print:hidden">
        <li className="rounded-2xl border border-gold-400/30 bg-maroon-900/30 p-3">
          <PlanetCardHeader abbr={PLANET_ABBR.lagna[lang]} name={SHORT_NAMES.lagna[lang]} highlight />
          <p className="mt-2 text-sm leading-relaxed text-indigo-50">
            {RASHI_NAMES[lang][chart.lagna.rashi_index]}{" "}
            <span className="tabular-nums text-indigo-200/70">{formatDegree(chart.lagna.degree_in_sign)}</span>
          </p>
          <p className="text-xs leading-relaxed text-gold-200/80">{t.colHouse} 1</p>
          <p className="text-xs leading-relaxed text-indigo-200/70">
            {NAKSHATRA_NAMES[lang][chart.lagna.nakshatra.index]} ({chart.lagna.nakshatra.pada})
          </p>
        </li>
        {chart.planets.map((p) => {
          const status = statusOf(p);
          return (
            <li key={p.key} className="rounded-2xl border border-white/10 bg-cosmic-900/50 p-3">
              <PlanetCardHeader abbr={PLANET_ABBR[p.key][lang]} name={SHORT_NAMES[p.key][lang]} />
              <p className="mt-2 text-sm leading-relaxed text-indigo-50">
                {RASHI_NAMES[lang][p.rashi_index]}{" "}
                <span className="tabular-nums text-indigo-200/70">{formatDegree(p.degree_in_sign)}</span>
              </p>
              <p className="text-xs leading-relaxed text-gold-200/80">
                {t.colHouse} {p.house}
              </p>
              <p className="text-xs leading-relaxed text-indigo-200/70">
                {NAKSHATRA_NAMES[lang][p.nakshatra.index]} ({p.nakshatra.pada})
              </p>
              <p className="text-xs leading-relaxed text-indigo-200/65">
                {t.colNavamsha}: {RASHI_NAMES[lang][p.navamsha_rashi_index]}
              </p>
              {status && <p className={`mt-1 text-xs leading-relaxed font-medium ${statusColor(p)}`}>{status}</p>}
            </li>
          );
        })}
      </ul>

      <div className="-mx-2 hidden overflow-x-auto md:block lg:hidden print:block print:overflow-visible">
        <table className="w-full min-w-[640px] text-left text-sm print:min-w-0">
          <thead>
            <tr className="border-b border-gold-400/20 text-xs text-gold-100/70">
              {[t.colPlanet, t.colRashi, t.colDegree, t.colHouse, t.colNakshatra, t.colNavamsha, t.colStatus].map((h) => (
                <th key={h} className="px-2 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="px-2 py-2 font-semibold text-gold-200">{PLANET_NAMES.lagna[lang]}</td>
              <td className="px-2 py-2">{RASHI_NAMES[lang][chart.lagna.rashi_index]}</td>
              <td className="px-2 py-2 tabular-nums">{formatDegree(chart.lagna.degree_in_sign)}</td>
              <td className="px-2 py-2">1</td>
              <td className="px-2 py-2">
                {NAKSHATRA_NAMES[lang][chart.lagna.nakshatra.index]} ({chart.lagna.nakshatra.pada})
              </td>
              <td className="px-2 py-2">{RASHI_NAMES[lang][chart.lagna.navamsha_rashi_index]}</td>
              <td className="px-2 py-2">—</td>
            </tr>
            {chart.planets.map((p) => {
              const status = statusOf(p);
              return (
                <tr key={p.key} className="border-b border-white/5">
                  <td className="px-2 py-2 font-medium text-indigo-50">{PLANET_NAMES[p.key][lang]}</td>
                  <td className="px-2 py-2">{RASHI_NAMES[lang][p.rashi_index]}</td>
                  <td className="px-2 py-2 tabular-nums">{formatDegree(p.degree_in_sign)}</td>
                  <td className="px-2 py-2">{p.house}</td>
                  <td className="px-2 py-2">
                    {NAKSHATRA_NAMES[lang][p.nakshatra.index]} ({p.nakshatra.pada})
                  </td>
                  <td className="px-2 py-2">{RASHI_NAMES[lang][p.navamsha_rashi_index]}</td>
                  <td className={`px-2 py-2 ${statusColor(p)}`}>
                    {status || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-indigo-200/65">
        {chart.ayanamsha_name} · {chart.ephemeris}
      </p>
    </section>
  );
}

/** Card titles drop the bracketed gloss ("Jupiter (Guru)" -> "Jupiter") to fit two columns. */
const SHORT_NAMES = Object.fromEntries(
  Object.entries(PLANET_NAMES).map(([key, names]) => [
    key,
    { si: names.si, en: names.en.replace(/ \(.*\)$/, "") },
  ]),
) as Record<ChartBodyKey, Record<Lang, string>>;

function PlanetCardHeader({ abbr, name, highlight }: { abbr: string; name: string; highlight?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden
        className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold ${
          highlight ? "bg-gold-400 text-cosmic-950" : "bg-maroon-700/70 text-gold-100"
        }`}
      >
        {abbr}
      </span>
      <span className="truncate text-[15px] leading-relaxed font-semibold text-gold-100">{name}</span>
    </div>
  );
}
