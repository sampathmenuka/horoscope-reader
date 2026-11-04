"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { LotusMark } from "@/components/LanguageModal";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/i18n";
import { SECTION_HREF, useCurrentSection, useGoToSection, type Section } from "@/lib/sections";

// Short labels on narrow phones (below 440px) leave room for the brand and porondam link.
const OPTIONS: { value: Lang; label: string; short: string }[] = [
  { value: "si", label: "සිංහල", short: "සිං" },
  { value: "en", label: "English", short: "EN" },
];

export function Navbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-gold-400/15 bg-cosmic-950/70 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <LotusMark className="h-8 w-8 shrink-0 text-gold-400 sm:h-9 sm:w-9" />
          {/* Below 360px only the lotus logo shows, leaving room for the language toggle. */}
          <span className="hidden min-w-0 min-[360px]:block">
            <span className="font-sinhala block truncate text-lg font-semibold leading-tight text-gold-200">
              {lang === "si" ? "හඳහන" : "Handahana"}
            </span>
            <span className="hidden truncate text-xs text-indigo-200/70 lg:block">{t.appTagline}</span>
          </span>
        </Link>

        {/* Sections from tablet width up; phones use the bottom bar (BottomNav). */}
        <NavLinks />

        <div
          role="radiogroup"
          aria-label={t.languageToggleLabel}
          className="relative flex shrink-0 rounded-full border border-gold-400/30 bg-cosmic-900/80 p-1"
        >
          <span
            aria-hidden
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-b from-gold-300 to-gold-500 transition-transform duration-300 ${
              lang === "en" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={lang === opt.value}
              aria-label={opt.label}
              onClick={() => setLang(opt.value)}
              className={`font-sinhala relative z-10 w-12 rounded-full py-1.5 text-sm leading-relaxed font-semibold min-[440px]:w-[4.75rem] sm:w-20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 ${
                lang === opt.value ? "text-cosmic-950" : "text-indigo-100/80 hover:text-gold-200"
              }`}
            >
              <span className="min-[440px]:hidden">{opt.short}</span>
              <span className="hidden min-[440px]:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

/** Desktop/tablet section links; "අද දවස" is styled as the main one. */
function NavLinks() {
  const { t } = useLanguage();
  const current = useCurrentSection();
  const go = useGoToSection();

  const items: { key: Section; icon: string; label: string }[] = [
    { key: "daily", icon: "☀️", label: t.navDaily },
    { key: "chart", icon: "🔮", label: t.navChart },
    { key: "porondam", icon: "💍", label: t.navPorondam },
  ];

  const handle = (section: Section) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(section);
  };

  return (
    <nav aria-label={t.sectionsLabel} className="ml-auto hidden items-center gap-1.5 md:flex">
      {items.map(({ key, icon, label }) => {
        const active = current === key;
        const main = key === "daily";
        return (
          // No prefetch: prefetched dynamic pages come back no-store, which keeps
          // pages out of the browser's back/forward cache.
          <Link
            key={key}
            href={SECTION_HREF[key]}
            prefetch={false}
            onClick={handle(key)}
            aria-current={active ? "page" : undefined}
            className={`font-sinhala flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm leading-relaxed font-semibold whitespace-nowrap transition ${
              main
                ? active
                  ? "border-gold-300 bg-gradient-to-b from-gold-300 to-gold-500 text-cosmic-950 shadow-[0_4px_16px_-4px_rgba(217,172,69,0.7)]"
                  : "border-gold-400/70 bg-gold-400/15 text-gold-100 hover:bg-gold-400/25"
                : active
                  ? "border-gold-400/60 bg-maroon-700/60 text-gold-100"
                  : "border-transparent text-indigo-100/80 hover:border-gold-400/30 hover:text-gold-200"
            }`}
          >
            <span aria-hidden>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
