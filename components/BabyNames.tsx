"use client";

import { useState, useTransition } from "react";
import { suggestBabyNames, type BabyNamesResult } from "@/app/actions/babyNames";
import { Spinner } from "@/components/BirthForm";
import { useLanguage } from "@/context/LanguageContext";
import { NAKSHATRA_NAMES, type Lang } from "@/lib/i18n";
import { NAKSHATRA_SYLLABLES } from "@/lib/nameSyllables";
import type { ChartResponse } from "@/lib/types";

type Gender = "boy" | "girl";

/** සුබ අකුරු: the traditional first syllable for this nakshatra-pada, plus AI name ideas. */
export function BabyNames({ chart }: { chart: ChartResponse }) {
  const { lang, t } = useLanguage();
  const { index, pada } = chart.nakshatra;
  const syllables = NAKSHATRA_SYLLABLES[index];
  const current = syllables[pada - 1];
  const [gender, setGender] = useState<Gender>(chart.birth.gender === "female" ? "girl" : "boy");
  const [results, setResults] = useState<Partial<Record<`${Gender}-${Lang}`, BabyNamesResult>>>({});
  const [pending, startTransition] = useTransition();
  const result = results[`${gender}-${lang}`];

  function suggest() {
    const key = `${gender}-${lang}` as const;
    startTransition(async () => {
      const value = await suggestBabyNames({ nakshatraIndex: index, pada, gender, lang }).catch(
        (): BabyNamesResult => ({ ok: false, reason: "failed" }),
      );
      setResults((s) => ({ ...s, [key]: value }));
    });
  }

  return (
    <section className="glass no-print rounded-3xl p-4 sm:p-6" aria-labelledby="names-title">
      <h2 id="names-title" className="font-sinhala mb-3 text-lg leading-relaxed font-semibold text-gold-200">
        {t.babyNamesTitle}
      </h2>
      <p className="text-[15px] leading-relaxed text-indigo-100/80">{t.babyNamesIntro(NAKSHATRA_NAMES[lang][index], pada)}</p>

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2 border-gold-400/70 bg-gradient-to-b from-gold-400/25 to-maroon-900/40 shadow-[0_0_28px_-6px_rgba(217,172,69,0.6)]">
          <span className="font-sinhala text-3xl leading-tight font-bold text-gold-100">{current.si}</span>
          <span className="text-xs font-semibold text-gold-300">{current.en}</span>
        </span>
        <div className="min-w-0">
          <p className="mb-1.5 text-xs leading-relaxed text-indigo-200/65">{t.padaLetters}</p>
          <ol className="flex flex-wrap gap-1.5">
            {syllables.map((s, i) => (
              <li
                key={s.en + i}
                className={`rounded-lg border px-2.5 py-1 text-sm leading-relaxed ${
                  i === pada - 1 ? "border-gold-400 bg-gold-400/20 font-bold text-gold-100" : "border-white/10 text-indigo-100/75"
                }`}
              >
                <span className="font-sinhala">{s.si}</span> <span className="text-xs opacity-70">{s.en}</span>
                <span className="sr-only">, {t.pada} {i + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-indigo-200/65">{t.syllableNote}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gold-100/80">{t.namesFor}</span>
        <div role="radiogroup" aria-label={t.namesFor} className="flex rounded-xl border border-white/15 bg-cosmic-900/60 p-1">
          {(["boy", "girl"] as const).map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={gender === g}
              onClick={() => setGender(g)}
              className={`rounded-lg px-3 py-1.5 text-sm leading-relaxed transition ${
                gender === g ? "bg-gold-400 font-semibold text-cosmic-950" : "text-indigo-100/80 hover:text-gold-200"
              }`}
            >
              {g === "boy" ? t.boy : t.girl}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={suggest}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gold-400/60 bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-2 text-sm leading-relaxed font-semibold text-cosmic-950 transition hover:from-gold-200 hover:to-gold-400 disabled:opacity-60"
        >
          {pending ? <Spinner /> : <span aria-hidden>✨</span>}
          {pending ? t.suggestingNames : t.suggestNames}
        </button>
      </div>

      {result && !result.ok && (
        <p role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
          {result.reason === "no_key" ? t.namesNeedKey : t.namesFailed}
        </p>
      )}

      {result?.ok && (
        <>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {result.names.map((n) => (
              <li key={n.si} className="rounded-2xl border border-white/10 bg-cosmic-900/50 px-3.5 py-2.5">
                <p className="leading-snug">
                  <span className="font-sinhala text-lg font-bold text-gold-100">{n.si}</span>
                  <span className="ml-2 text-sm text-indigo-200/75">{n.en}</span>
                </p>
                <p className="text-sm leading-relaxed text-indigo-100/80">{n.meaning}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-indigo-200/65">{t.namesNote}</p>
        </>
      )}
    </section>
  );
}
