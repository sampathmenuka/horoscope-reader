"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { BirthForm, EMPTY_BIRTH_FORM, Spinner, type BirthFormValues } from "@/components/BirthForm";
import { SectionNav } from "@/components/SectionNav";
import { useLanguage } from "@/context/LanguageContext";
import { saveProfile } from "@/lib/profiles";
import { useCurrentSection, useGoToSection } from "@/lib/sections";
import type { ErrorCode, Lang } from "@/lib/i18n";
import type { BirthRequest, ChartResponse, Prediction } from "@/lib/types";

// Neither is needed for the first paint, so their code (charts, dasha, emblems,
// daily readings) loads only when a chart exists or the daily tab is opened.
const LoadingBlock = () => (
  <div className="flex justify-center py-16 text-gold-300" aria-hidden>
    <Spinner />
  </div>
);
const ResultsView = dynamic(() => import("@/components/ResultsView").then((m) => m.ResultsView), { loading: LoadingBlock });
const DailyHoroscope = dynamic(() => import("@/components/DailyHoroscope").then((m) => m.DailyHoroscope), {
  loading: LoadingBlock,
});

function isErrorCode(value: unknown): value is ErrorCode {
  return ["backend_unreachable", "invalid_input", "calc_failed", "predict_failed", "network"].includes(value as string);
}

export function HandahanaApp() {
  const { lang, t } = useLanguage();
  const [form, setForm] = useState<BirthFormValues>(EMPTY_BIRTH_FORM);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [chartTownId, setChartTownId] = useState("");
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<ErrorCode | null>(null);
  // The section comes from the URL ("/#daily" or "/"), shared with the navbar,
  // the bottom bar and WhatsApp share links.
  const section = useCurrentSection();
  const mode = section === "daily" ? "daily" : "chart";
  const goTo = useGoToSection();
  // Once opened, the daily view stays mounted so its readings survive switching.
  const [dailyOpened, setDailyOpened] = useState(false);
  if (mode === "daily" && !dailyOpened) setDailyOpened(true);

  // Readings are cached per language so switching back and forth costs nothing.
  // A reading is "loading" whenever a chart exists and the current language has
  // neither a reading nor an error yet; the effect below fetches it.
  const [predictions, setPredictions] = useState<Partial<Record<Lang, Prediction>>>({});
  const [predictionError, setPredictionError] = useState<Partial<Record<Lang, ErrorCode>>>({});
  const chartVersion = useRef(0);
  const inFlight = useRef(new Set<string>());
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chart || predictions[lang] || predictionError[lang]) return;
    const version = chartVersion.current;
    const key = `${version}:${lang}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);

    const forLang = lang;
    fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chart, lang: forLang }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (version !== chartVersion.current) return; // a newer chart replaced this one
        if (res.ok) {
          setPredictions((s) => ({ ...s, [forLang]: data as Prediction }));
        } else {
          setPredictionError((s) => ({ ...s, [forLang]: isErrorCode(data?.error) ? data.error : "predict_failed" }));
        }
      })
      .catch(() => {
        if (version === chartVersion.current) setPredictionError((s) => ({ ...s, [forLang]: "network" }));
      })
      .finally(() => inFlight.current.delete(key));
  }, [chart, lang, predictions, predictionError]);

  async function handleSubmit(request: BirthRequest, { save }: { save: boolean }) {
    setChartLoading(true);
    setChartError(null);
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setChartError(isErrorCode(data?.error) ? data.error : "calc_failed");
        return;
      }
      chartVersion.current += 1;
      const newChart = data as ChartResponse;
      if (save) saveProfile(form, newChart.lagna.rashi_index);
      setChart(newChart);
      setChartTownId(form.townId);
      setPredictions({});
      setPredictionError({});
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setChartError("network");
    } finally {
      setChartLoading(false);
    }
  }

  const errCode = predictionError[lang];
  const predictionLoading = !!chart && !predictions[lang] && !errCode;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 sm:px-4 sm:pb-20">
      <section className="no-print pt-7 pb-6 text-center sm:pt-16 sm:pb-12">
        <h1 className="font-sinhala mx-auto max-w-4xl text-balance bg-gradient-to-b from-gold-100 to-gold-400 bg-clip-text text-[1.7rem] leading-snug font-bold text-transparent sm:text-5xl sm:leading-tight">
          {t.heroTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl px-1 text-[15px] leading-relaxed text-indigo-100/70 sm:mt-4 sm:text-base">{t.heroSubtitle}</p>
      </section>

      <SectionNav className="mb-6 sm:mb-10" />

      {/* Both modes stay mounted so the form, chart and daily readings survive switching. */}
      <div
        id="panel-mode-daily"
        hidden={mode !== "daily"}
        className="no-print"
      >
        {(mode === "daily" || dailyOpened) && (
          <DailyHoroscope
            active={mode === "daily"}
            userLagnaIndex={chart?.lagna.rashi_index}
            onCheckFullChart={() => goTo("chart")}
          />
        )}
      </div>

      <div id="panel-mode-chart" hidden={mode !== "chart"}>
        <div className="mx-auto max-w-3xl">
          <BirthForm values={form} onChange={setForm} onSubmit={handleSubmit} loading={chartLoading} />
          {chartError && (
            <p role="alert" className="no-print mt-4 rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {t.errors[chartError]}
            </p>
          )}
        </div>

        {chart && (
          <ResultsView
            ref={resultsRef}
            chart={chart}
            townId={chartTownId}
            prediction={predictions[lang] ?? null}
            predictionLoading={predictionLoading}
            predictionError={errCode ? t.errors[errCode] : null}
            onRegenerate={() => {
              // Clearing both makes the effect fetch a fresh reading.
              setPredictions((s) => ({ ...s, [lang]: undefined }));
              setPredictionError((s) => ({ ...s, [lang]: undefined }));
            }}
          />
        )}
      </div>

      <footer className="no-print mt-12 px-4 text-center text-xs leading-relaxed text-indigo-200/65 sm:mt-16">{t.footer}</footer>
    </main>
  );
}
