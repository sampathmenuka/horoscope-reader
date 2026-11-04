"use client";

import { PLANET_ABBR, PLANET_NAMES, RASHI_NAMES, type ChartBodyKey, type Lang } from "@/lib/i18n";
import type { HouseBox } from "@/lib/types";

/*
 * Traditional Sri Lankan Kendaraya (300 x 300 units).
 *
 *   ┌────┬────────┬────┐   The four kendra houses (1, 4, 7, 10) are the
 *   │ 2 ╲│   1    │╱12 │   middle boxes of each side; each corner square
 *   │3  ╲│        │╱ 11│   is split by its diagonal into two triangles.
 *   ├────┼────────┼────┤   House 1 sits top-centre and the houses run
 *   │ 4  │ centre │ 10 │   counter-clockwise 1 → 12.
 *   ├────┼────────┼────┤
 *   │5  ╱│        │╲  9│
 *   │ 6╱ │   7    │ ╲8 │
 *   └────┴────────┴────┘
 */

const S = 300;
const A = 100; // corner square size
const B = 200; // start of the right / bottom corner squares

type Point = [number, number];

interface HouseGeometry {
  polygon: Point[];
  /** Anchor where occupants are written. */
  center: Point;
  /** Where the rashi number is written. */
  label: Point;
  /** Max abbreviations per text row (triangles are narrower). */
  perRow: number;
}

const GEOMETRY: Record<number, HouseGeometry> = {
  1: { polygon: [[A, 0], [B, 0], [B, A], [A, A]], center: [150, 52], label: [150, 14], perRow: 3 },
  2: { polygon: [[0, 0], [A, 0], [A, A]], center: [68, 30], label: [90, 13], perRow: 2 },
  3: { polygon: [[0, 0], [0, A], [A, A]], center: [30, 68], label: [10, 92], perRow: 2 },
  4: { polygon: [[0, A], [A, A], [A, B], [0, B]], center: [50, 152], label: [50, 114], perRow: 3 },
  5: { polygon: [[0, B], [A, B], [0, S]], center: [30, 232], label: [10, 212], perRow: 2 },
  6: { polygon: [[A, B], [A, S], [0, S]], center: [68, 270], label: [90, 292], perRow: 2 },
  7: { polygon: [[A, B], [B, B], [B, S], [A, S]], center: [150, 252], label: [150, 292], perRow: 3 },
  8: { polygon: [[B, B], [B, S], [S, S]], center: [232, 270], label: [210, 292], perRow: 2 },
  9: { polygon: [[B, B], [S, B], [S, S]], center: [270, 232], label: [290, 212], perRow: 2 },
  10: { polygon: [[S, A], [S, B], [B, B], [B, A]], center: [250, 152], label: [250, 114], perRow: 3 },
  11: { polygon: [[S, 0], [S, A], [B, A]], center: [270, 68], label: [290, 92], perRow: 2 },
  12: { polygon: [[B, 0], [S, 0], [B, A]], center: [232, 30], label: [210, 13], perRow: 2 },
};

const LINE_HEIGHT = 15;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export interface SriLankanChartProps {
  houses: HouseBox[];
  lang: Lang;
  title: string;
  /** Text inside the empty centre box. */
  centerLabel: string;
  centerSubLabel?: string;
  /** Mark Lagna ("ල" / "Asc") in house 1. */
  showLagna?: boolean;
  /** Show the rashi number (1 = Mesha … 12 = Meena) in each house. */
  showRashiNumbers?: boolean;
  className?: string;
}

export function SriLankanChart({
  houses,
  lang,
  title,
  centerLabel,
  centerSubLabel,
  showLagna = true,
  showRashiNumbers = true,
  className,
}: SriLankanChartProps) {
  const fontSize = lang === "si" ? 14 : 12;
  const byHouse = new Map(houses.map((h) => [h.house, h]));

  const describe = houses
    .map((h) => {
      const bodies: ChartBodyKey[] = [...(h.house === 1 && showLagna ? (["lagna"] as const) : []), ...h.occupants];
      return `${h.house}: ${RASHI_NAMES[lang][h.rashi_index]}${bodies.length ? ` — ${bodies.map((b) => PLANET_NAMES[b][lang]).join(", ")}` : ""}`;
    })
    .join("; ");

  return (
    <figure className={`print-avoid-break ${className ?? ""}`}>
      <figcaption className="font-sinhala mb-3 text-center text-base leading-relaxed font-semibold text-gold-200 print:text-[#5a1424]">{title}</figcaption>
      <svg
        viewBox={`-2 -2 ${S + 4} ${S + 4}`}
        role="img"
        aria-label={`${title}. ${describe}`}
        className="chart-svg mx-auto block aspect-square w-full max-w-[420px] [--chart-fill:rgb(20_18_51/0.55)] [--chart-lagna:#ebc970] [--chart-line:#d9ac45] [--chart-muted:rgb(199_210_254/0.55)] [--chart-text:#eef2ff]"
        style={{ fontFamily: "inherit" }}
      >
        <rect x={0} y={0} width={S} height={S} fill="var(--chart-fill)" stroke="var(--chart-line)" strokeWidth={2.5} rx={4} />

        {/* Internal grid: the two inner verticals/horizontals and the four corner diagonals. */}
        <g stroke="var(--chart-line)" strokeWidth={1.4} strokeOpacity={0.9}>
          <line x1={A} y1={0} x2={A} y2={S} />
          <line x1={B} y1={0} x2={B} y2={S} />
          <line x1={0} y1={A} x2={S} y2={A} />
          <line x1={0} y1={B} x2={S} y2={B} />
          <line x1={0} y1={0} x2={A} y2={A} />
          <line x1={S} y1={0} x2={B} y2={A} />
          <line x1={0} y1={S} x2={A} y2={B} />
          <line x1={S} y1={S} x2={B} y2={B} />
        </g>

        {/* Centre box */}
        <rect x={A + 6} y={A + 6} width={A - 12} height={A - 12} fill="none" stroke="var(--chart-line)" strokeOpacity={0.35} strokeDasharray="3 3" rx={3} />
        <text x={150} y={centerSubLabel ? 146 : 154} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--chart-lagna)">
          {centerLabel}
        </text>
        {centerSubLabel && (
          <text x={150} y={166} textAnchor="middle" fontSize={10} fill="var(--chart-muted)">
            {centerSubLabel.length > 18 ? `${centerSubLabel.slice(0, 17)}…` : centerSubLabel}
          </text>
        )}

        {Array.from({ length: 12 }, (_, i) => i + 1).map((houseNo) => {
          const geo = GEOMETRY[houseNo];
          const box = byHouse.get(houseNo);
          const bodies: ChartBodyKey[] = [
            ...(houseNo === 1 && showLagna ? (["lagna"] as const) : []),
            ...(box?.occupants ?? []),
          ];
          const rows = chunk(bodies, geo.perRow);
          const startY = geo.center[1] - ((rows.length - 1) * LINE_HEIGHT) / 2;

          return (
            <g key={houseNo}>
              <polygon points={geo.polygon.map((p) => p.join(",")).join(" ")} fill="transparent">
                <title>
                  {`${houseNo} — ${box ? RASHI_NAMES[lang][box.rashi_index] : ""}${
                    bodies.length ? `: ${bodies.map((b) => PLANET_NAMES[b][lang]).join(", ")}` : ""
                  }`}
                </title>
              </polygon>

              {showRashiNumbers && box && (
                <text x={geo.label[0]} y={geo.label[1]} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="var(--chart-muted)">
                  {box.rashi_index + 1}
                </text>
              )}

              {rows.map((row, r) => (
                <text
                  key={r}
                  x={geo.center[0]}
                  y={startY + r * LINE_HEIGHT}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={rows.length > 2 ? fontSize - 2 : fontSize}
                  fontWeight={600}
                >
                  {row.map((body, j) => (
                    <tspan key={body} fill={body === "lagna" ? "var(--chart-lagna)" : "var(--chart-text)"} dx={j === 0 ? 0 : 5}>
                      {PLANET_ABBR[body][lang]}
                    </tspan>
                  ))}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
