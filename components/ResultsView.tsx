"use client";

import { useState, type Ref } from "react";
import { ApalaCard } from "@/components/ApalaCard";
import { BabyNames } from "@/components/BabyNames";
import { BirthDetailsCard, PlanetTable } from "@/components/ChartDetails";
import { DashaTimeline } from "@/components/DashaTimeline";
import { PredictionView } from "@/components/PredictionView";
import { PrintableHandahana } from "@/components/PrintableHandahana";
import { PrintWatermark } from "@/components/PrintWatermark";
import { SriLankanChart } from "@/components/SriLankanChart";
import { useLanguage } from "@/context/LanguageContext";
import { NAKSHATRA_NAMES, PLANET_NAMES, RASHI_NAMES, formatDate } from "@/lib/i18n";
import { printKendaraya } from "@/lib/print";
import { getTown } from "@/lib/sriLankaTowns";
import type { ChartResponse, Prediction } from "@/lib/types";

interface ResultsViewProps {
  chart: ChartResponse;
  townId: string;
  prediction: Prediction | null;
  predictionLoading: boolean;
  predictionError: string | null;
  onRegenerate: () => void;
  ref?: Ref<HTMLDivElement>;
}

/*
 * Source order = print order (charts, birth details, planets, dasha, apala, reading).
 * Phones reorder with `order-*` so the most useful things come first:
 *   key facts → chart → reading → apala → dasha → letters & names → planets → birth details.
 * Desktop (lg): charts across the top; birth details + planet cards on the left with the
 * dasha timeline beside them; apala and letters & names side by side; the reading last.
 * Print uses `print:block`, which ignores `order`, so the full-reading PDF follows source order.
 * The single-page Kendaraya (PrintableHandahana) prints instead when chosen via "Download PDF".
 */
export function ResultsView({ chart, townId, prediction, predictionLoading, predictionError, onRegenerate, ref }: ResultsViewProps) {
  const { lang, t } = useLanguage();
  const town = getTown(townId);

  return (
    <div ref={ref} className="results-root mt-8 scroll-mt-20 sm:mt-12">
      <PrintableHandahana chart={chart} townId={townId} />

      <div className="report-print">
        <PrintWatermark name={chart.birth.name} />

        <header className="print-only mb-4 border-b-2 border-maroon-800 pb-3">
          <h1 className="text-2xl font-bold">{t.printHeader}</h1>
          <p className="mt-1 text-sm">
            {chart.birth.name} · {chart.birth.local_datetime.slice(0, 10)} {chart.birth.local_datetime.slice(11, 16)} ·{" "}
            {town ? town[lang] : chart.birth.place}
          </p>
          <p className="text-xs">
            {t.printedOn}: {formatDate(new Date().toISOString(), lang)}
          </p>
        </header>

        <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-2 lg:items-start print:block print:space-y-6">
          <div className="order-1 lg:hidden print:hidden">
            <QuickFacts chart={chart} />
          </div>

          <div className="order-2 lg:col-span-2 lg:row-start-1">
            <ChartsSection chart={chart} />
          </div>

          <div className="order-8 lg:col-start-1 lg:row-start-2">
            <BirthDetailsCard chart={chart} townId={townId} />
          </div>

          <div className="order-7 lg:col-start-1 lg:row-start-3">
            <PlanetTable chart={chart} />
          </div>

          <div className="order-5 lg:col-start-2 lg:row-span-2 lg:row-start-2">
            <DashaTimeline chart={chart} />
          </div>

          <div className="order-4 lg:col-start-1 lg:row-start-4">
            <ApalaCard chart={chart} />
          </div>

          <div className="order-6 lg:col-start-2 lg:row-start-4 print:hidden">
            <BabyNames chart={chart} />
          </div>

          <div className="order-3 lg:col-span-2 lg:row-start-5">
            <PredictionView prediction={prediction} loading={predictionLoading} error={predictionError} onRegenerate={onRegenerate} />
          </div>
        </div>

        <p className="mt-6 px-2 text-center text-xs leading-relaxed text-indigo-200/65">{t.disclaimer}</p>
      </div>
    </div>
  );
}

/** Phone-only summary of the four facts people look for first. */
function QuickFacts({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();
  const maha = chart.dasha.current_maha;
  const antar = chart.dasha.current_antar;

  const facts: { label: string; value: string; sub?: string }[] = [
    { label: t.lagna, value: RASHI_NAMES[lang][chart.lagna.rashi_index] },
    {
      label: t.nakshatra,
      value: NAKSHATRA_NAMES[lang][chart.nakshatra.index],
      sub: `${t.pada} ${chart.nakshatra.pada}`,
    },
    { label: t.moonSign, value: RASHI_NAMES[lang][chart.moon_sign.rashi_index] },
    {
      label: t.currentMahaDasha,
      value: maha ? PLANET_NAMES[maha.lord][lang] : "—",
      sub: antar ? `${t.antarShort}: ${PLANET_NAMES[antar.lord][lang]}` : undefined,
    },
  ];

  return (
    <section aria-label={t.birthDetails}>
      <p className="font-sinhala mb-3 px-1 text-lg leading-relaxed font-semibold text-gold-200">
        {t.resultsTitle} — {chart.birth.name}
      </p>
      <dl className="grid grid-cols-2 gap-2.5">
        {facts.map((f) => (
          <div key={f.label} className="glass rounded-2xl px-3.5 py-3">
            <dt className="text-xs leading-relaxed text-indigo-200/65">{f.label}</dt>
            <dd className="mt-0.5 text-base leading-snug font-semibold text-gold-100">{f.value}</dd>
            {f.sub && <dd className="mt-0.5 text-xs leading-relaxed text-indigo-100/70">{f.sub}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Both charts side by side from md up and in print; one at a time with a switcher on phones. */
function ChartsSection({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();
  const [view, setView] = useState<"rashi" | "navamsha">("rashi");

  const tabs = [
    { key: "rashi" as const, label: t.chartCenterRashi },
    { key: "navamsha" as const, label: t.chartCenterNavamsha },
  ];

  return (
    <section className="glass rounded-3xl p-4 sm:p-8">
      <h2 className="font-sinhala no-print mb-6 hidden text-center text-xl font-semibold text-gold-200 lg:block">
        {t.resultsTitle} — {chart.birth.name}
      </h2>

      <div role="tablist" aria-label={t.resultsTitle} className="no-print mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-cosmic-900/60 p-1 md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={view === tab.key}
            onClick={() => setView(tab.key)}
            className={`rounded-xl px-2 py-2 text-[15px] leading-relaxed font-semibold transition ${
              view === tab.key ? "bg-gold-400 text-cosmic-950" : "text-indigo-100/75"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 print:grid-cols-2">
        <div className={view === "rashi" ? "block" : "hidden md:block print:block"}>
          <SriLankanChart
            houses={chart.rashi_chart.houses}
            lang={lang}
            title={t.lagnaChart}
            centerLabel={t.chartCenterRashi}
            centerSubLabel={RASHI_NAMES[lang][chart.lagna.rashi_index]}
          />
        </div>
        <div className={view === "navamsha" ? "block" : "hidden md:block print:block"}>
          <SriLankanChart
            houses={chart.navamsha_chart.houses}
            lang={lang}
            title={t.navamshaChart}
            centerLabel={t.chartCenterNavamsha}
            centerSubLabel={RASHI_NAMES[lang][chart.lagna.navamsha_rashi_index]}
          />
        </div>
      </div>

      <p className="mt-5 text-center text-sm leading-relaxed text-indigo-100/75 sm:mt-6">
        {t.nakshatra}: <span className="font-semibold text-gold-200">{NAKSHATRA_NAMES[lang][chart.nakshatra.index]}</span> · {t.pada}{" "}
        {chart.nakshatra.pada}
      </p>

      <div className="no-print mt-5 flex justify-center">
        <button
          type="button"
          onClick={printKendaraya}
          className="font-sinhala inline-flex items-center gap-2 rounded-2xl border border-gold-400/60 bg-gradient-to-b from-gold-300 to-gold-500 px-5 py-2.5 text-[15px] leading-relaxed font-semibold text-cosmic-950 shadow-lg shadow-gold-500/20 transition hover:from-gold-200 hover:to-gold-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M10 2a1 1 0 0 1 1 1v7.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 1.4-1.4L9 10.6V3a1 1 0 0 1 1-1ZM4 15a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
          {t.downloadPdf}
        </button>
      </div>
    </section>
  );
}
