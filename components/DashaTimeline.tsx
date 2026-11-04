"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { PLANET_NAMES, formatDate } from "@/lib/i18n";
import type { ChartResponse } from "@/lib/types";

export function DashaTimeline({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();
  const { dasha } = chart;
  const [expanded, setExpanded] = useState<number | null>(() => {
    const idx = dasha.maha_dashas.findIndex((m) => m.is_current);
    return idx >= 0 ? idx : null;
  });
  const bal = dasha.birth_balance;

  return (
    <section className="glass rounded-3xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-sinhala text-lg leading-relaxed font-semibold text-gold-200">{t.dashaTitle}</h2>
        <p className="text-[13px] leading-relaxed text-indigo-200/70 sm:text-sm">
          {t.dashaBalance}: <span className="font-medium text-gold-100">{t.balanceFormat(PLANET_NAMES[bal.lord][lang], bal.years, bal.months, bal.days)}</span>
        </p>
      </div>

      <ol className="space-y-2">
        {dasha.maha_dashas.map((maha, i) => {
          const open = expanded === i;
          return (
            <li
              key={`${maha.lord}-${maha.start}`}
              className={`${open ? "" : "print-avoid-break"} rounded-2xl border transition print:bg-white ${
                maha.is_current ? "border-gold-400/60 bg-maroon-800/35 print:border-[#8a2439]" : "border-white/8 bg-cosmic-900/40 print:border-[#d8c9a3]"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(open ? null : i)}
                aria-expanded={open}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-3.5 py-3 text-left sm:flex sm:justify-between sm:px-4"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`font-semibold ${maha.is_current ? "text-gold-200" : "text-indigo-50"}`}>{PLANET_NAMES[maha.lord][lang]}</span>
                  {maha.is_current && (
                    <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-semibold text-cosmic-950">{t.dashaCurrent}</span>
                  )}
                </span>
                <span className="col-span-2 row-start-2 text-[13px] leading-relaxed text-indigo-200/75 tabular-nums sm:order-none sm:text-sm">
                  {formatDate(maha.start, lang)} → {formatDate(maha.end, lang)}
                </span>
                <span className="col-start-2 row-start-1 flex items-center">
                  <svg className={`no-print h-4 w-4 text-indigo-200/70 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
                  </svg>
                </span>
              </button>

              {open && (
                <div className="border-t border-white/8 px-2.5 py-3 sm:px-4">
                  <p className="mb-2 text-xs font-medium tracking-wide text-gold-100/60">{t.antarDashas}</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                    {maha.antar_dashas.map((a) => (
                      <li
                        key={`${a.lord}-${a.start}`}
                        className={`flex flex-col gap-x-3 rounded-lg px-2 py-1.5 text-[13px] leading-relaxed sm:flex-row sm:flex-wrap sm:justify-between sm:px-3 sm:text-sm ${
                          a.is_current ? "bg-gold-400/15 text-gold-100 print:bg-[#fbf1d6]" : "text-indigo-100/80"
                        }`}
                      >
                        <span>
                          {PLANET_NAMES[maha.lord][lang]} / {PLANET_NAMES[a.lord][lang]}
                        </span>
                        {/* Each date stays whole; on narrow phones the line may only break at the arrow. */}
                        <span className="tabular-nums text-indigo-200/65">
                          <span className="whitespace-nowrap">{formatDate(a.start, lang)}</span> →{" "}
                          <span className="whitespace-nowrap">{formatDate(a.end, lang)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
