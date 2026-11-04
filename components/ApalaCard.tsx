"use client";

import { useEffect, useRef, useState } from "react";
import { getApalaRemedies, type ApalaRemedies } from "@/app/actions/apala";
import { Spinner } from "@/components/BirthForm";
import { useLanguage } from "@/context/LanguageContext";
import { PLANET_NAMES, RASHI_NAMES, formatDate, type Lang } from "@/lib/i18n";
import type { ChartResponse } from "@/lib/types";

/** Current Saturn (Erashtaka / Ashtama) and Rahu transits against the birth chart, with remedies. */
export function ApalaCard({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();
  const { apala } = chart;
  const [remedies, setRemedies] = useState<Partial<Record<Lang, ApalaRemedies>>>({});
  const requested = useRef(new Set<Lang>());

  // Remedies are only needed (and only requested) when an apala is active.
  useEffect(() => {
    if (!apala.active || remedies[lang] || requested.current.has(lang)) return;
    const forLang = lang;
    requested.current.add(forLang);
    getApalaRemedies({
      keys: apala.items.map((i) => i.key) as Parameters<typeof getApalaRemedies>[0]["keys"],
      saturnRashi: apala.saturn.rashi_index,
      rahuRashi: apala.rahu.rashi_index,
      lang: forLang,
    })
      .then((value) => setRemedies((s) => ({ ...s, [forLang]: value })))
      .catch(() => requested.current.delete(forLang));
  }, [apala, lang, remedies]);

  const current = remedies[lang];
  const transits = [apala.saturn, apala.rahu].map((p) =>
    t.transitLine(PLANET_NAMES[p.key][lang].replace(/ \(.*\)$/, ""), RASHI_NAMES[lang][p.rashi_index], p.house_from_moon, p.house_from_lagna),
  );

  return (
    <section
      className={`glass print-avoid-break rounded-3xl p-4 sm:p-6 ${apala.active ? "border-t-2 border-t-amber-500/50" : ""}`}
      aria-labelledby="apala-title"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="apala-title" className="font-sinhala text-lg leading-relaxed font-semibold text-gold-200">
          {apala.active && <span aria-hidden>⚠️ </span>}
          {t.apalaTitle}
        </h2>
        <p className="text-xs leading-relaxed text-indigo-200/65">{t.apalaAsOf(formatDate(apala.as_of, lang))}</p>
      </div>

      <ul className="mb-4 space-y-1 text-[13px] leading-relaxed text-indigo-100/75 sm:text-sm">
        {transits.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>

      {!apala.active && (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-[15px] leading-relaxed text-emerald-100">
          ✓ {t.apalaNone}
        </p>
      )}

      {apala.active && (
        <>
          <ul className="space-y-2.5">
            {apala.items.map((item) => (
              <li
                key={item.key}
                className={`rounded-2xl border px-4 py-3 ${
                  item.severity === "high" ? "border-red-400/40 bg-red-500/10" : "border-amber-400/40 bg-amber-500/10"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base leading-relaxed font-semibold text-gold-100">{item.title[lang]}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      item.severity === "high" ? "bg-red-400/90 text-cosmic-950" : "bg-amber-400 text-cosmic-950"
                    }`}
                  >
                    {t.severity[item.severity]}
                  </span>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-indigo-50/90">{item.detail[lang]}</p>
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-2xl border border-gold-400/25 bg-maroon-900/30 p-4">
            <h3 className="font-sinhala mb-3 text-base leading-relaxed font-semibold text-gold-200">{t.remedies}</h3>
            {!current && (
              <p className="flex items-center gap-2 text-sm text-indigo-100/75" aria-live="polite">
                <Spinner /> {t.preparingRemedies}
              </p>
            )}
            {current && (
              <>
                <ul className="space-y-2.5">
                  {current.remedies.map((r) => (
                    <li key={r.title + r.detail} className="text-[15px] leading-relaxed text-indigo-50/90">
                      <span className="font-semibold text-gold-100">🪔 {r.title}</span>
                      <span className="block">{r.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-indigo-200/65">{current.source === "llm" ? t.remediesByGemini : t.remediesTraditional}</p>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
