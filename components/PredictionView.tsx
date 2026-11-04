"use client";

import { useState } from "react";
import { Spinner } from "@/components/BirthForm";
import { useLanguage } from "@/context/LanguageContext";
import { printFullReading } from "@/lib/print";
import { SECTION_KEYS, type SectionKey } from "@/lib/i18n";
import type { Prediction } from "@/lib/types";

interface PredictionViewProps {
  prediction: Prediction | null;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
}

export function PredictionView({ prediction, loading, error, onRegenerate }: PredictionViewProps) {
  const { t } = useLanguage();
  const [active, setActive] = useState<SectionKey>("summary");

  return (
    <section className="glass rounded-3xl p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="font-sinhala text-lg leading-relaxed font-semibold text-gold-200">{t.predictionTitle}</h2>
        <div className="no-print grid grid-cols-[auto_1fr] gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={loading}
            className="rounded-xl border border-indigo-300/30 px-4 py-2.5 text-sm leading-relaxed text-indigo-100 transition hover:border-gold-400/60 hover:text-gold-200 disabled:opacity-50 sm:py-2"
          >
            {t.regenerate}
          </button>
          <button
            type="button"
            onClick={printFullReading}
            disabled={!prediction || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-400/60 bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-2.5 text-sm leading-relaxed font-semibold text-cosmic-950 shadow transition hover:from-gold-200 hover:to-gold-400 disabled:opacity-50 sm:py-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M5 2h10v4H5V2Zm-2 5h14a2 2 0 0 1 2 2v5h-3v4H4v-4H1V9a2 2 0 0 1 2-2Zm3 7v2h8v-4H6v2Z" />
            </svg>
            <span className="sm:hidden">{t.printShort}</span>
            <span className="hidden sm:inline">{t.printFullReading}</span>
          </button>
        </div>
      </div>

      {/* Tabs (screen only) */}
      {/* Sticks under the header on phones so the sections stay one tap away while reading. */}
      <div
        role="tablist"
        aria-label={t.predictionTitle}
        className="no-print sticky top-14 z-20 -mx-4 mb-4 flex snap-x gap-1.5 overflow-x-auto border-b border-white/10 bg-cosmic-950/90 px-4 py-2 backdrop-blur-lg [scrollbar-width:none] sm:static sm:mx-0 sm:mb-5 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pb-1 sm:backdrop-blur-none [&::-webkit-scrollbar]:hidden"
      >
        {SECTION_KEYS.map((key) => (
          <button
            key={key}
            id={`tab-${key}`}
            type="button"
            role="tab"
            aria-selected={active === key}
            aria-controls={`panel-${key}`}
            onClick={() => setActive(key)}
            className={`shrink-0 snap-start rounded-full px-3.5 py-1.5 text-sm leading-relaxed whitespace-nowrap transition sm:rounded-xl sm:px-4 sm:py-2 ${
              active === key ? "bg-maroon-700/70 font-semibold text-gold-100 ring-1 ring-gold-400/50" : "text-indigo-100/75 hover:bg-white/5 hover:text-gold-200"
            }`}
          >
            {t.sections[key]}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-cosmic-900/50 px-4 py-6 text-indigo-100/80" aria-live="polite">
          <Spinner />
          {t.generating}
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && prediction && (
        <>
          {SECTION_KEYS.map((key) => {
            const section = prediction.sections[key];
            return (
              <div
                key={key}
                id={`panel-${key}`}
                role="tabpanel"
                aria-labelledby={`tab-${key}`}
                className={`print-section ${active === key ? "block" : "hidden"}`}
              >
                <h3 className="font-sinhala mb-3 text-base leading-relaxed font-semibold text-gold-300 sm:text-lg">{t.sections[key]}</h3>
                {section.highlights.length > 0 && (
                  <ul className="mb-4 flex flex-wrap gap-2">
                    {section.highlights.map((h) => (
                      <li key={h} className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-[13px] leading-relaxed text-gold-100 sm:text-xs">
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-4 text-base leading-[1.85] text-indigo-50/90 sm:text-[15px] sm:leading-8">
                  {section.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {key === "future" && prediction.remedies.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-gold-400/25 bg-maroon-900/30 p-3.5 sm:p-4">
                    <h4 className="font-sinhala mb-3 text-sm font-semibold text-gold-200">{t.remedies}</h4>
                    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-indigo-50/90 marker:text-gold-400 sm:text-sm">
                      {prediction.remedies.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="print-only h-6" />
              </div>
            );
          })}

          <p className="mt-6 text-xs text-indigo-200/65">
            {prediction.source === "llm" ? t.sourceLlm : t.sourceRules}
          </p>
        </>
      )}
    </section>
  );
}
