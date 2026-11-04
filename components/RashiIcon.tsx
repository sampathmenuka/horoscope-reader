import type { ReactNode } from "react";

/**
 * Line-art emblems for the 12 Rashis, drawn in the familiar Sri Lankan forms
 * (එළුවා, ගවයා, යුවළ, කකුළුවා, සිංහයා, කන්‍යාව, තරාදිය, ගෝනුස්සා, දුන්න, මකරා,
 * පුන් කලස, මසුන් දෙදෙනා) rather than Western glyphs. 48×48 grid,
 * `currentColor` strokes so they take the surrounding gold.
 */

const R = (cx: number, cy: number, r = 1) => <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;

/** Scalloped lion's mane around (24, 25). */
function manePath(): string {
  const cx = 24;
  const cy = 25;
  const n = 12;
  let d = "";
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2;
    const a1 = ((k + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const p0 = [cx + 13 * Math.cos(a0), cy + 13 * Math.sin(a0)];
    const pm = [cx + 18 * Math.cos(am), cy + 18 * Math.sin(am)];
    const p1 = [cx + 13 * Math.cos(a1), cy + 13 * Math.sin(a1)];
    d += `${k === 0 ? `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}` : ""} Q${pm[0].toFixed(2)} ${pm[1].toFixed(2)} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  }
  return `${d} Z`;
}
const MANE = manePath();

const EMBLEMS: (() => ReactNode)[] = [
  // 0 Mesha — ram's head with large spiral horns
  () => (
    <>
      <path d="M19 17 Q24 14 29 17 L28 32 Q24 40 20 32 Z" />
      <path d="M19 18 C12 10 3 15 5 24 C6.5 31 15 31 15.5 25 C16 21 11 20 10.5 23.5" />
      <path d="M29 18 C36 10 45 15 43 24 C41.5 31 33 31 32.5 25 C32 21 37 20 37.5 23.5" />
      <path d="M21 18.6 q1.5 1.5 3 0 q1.5 1.5 3 0" strokeWidth={1.4} />
      {R(21.7, 23.8)}
      {R(26.3, 23.8)}
      <path d="M22.4 33.6h0.01M25.6 33.6h0.01" strokeWidth={2.4} />
    </>
  ),
  // 1 Vrishabha — bull's head
  () => (
    <>
      <path d="M9 12 C10.5 21 16.5 22.5 19.5 19.5" />
      <path d="M39 12 C37.5 21 31.5 22.5 28.5 19.5" />
      <path d="M17.5 23 L12 24.5 L17.5 27" />
      <path d="M30.5 23 L36 24.5 L30.5 27" />
      <path d="M18 19 Q24 15.5 30 19 L30 30 Q30 38 24 38.5 Q18 38 18 30 Z" />
      <ellipse cx={24} cy={33.5} rx={4.6} ry={3} />
      {R(22.2, 33.5, 0.8)}
      {R(25.8, 33.5, 0.8)}
      {R(21, 25)}
      {R(27, 25)}
    </>
  ),
  // 2 Mithuna — twins holding hands
  () => (
    <>
      <circle cx={16} cy={12} r={3.5} />
      <circle cx={32} cy={12} r={3.5} />
      <path d="M16 16 V29 M32 16 V29" />
      <path d="M10 23 L16 19 L24 23.5 L32 19 L38 23" />
      <path d="M16 29 L12.5 39 M16 29 L19.5 39 M32 29 L28.5 39 M32 29 L35.5 39" />
    </>
  ),
  // 3 Kataka — crab
  () => (
    <>
      <ellipse cx={24} cy={28} rx={9} ry={6} />
      <path d="M21 22 V18.5 M27 22 V18.5" />
      {R(21, 17.8, 1.2)}
      {R(27, 17.8, 1.2)}
      <path d="M15.5 25.5 Q12 23.5 11 19" />
      <path d="M11 19 C5.5 18 5.5 10.5 10 9.5 M11 19 C13.3 15.5 13 12 10 9.5" />
      <path d="M32.5 25.5 Q36 23.5 37 19" />
      <path d="M37 19 C42.5 18 42.5 10.5 38 9.5 M37 19 C34.7 15.5 35 12 38 9.5" />
      <path d="M15.5 30 L9.5 32 M16 32.5 L10.5 36.5 M18.5 33.5 L14.5 38.5" />
      <path d="M32.5 30 L38.5 32 M32 32.5 L37.5 36.5 M29.5 33.5 L33.5 38.5" />
    </>
  ),
  // 4 Simha — lion's face with mane
  () => (
    <>
      <path d={MANE} />
      <circle cx={24} cy={26} r={8.5} />
      {R(21, 24)}
      {R(27, 24)}
      <path d="M22.3 28 L24 29.6 L25.7 28" />
      <path d="M24 29.6 V31 M21.3 31.6 Q24 33.8 26.7 31.6" />
    </>
  ),
  // 5 Kanya — maiden holding a sheaf of paddy
  () => (
    <>
      <circle cx={25} cy={11} r={4} />
      {R(25, 5.6, 1.8)}
      <path d="M25 15 V18" />
      <path d="M19 40 L22 21.5 Q25 18.5 28 21.5 L31 40 Z" />
      <path d="M23 24 L16 28" />
      <path d="M16 28 L12.5 19.5 M16 28 L15 18.5 M16 28 L18 19.5" />
      {R(12.6, 19, 1.1)}
      {R(15, 17.8, 1.1)}
      {R(18.1, 19, 1.1)}
      <path d="M27 24 L30 31" />
    </>
  ),
  // 6 Tula — balance scales
  () => (
    <>
      {R(24, 8, 1.6)}
      <path d="M24 9.5 V38 M17 38 H31 M11 14 H37" />
      <path d="M11 14 L7 26 M11 14 L15 26 M37 14 L33 26 M37 14 L41 26" />
      <path d="M6 26 Q11 31.5 16 26 Z" />
      <path d="M32 26 Q37 31.5 42 26 Z" />
    </>
  ),
  // 7 Vrischika — scorpion with raised sting
  () => (
    <>
      <ellipse cx={19} cy={32} rx={7} ry={4} />
      <path d="M26 32 C33 32 37 28 37 21.5 C37 14.5 31 12.5 28.5 16.5" />
      <path d="M28.5 16.5 L26.5 14 M28.5 16.5 L31.2 15.4" />
      <path d="M12.2 30.5 L8 27.5" />
      <path d="M8 27.5 C5 26.5 4.8 22.5 7.6 21.6 M8 27.5 C9.4 25.5 9.4 23.5 7.6 21.6" />
      <path d="M12.2 33.5 L8 36.5" />
      <path d="M8 36.5 C5 37.5 4.8 41.5 7.6 42.4 M8 36.5 C9.4 38.5 9.4 40.5 7.6 42.4" />
      <path d="M16 35.6 L14 40 M19 36 L18.5 40.5 M22 35.6 L23 40" />
    </>
  ),
  // 8 Dhanu — bow and arrow
  () => (
    <>
      <path d="M14 10 Q38 10 38 34" />
      <path d="M14 10 L38 34" strokeWidth={1.2} />
      <path d="M11 37 L38.5 9.5" />
      <path d="M38.5 9.5 L32 10.2 M38.5 9.5 L37.8 16" />
      <path d="M11 37 L11 32 M11 37 L16 37 M13.5 34.5 L13.5 30 M13.5 34.5 L18 34.5" strokeWidth={1.4} />
    </>
  ),
  // 9 Makara — the Sri Lankan makara: curled trunk, open jaws, crest, scales, fish tail
  () => (
    <>
      <path d="M14 21 C20 15 30 16 35.5 22" />
      <path d="M15 29 C21 33 29 32 35 27" />
      <path d="M35.5 22 L43 17 L41 24.5 L43 32 L35 27" />
      <path d="M14 21 L8 19 C4.5 18 3.5 13 6.5 11.5 C8.5 10.6 10 12.6 8.4 14" />
      <path d="M15 29 L8.5 27.5 L13 25" />
      {R(12.8, 22.4)}
      <path d="M18 17.8 l0.8 -3.4 l2.2 2.6 M24 16.4 l0.8 -3.4 l2.2 2.6 M30 17.8 l0.8 -3.4 l2.2 2.6" strokeWidth={1.5} />
      <path d="M19 23.5 q2 2.2 4 0 M25 23.5 q2 2.2 4 0 M22 27.5 q2 2.2 4 0" strokeWidth={1.4} />
      <path d="M20 31.2 L18.5 36 M28.5 31.5 L29.5 36" />
    </>
  ),
  // 10 Kumbha — pun kalasa (full pot) with coconut flower
  () => (
    <>
      <path d="M19 14.5 H29 M20 14.5 V18.5 M28 14.5 V18.5" />
      <path d="M17.5 18.5 H30.5 C37 24 37 34 30.5 39 H17.5 C11 34 11 24 17.5 18.5 Z" />
      <path d="M15.5 28 q2 -2 4.25 0 t4.25 0 t4.25 0 t4.25 0" strokeWidth={1.4} />
      <path d="M24 14.5 C22 9 18 7.5 15 8.5 M24 14.5 C26 9 30 7.5 33 8.5 M24 14.5 V6" />
    </>
  ),
  // 11 Meena — two fish facing opposite ways
  () => (
    <>
      <path d="M11 16 C17 10 27 10 33 16 C27 22 17 22 11 16 Z" />
      <path d="M11 16 L5.5 11.5 L5.5 20.5 Z" />
      {R(28.5, 15)}
      <path d="M37 32 C31 26 21 26 15 32 C21 38 31 38 37 32 Z" />
      <path d="M37 32 L42.5 27.5 L42.5 36.5 Z" />
      {R(19.5, 31)}
    </>
  ),
];

export function RashiIcon({ index, className }: { index: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {EMBLEMS[index]?.()}
    </svg>
  );
}
