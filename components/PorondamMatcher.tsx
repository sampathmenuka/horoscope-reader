"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BirthFields, Spinner } from "@/components/BirthForm";
import { ProfileChips } from "@/components/ProfileChips";
import { SectionNav } from "@/components/SectionNav";
import { useLanguage } from "@/context/LanguageContext";
import { EMPTY_BIRTH_FORM, validateBirthForm, type BirthFieldErrors, type BirthFormValues } from "@/lib/birthForm";
import { NAKSHATRA_NAMES, RASHI_NAMES, type ErrorCode, type Lang } from "@/lib/i18n";
import { verdictOf, type PorondamResponse, type Verdict } from "@/lib/porondam";
import type { BirthRequest } from "@/lib/types";

type Side = "bride" | "groom";

const VERDICT_STYLE: Record<Verdict, { ring: string; text: string }> = {
  excellent: { ring: "#34d399", text: "text-emerald-300" },
  good: { ring: "#6ee7b7", text: "text-emerald-200" },
  average: { ring: "#fbbf24", text: "text-amber-300" },
  poor: { ring: "#f87171", text: "text-red-300" },
};

export function PorondamMatcher() {
  const { lang, t } = useLanguage();
  const [values, setValues] = useState<Record<Side, BirthFormValues>>({
    bride: { ...EMPTY_BIRTH_FORM, gender: "female" },
    groom: { ...EMPTY_BIRTH_FORM, gender: "male" },
  });
  const [errors, setErrors] = useState<Record<Side, BirthFieldErrors>>({ bride: {}, groom: {} });
  const [submitted, setSubmitted] = useState(false);

  // The last valid pair; a reading is fetched per language, like the main horoscope.
  const [pair, setPair] = useState<{ bride: BirthRequest; groom: BirthRequest } | null>(null);
  const [responses, setResponses] = useState<Partial<Record<Lang, PorondamResponse>>>({});
  const [failures, setFailures] = useState<Partial<Record<Lang, ErrorCode>>>({});
  const version = useRef(0);
  const inFlight = useRef(new Set<string>());
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pair || responses[lang] || failures[lang]) return;
    const v = version.current;
    const key = `${v}:${lang}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    const forLang = lang;
    fetch("/api/porondam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pair, lang: forLang }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (v !== version.current) return;
        if (res.ok) {
          setResponses((s) => ({ ...s, [forLang]: body as PorondamResponse }));
          requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        } else {
          setFailures((s) => ({ ...s, [forLang]: (body?.error as ErrorCode) ?? "calc_failed" }));
        }
      })
      .catch(() => v === version.current && setFailures((s) => ({ ...s, [forLang]: "network" })))
      .finally(() => inFlight.current.delete(key));
  }, [pair, lang, responses, failures]);

  function update(side: Side, next: BirthFormValues) {
    setValues((s) => ({ ...s, [side]: next }));
    if (submitted) setErrors((s) => ({ ...s, [side]: validateBirthForm(next).errors }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    const bride = validateBirthForm(values.bride);
    const groom = validateBirthForm(values.groom);
    setErrors({ bride: bride.errors, groom: groom.errors });
    if (!bride.request || !groom.request) return;
    version.current += 1;
    setResponses({});
    setFailures({});
    setPair({ bride: bride.request, groom: groom.request });
  }

  const response = responses[lang];
  const failure = failures[lang];
  const loading = !!pair && !response && !failure;

  return (
    <main className="mx-auto max-w-6xl px-3 pb-16 sm:px-4 sm:pb-20">
      <section className="pt-7 pb-6 text-center sm:pt-14 sm:pb-10">
        <h1 className="font-sinhala mx-auto max-w-3xl bg-gradient-to-b from-gold-100 to-gold-400 bg-clip-text text-[1.7rem] leading-snug font-bold text-transparent sm:text-4xl sm:leading-tight">
          💍 {t.porondamTitle}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl px-1 text-[15px] leading-relaxed text-indigo-100/70 sm:text-base">{t.porondamSubtitle}</p>
      </section>

      <SectionNav className="mb-6 sm:mb-10" />

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {(["bride", "groom"] as const).map((side) => (
            <fieldset key={side} className="glass min-w-0 rounded-3xl border-t-2 border-t-amber-500/40 p-4 sm:p-6">
              <legend className="sr-only">{t[side]}</legend>
              <h2 className="font-sinhala mb-4 flex items-center gap-2 text-lg leading-relaxed font-semibold text-gold-200">
                <span aria-hidden className="text-2xl">
                  {side === "bride" ? "👰" : "🤵"}
                </span>
                {t[side]}
              </h2>
              <ProfileChips className="mb-5" onSelect={(profile) => update(side, profile)} />
              <BirthFields idPrefix={side} values={values[side]} errors={errors[side]} onChange={(next) => update(side, next)} />
            </fieldset>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="font-sinhala inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-gold-400/60 bg-gradient-to-b from-maroon-500 to-maroon-700 px-8 py-3.5 text-base font-semibold text-gold-100 shadow-lg shadow-maroon-900/50 transition hover:from-maroon-500 hover:to-maroon-600 disabled:cursor-wait disabled:opacity-70 sm:w-auto"
          >
            {loading && <Spinner />}
            {loading ? t.checkingPorondam : t.checkPorondam}
          </button>
        </div>
      </form>

      {failure && (
        <p role="alert" className="mx-auto mt-6 max-w-3xl rounded-2xl border border-red-400/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {t.errors[failure]}
        </p>
      )}

      {response && (
        <div ref={resultsRef} className="mt-10 scroll-mt-20">
          <PorondamResults response={response} />
        </div>
      )}
    </main>
  );
}

function PorondamResults({ response }: { response: PorondamResponse }) {
  const { lang, t } = useLanguage();
  const { result, summary } = response;
  const verdict = verdictOf(result);
  const style = VERDICT_STYLE[verdict];
  const kuja = [result.bride.kuja_dosha && t.bride, result.groom.kuja_dosha && t.groom].filter(Boolean) as string[];

  return (
    <div className="space-y-5 sm:space-y-6" aria-live="polite">
      <section className="glass rounded-3xl p-5 sm:p-7">
        <h2 className="font-sinhala mb-5 text-center text-xl leading-relaxed font-semibold text-gold-200">{t.porondamResults}</h2>
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
          <ScoreRing percentage={result.percentage} colour={style.ring}>
            <span className="text-3xl font-bold text-gold-100 tabular-nums">{result.percentage}%</span>
            <span className={`font-sinhala text-base font-bold ${style.text}`}>{t.verdicts[verdict]}</span>
          </ScoreRing>

          <div className="w-full max-w-md space-y-3">
            <p className="text-center text-[15px] font-semibold text-gold-100 md:text-left">{t.porondamScore(result.passed, result.total)}</p>
            {(["bride", "groom"] as const).map((side) => {
              const p = result[side];
              return (
                <div key={side} className="rounded-2xl border border-white/10 bg-cosmic-900/50 px-4 py-2.5">
                  <p className="text-xs text-gold-100/70">
                    {side === "bride" ? "👰" : "🤵"} {t[side]}
                  </p>
                  <p className="text-base leading-snug font-semibold text-indigo-50">{p.name}</p>
                  <p className="text-sm leading-relaxed text-indigo-100/75">
                    {t.moonStarLine(NAKSHATRA_NAMES[lang][p.nakshatra.index], p.nakshatra.pada, RASHI_NAMES[lang][p.moon_rashi_index])}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {kuja.length ? (
            kuja.map((who) => (
              <span key={who} className="rounded-2xl border border-red-400/50 bg-red-500/15 px-3 py-1.5 text-center text-sm leading-relaxed font-semibold text-red-200">
                ⚠️ {t.kujaPresentFor(who)}
              </span>
            ))
          ) : (
            <span className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-center text-sm leading-relaxed text-emerald-200">✓ {t.kujaNone}</span>
          )}
        </div>
        {result.kuja_dosha_note && <p className="mt-2 text-center text-sm leading-relaxed text-indigo-100/75">{result.kuja_dosha_note[lang]}</p>}
      </section>

      <section className="glass rounded-3xl p-4 sm:p-6">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {result.items.map((item) => (
            <li
              key={item.key}
              className={`flex gap-3 rounded-2xl border px-3.5 py-3 ${
                item.passed ? "border-emerald-400/30 bg-emerald-500/[0.07]" : "border-red-400/35 bg-red-500/[0.08]"
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  item.passed ? "bg-emerald-400 text-cosmic-950" : "bg-red-400 text-cosmic-950"
                }`}
              >
                {item.passed ? "✓" : "✕"}
              </span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-sinhala text-base leading-relaxed font-semibold text-gold-100">{item.name[lang]}</span>
                  {item.critical && (
                    <span className="rounded-full border border-gold-400/50 px-1.5 py-px text-[10px] font-semibold text-gold-200">{t.majorPorondam}</span>
                  )}
                  <span className="sr-only">{item.passed ? "✓" : "✕"}</span>
                </p>
                <p className="text-sm leading-relaxed text-indigo-100/75">{item.detail[lang]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-3xl p-4 sm:p-6">
        <h2 className="font-sinhala mb-3 text-lg leading-relaxed font-semibold text-gold-200">💞 {t.harmonySummary}</h2>
        <div className="space-y-3 text-base leading-[1.85] text-indigo-50/90">
          {summary.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="mt-4 text-xs text-indigo-200/65">{summary.source === "llm" ? t.summaryByGemini : t.summaryByRules}</p>
      </section>

      <p className="mx-auto max-w-3xl px-2 text-center text-xs leading-relaxed text-indigo-200/65">{t.porondamVerifiedNote}</p>
    </div>
  );
}

function ScoreRing({ percentage, colour, children }: { percentage: number; colour: string; children: ReactNode }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`${percentage}%`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          style={{ filter: `drop-shadow(0 0 6px ${colour}88)`, transition: "stroke-dasharray 700ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
