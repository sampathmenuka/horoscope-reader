"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTown, searchTowns, townLabel, type Town } from "@/lib/sriLankaTowns";

interface TownSelectProps {
  value: string;
  onChange: (townId: string) => void;
  invalid?: boolean;
  describedBy?: string;
  id?: string;
}

/** True when the typed text is exactly a town's name (either script) or a known alternative spelling. */
function isExactMatch(town: Town, query: string): boolean {
  const q = query.trim().toLowerCase();
  return [town.en, town.si, ...(town.aliases ?? [])].some((name) => name.toLowerCase() === q);
}

/**
 * Accessible searchable combobox over the built-in Sri Lankan towns dataset
 * (each town has fixed coordinates for the chart calculation). Accepts Sinhala
 * or English; only towns from the list can be chosen.
 */
export function TownSelect({ value, onChange, invalid, describedBy, id }: TownSelectProps) {
  const { lang, t } = useLanguage();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = getTown(value);
  const results = useMemo(() => searchTowns(query), [query]);

  // Keep the highlighted option visible while moving with the arrow keys.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(townId: string) {
    onChange(townId);
    setQuery("");
    setOpen(false);
  }

  function close() {
    // Typed an exact town name but didn't pick it from the list: select it rather than drop the input.
    const exact = query.trim() ? results.find((town) => isExactMatch(town, query)) : undefined;
    if (exact) choose(exact.id);
    else {
      setQuery("");
      setOpen(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const town = results[active];
      if (town) choose(town.id);
    } else if (event.key === "Escape") {
      setQuery("");
      setOpen(false);
    }
  }

  const display = open ? query : selected ? townLabel(selected, lang) : "";

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        autoComplete="off"
        enterKeyHint="done"
        className="field pr-11"
        placeholder={t.placeSearchPlaceholder}
        value={display}
        onFocus={() => {
          setOpen(true);
          const index = selected ? results.findIndex((town) => town.id === selected.id) : 0;
          setActive(Math.max(index, 0));
        }}
        onBlur={close}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      <svg
        className="pointer-events-none absolute top-1/2 right-3.5 h-[18px] w-[18px] -translate-y-1/2 text-gold-300/80"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M10 2a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 10 5.5a2.5 2.5 0 0 1 0 5Z" />
      </svg>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto overscroll-contain rounded-2xl border border-gold-400/25 bg-cosmic-900/95 py-1.5 shadow-2xl backdrop-blur-lg"
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm leading-relaxed text-indigo-200/75">{t.noTownsFound}</li>}
          {results.map((town, i) => {
            const isSelected = town.id === value;
            return (
              <li
                key={town.id}
                id={`${listId}-${town.id}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                // Keep focus in the input so the click isn't treated as leaving the field.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(town.id)}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2 text-[15px] leading-relaxed transition-colors duration-100 ${
                  i === active ? "bg-maroon-700/55 text-gold-100" : "text-indigo-50"
                }`}
              >
                <span className="min-w-0">
                  {townLabel(town, lang)}
                  <span className="ml-2 text-[13px] text-indigo-200/70">{lang === "si" ? town.en : town.si}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[13px] text-indigo-200/70">
                  {town.district[lang]}
                  {isSelected && (
                    <svg viewBox="0 0 20 20" className="h-4 w-4 text-gold-300" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
