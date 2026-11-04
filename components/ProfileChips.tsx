"use client";

import { useLanguage } from "@/context/LanguageContext";
import type { BirthFormValues } from "@/lib/birthForm";
import { RASHI_NAMES } from "@/lib/i18n";
import { removeProfile, useSavedProfiles } from "@/lib/profiles";

/**
 * Quick-select chips for this browser's saved profiles, in one horizontally
 * scrolling row. Renders nothing when there are none. `onNew` adds a trailing
 * "+ New chart" chip that clears the form.
 */
export function ProfileChips({
  onSelect,
  onNew,
  className,
}: {
  onSelect: (values: BirthFormValues) => void;
  onNew?: () => void;
  className?: string;
}) {
  const { lang, t } = useLanguage();
  const profiles = useSavedProfiles();
  if (!profiles.length) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-sm leading-relaxed font-medium text-gold-100/80">
        {t.savedProfiles} <span className="text-xs font-normal text-indigo-200/65">· {t.profileHint}</span>
      </p>
      <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1.5 [scrollbar-width:thin]">
        {profiles.map((p) => {
          const label = `${p.values.name}${p.lagnaIndex !== undefined ? ` (${RASHI_NAMES[lang][p.lagnaIndex].replace(/ \(.*\)$/, "")})` : ""}`;
          return (
            <li key={p.id} className="flex shrink-0 snap-start items-stretch overflow-hidden rounded-full border border-gold-400/35 bg-cosmic-900/70">
              <button
                type="button"
                onClick={() => onSelect(p.values)}
                className="flex max-w-[15rem] items-center gap-1.5 py-1.5 pr-2 pl-3 text-sm leading-relaxed text-gold-100 transition hover:bg-gold-400/10"
              >
                <span aria-hidden>👤</span>
                <span className="truncate">{label}</span>
              </button>
              <button
                type="button"
                onClick={() => removeProfile(p.id)}
                aria-label={t.removeProfile(p.values.name)}
                className="border-l border-white/10 px-2.5 text-indigo-200/65 transition hover:bg-red-500/15 hover:text-red-200"
              >
                <span aria-hidden>×</span>
              </button>
            </li>
          );
        })}
        {onNew && (
          <li className="shrink-0 snap-start">
            <button
              type="button"
              onClick={onNew}
              className="flex h-full items-center gap-1.5 rounded-full border border-dashed border-gold-400/50 px-3 py-1.5 text-sm leading-relaxed whitespace-nowrap text-gold-200 transition hover:border-gold-300 hover:bg-gold-400/10"
            >
              <span aria-hidden>+</span> {t.newChart}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
