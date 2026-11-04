"use client";

import { SriLankanChart } from "@/components/SriLankanChart";
import { useLanguage } from "@/context/LanguageContext";
import {
  NAKSHATRA_NAMES,
  PLANET_NAMES,
  RASHI_NAMES,
  formatDate,
  formatDegree,
  formatSriLankanTime,
} from "@/lib/i18n";
import { getTown } from "@/lib/sriLankaTowns";
import type { ChartResponse } from "@/lib/types";

/*
 * Single-page traditional Handahana for A4 printing. Hidden on screen; shown only
 * when printing in "kendaraya" mode (see lib/print.ts and globals.css).
 * Sized in millimetres for the A4 printable area (@page margins 14mm × 12mm → 186 × 269mm),
 * kept a few millimetres short so rounding never spills onto a second page.
 */

const MAROON = "#6b1d2e";
const GOLD = "#a87b28";

/** Liyawela-style frame: double rules, a repeating vine-and-leaf band, lotus rosettes at the corners. */
function LiyawelaBorder() {
  const W = 186;
  const H = 265;
  const band = 9; // band width in mm
  const o = 2.5; // outer inset

  const rosette = (cx: number, cy: number) => (
    <g key={`${cx}-${cy}`}>
      <rect x={cx - band / 2} y={cy - band / 2} width={band} height={band} fill="#fffaf0" stroke={MAROON} strokeWidth={0.35} />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx={cx} cy={cy - 2.2} rx={0.9} ry={2} fill={i % 2 ? GOLD : MAROON} transform={`rotate(${i * 45} ${cx} ${cy})`} />
      ))}
      <circle cx={cx} cy={cy} r={1.1} fill={GOLD} stroke={MAROON} strokeWidth={0.25} />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none" className="absolute inset-0" aria-hidden>
      <defs>
        {/* One 12mm repeat of the creeper: a flowing stem with alternating leaves and buds. */}
        <pattern id="liyawela-h" width="12" height={band} patternUnits="userSpaceOnUse" x={o}>
          <path d={`M0 ${band / 2} C3 0.8 6 0.8 6 ${band / 2} S9 ${band - 0.8} 12 ${band / 2}`} fill="none" stroke={GOLD} strokeWidth={0.45} />
          <ellipse cx={3} cy={2.4} rx={1.5} ry={0.65} fill={MAROON} transform="rotate(-35 3 2.4)" />
          <ellipse cx={9} cy={band - 2.4} rx={1.5} ry={0.65} fill={MAROON} transform="rotate(-35 9 6.6)" />
          <circle cx={6} cy={band / 2} r={0.55} fill={GOLD} />
          <circle cx={0.6} cy={band / 2 - 2.3} r={0.35} fill={GOLD} />
          <circle cx={11.4} cy={band / 2 + 2.3} r={0.35} fill={GOLD} />
        </pattern>
        <pattern id="liyawela-v" href="#liyawela-h" patternTransform="rotate(90)" x={0} y={o} />
      </defs>

      {/* Outer double rule */}
      <rect x={0.6} y={0.6} width={W - 1.2} height={H - 1.2} fill="none" stroke={MAROON} strokeWidth={0.9} />
      <rect x={1.8} y={1.8} width={W - 3.6} height={H - 3.6} fill="none" stroke={GOLD} strokeWidth={0.3} />

      {/* Creeper bands */}
      <rect x={o + band} y={o} width={W - 2 * (o + band)} height={band} fill="url(#liyawela-h)" />
      <rect x={o + band} y={H - o - band} width={W - 2 * (o + band)} height={band} fill="url(#liyawela-h)" />
      <rect x={o} y={o + band} width={band} height={H - 2 * (o + band)} fill="url(#liyawela-v)" />
      <rect x={W - o - band} y={o + band} width={band} height={H - 2 * (o + band)} fill="url(#liyawela-v)" />

      {/* Inner double rule */}
      <rect x={o + band + 0.6} y={o + band + 0.6} width={W - 2 * (o + band + 0.6)} height={H - 2 * (o + band + 0.6)} fill="none" stroke={MAROON} strokeWidth={0.6} />
      <rect x={o + band + 1.6} y={o + band + 1.6} width={W - 2 * (o + band + 1.6)} height={H - 2 * (o + band + 1.6)} fill="none" stroke={GOLD} strokeWidth={0.25} />

      {/* Corner rosettes */}
      {[
        [o + band / 2, o + band / 2],
        [W - o - band / 2, o + band / 2],
        [o + band / 2, H - o - band / 2],
        [W - o - band / 2, H - o - band / 2],
      ].map(([x, y]) => rosette(x, y))}
    </svg>
  );
}

export function PrintableHandahana({ chart, townId }: { chart: ChartResponse; townId: string }) {
  const { lang, t } = useLanguage();
  const town = getTown(townId);
  const bal = chart.dasha.birth_balance;
  const local = chart.birth.local_datetime;

  const details: [string, string][] = [
    [t.lagna, `${RASHI_NAMES[lang][chart.lagna.rashi_index]} ${formatDegree(chart.lagna.degree_in_sign)}`],
    [t.navamshaLagna, RASHI_NAMES[lang][chart.lagna.navamsha_rashi_index]],
    [t.nakshatra, `${NAKSHATRA_NAMES[lang][chart.nakshatra.index]} — ${t.pada} ${chart.nakshatra.pada}`],
    [t.moonSign, RASHI_NAMES[lang][chart.moon_sign.rashi_index]],
    [t.rashiLord, PLANET_NAMES[chart.rashi_lord][lang]],
    [t.lagnaLord, PLANET_NAMES[chart.lagna.lord][lang]],
    [t.ayanamsha, formatDegree(chart.ayanamsha)],
    [t.utcOffset, `UTC${chart.birth.utc_offset}`],
    [t.dashaBalance, t.balanceFormat(PLANET_NAMES[bal.lord][lang], bal.years, bal.months, bal.days)],
  ];

  return (
    <section className="kendaraya-print" aria-hidden>
      <div className="relative mx-auto" style={{ width: "186mm", height: "265mm" }}>
        <LiyawelaBorder />

        <div className="absolute flex flex-col" style={{ inset: "16mm 17mm 15mm" }}>
          <header className="text-center">
            <p style={{ fontSize: "10pt", color: GOLD, letterSpacing: "normal" }}>ශුභමස්තු</p>
            <h1 style={{ fontSize: "24pt", fontWeight: 700, color: MAROON, lineHeight: 1.25 }}>{t.kendarayaHeading}</h1>
            <p style={{ fontSize: "14pt", fontWeight: 600, marginTop: "1mm" }}>{chart.birth.name}</p>
            <p style={{ fontSize: "10pt", marginTop: "1mm" }}>
              {formatDate(local, lang)} · {formatSriLankanTime(local, lang)} · {town ? town[lang] : chart.birth.place} ·{" "}
              {t.genders[chart.birth.gender]}
            </p>
          </header>

          <div className="mt-[5mm] grid grid-cols-2 gap-[8mm]">
            <SriLankanChart
              houses={chart.rashi_chart.houses}
              lang={lang}
              title={t.lagnaChart}
              centerLabel={t.chartCenterRashi}
              centerSubLabel={RASHI_NAMES[lang][chart.lagna.rashi_index]}
            />
            <SriLankanChart
              houses={chart.navamsha_chart.houses}
              lang={lang}
              title={t.navamshaChart}
              centerLabel={t.chartCenterNavamsha}
              centerSubLabel={RASHI_NAMES[lang][chart.lagna.navamsha_rashi_index]}
            />
          </div>

          <div className="mt-[5mm] grid grid-cols-[1.15fr_1fr] gap-[7mm]" style={{ fontSize: "9.5pt" }}>
            <div>
              <h2 style={{ fontSize: "11.5pt", fontWeight: 700, color: MAROON, borderBottom: `0.4mm solid ${GOLD}`, paddingBottom: "1mm" }}>
                {t.basicDetails}
              </h2>
              <table className="mt-[1.5mm] w-full">
                <tbody>
                  {details.map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: "0.2mm solid #e7d9b8" }}>
                      <td style={{ padding: "0.9mm 0", color: "#5b4a2a" }}>{label}</td>
                      <td style={{ padding: "0.9mm 0", textAlign: "right", fontWeight: 600 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 style={{ fontSize: "11.5pt", fontWeight: 700, color: MAROON, borderBottom: `0.4mm solid ${GOLD}`, paddingBottom: "1mm" }}>
                {t.dashaTitle}
              </h2>
              <table className="mt-[1.5mm] w-full">
                <tbody>
                  {chart.dasha.maha_dashas.map((m) => (
                    <tr
                      key={`${m.lord}-${m.start}`}
                      style={{ borderBottom: "0.2mm solid #e7d9b8", background: m.is_current ? "#fbf1d6" : undefined }}
                    >
                      <td style={{ padding: "0.9mm 1mm", fontWeight: m.is_current ? 700 : 500 }}>{PLANET_NAMES[m.lord][lang]}</td>
                      <td style={{ padding: "0.9mm 0", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {m.start.slice(0, 4)} – {m.end.slice(0, 4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="mt-auto text-center" style={{ fontSize: "8pt", color: "#7a6a4a" }}>
            {chart.ayanamsha_name} · {t.footer}
          </footer>
        </div>
      </div>
    </section>
  );
}
