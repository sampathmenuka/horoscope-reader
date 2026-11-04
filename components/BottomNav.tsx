"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SECTION_HREF, useCurrentSection, useGoToSection, type Section } from "@/lib/sections";

/**
 * Phone navigation (below md): a bar fixed to the bottom of the screen with
 * හඳහන · අද දවස (raised, main) · පොරොන්දම්, within easy reach of the thumb.
 */
export function BottomNav() {
  const { t } = useLanguage();
  const current = useCurrentSection();
  const go = useGoToSection();

  const handle = (section: Section) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(section);
  };

  const side = (section: Exclude<Section, "daily">, icon: string, label: string) => {
    const active = current === section;
    return (
      <Link
        href={SECTION_HREF[section]}
        onClick={handle(section)}
        aria-current={active ? "page" : undefined}
        className={`font-sinhala flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[12px] leading-tight font-semibold transition ${
          active ? "text-gold-200" : "text-indigo-200/75 hover:text-gold-200"
        }`}
      >
        <span aria-hidden className={`text-xl transition ${active ? "scale-110" : "opacity-80"}`}>
          {icon}
        </span>
        <span>{label}</span>
        <span aria-hidden className={`mt-0.5 h-0.5 w-6 rounded-full ${active ? "bg-gold-400" : "bg-transparent"}`} />
      </Link>
    );
  };

  const dailyActive = current === "daily";

  return (
    <nav
      aria-label={t.sectionsLabel}
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-gold-400/20 bg-cosmic-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        {side("chart", "🔮", t.navChart)}

        <Link
          href={SECTION_HREF.daily}
          onClick={handle("daily")}
          aria-current={dailyActive ? "page" : undefined}
          className="font-sinhala -mt-5 flex flex-1 flex-col items-center gap-1 pb-2 text-[12px] leading-tight font-bold"
        >
          <span
            aria-hidden
            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl transition ${
              dailyActive
                ? "border-gold-200 bg-gradient-to-b from-gold-300 to-gold-500 shadow-[0_6px_22px_-4px_rgba(217,172,69,0.75)]"
                : "border-gold-400/70 bg-gradient-to-b from-maroon-600 to-maroon-800 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.7)]"
            }`}
          >
            ☀️
          </span>
          <span className={dailyActive ? "text-gold-200" : "text-gold-100/85"}>{t.navDaily}</span>
        </Link>

        {side("porondam", "💍", t.navPorondam)}
      </div>
    </nav>
  );
}
