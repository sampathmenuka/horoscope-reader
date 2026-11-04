"use client";

import { useEffect, useRef } from "react";
import { DICTIONARIES, type Lang } from "@/lib/i18n";

/** Full-screen first-visit welcome asking for the preferred language. */
export function LanguageModal({ onChoose }: { onChoose: (lang: Lang) => void }) {
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const si = DICTIONARIES.si;
  const en = DICTIONARIES.en;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-cosmic-950/92 px-4 py-10"
    >
      <div className="star-field pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="glass relative w-full max-w-lg rounded-3xl p-8 text-center sm:p-10">
        <LotusMark className="mx-auto mb-6 h-20 w-20 text-gold-400" />
        <h1 id="welcome-title" className="font-sinhala text-2xl font-semibold text-gold-200 sm:text-3xl">
          {si.welcomeTitle}
        </h1>
        <p className="mt-1 text-lg text-gold-100/80">{en.welcomeTitle}</p>
        <p className="font-sinhala mt-5 text-sm leading-relaxed text-indigo-100/80">{si.welcomeSubtitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-indigo-100/60">{en.welcomeSubtitle}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            ref={firstButton}
            type="button"
            onClick={() => onChoose("si")}
            className="font-sinhala rounded-2xl border border-gold-400/60 bg-gradient-to-b from-maroon-600 to-maroon-800 px-6 py-4 text-lg font-semibold text-gold-100 shadow-lg shadow-maroon-900/40 transition hover:from-maroon-500 hover:to-maroon-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            {si.chooseSinhala}
          </button>
          <button
            type="button"
            onClick={() => onChoose("en")}
            className="rounded-2xl border border-indigo-300/40 bg-indigo-900/60 px-6 py-4 text-lg font-semibold text-indigo-50 transition hover:bg-indigo-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            {en.chooseEnglish}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LotusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="32" cy="32" r="30" strokeOpacity="0.35" />
      <circle cx="32" cy="32" r="22" strokeOpacity="0.2" strokeDasharray="2 3" />
      <path d="M32 14c5 6 6 14 0 24-6-10-5-18 0-24Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M32 38c-4-8-10-12-18-12 1 8 7 13 18 12Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M32 38c4-8 10-12 18-12-1 8-7 13-18 12Z" fill="currentColor" fillOpacity="0.1" />
      <path d="M18 44h28" strokeLinecap="round" />
      <path d="M22 48h20" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  );
}
