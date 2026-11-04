"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SECTION_HREF, SECTIONS_ANCHOR_ATTR, useCurrentSection, useGoToSection, type Section } from "@/lib/sections";

/**
 * Landing-page section switcher: "අද දවස ඔබට කොහොමද?" as the main button,
 * with "හඳහන පරීක්ෂාව" and "පොරොන්දම්" side by side beneath it.
 * Used on the home page and the porondam page.
 */
export function SectionNav({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const current = useCurrentSection();
  const go = useGoToSection();

  const secondary: { key: Exclude<Section, "daily">; icon: string; label: string }[] = [
    { key: "chart", icon: "🔮", label: t.modeChart },
    { key: "porondam", icon: "💍", label: t.navPorondamLong },
  ];

  const handle = (section: Section) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab, etc.) behave like normal links.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(section);
  };

  const dailyActive = current === "daily";

  return (
    <nav {...{ [SECTIONS_ANCHOR_ATTR]: "" }} aria-label={t.sectionsLabel} className={`no-print mx-auto max-w-2xl scroll-mt-20 ${className}`}>
      <Link
        href={SECTION_HREF.daily}
        onClick={handle("daily")}
        aria-current={dailyActive ? "page" : undefined}
        className={`font-sinhala group flex w-full items-center justify-center gap-2.5 rounded-2xl border px-4 py-3.5 text-base leading-snug font-bold whitespace-nowrap transition min-[380px]:text-[17px] sm:gap-3 sm:px-5 sm:py-5 sm:text-xl ${
          dailyActive
            ? "border-gold-300 bg-gradient-to-b from-gold-300 to-gold-500 text-cosmic-950 shadow-[0_8px_30px_-6px_rgba(217,172,69,0.65)]"
            : "border-gold-400/70 bg-gradient-to-b from-gold-400/20 to-maroon-900/40 text-gold-100 shadow-[0_0_28px_-8px_rgba(217,172,69,0.6)] hover:from-gold-400/30"
        }`}
      >
        <span aria-hidden className="text-xl transition group-hover:scale-110 min-[380px]:text-2xl sm:text-3xl">
          ☀️
        </span>
        <span>{t.modeDaily}</span>
      </Link>

      {/* Phones: three full-width buttons, one line each. sm+: the two secondary buttons side by side. */}
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {secondary.map(({ key, icon, label }) => {
          const active = current === key;
          return (
            <Link
              key={key}
              href={SECTION_HREF[key]}
              onClick={handle(key)}
              aria-current={active ? "page" : undefined}
              className={`font-sinhala flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-center text-[15px] leading-snug font-semibold whitespace-nowrap transition sm:text-base ${
                active
                  ? "border-gold-400/80 bg-maroon-700/60 text-gold-100 shadow-lg shadow-maroon-900/40"
                  : "glass border-gold-400/25 text-indigo-50 hover:border-gold-400/50 hover:text-gold-200"
              }`}
            >
              <span aria-hidden className="text-lg">
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
