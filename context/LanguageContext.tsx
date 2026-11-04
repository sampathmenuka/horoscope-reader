"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LanguageModal } from "@/components/LanguageModal";
import { getDictionary, isLang, LOCALE_COOKIE, LOCALE_STORAGE_KEY, type Dictionary, type Lang } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  t: Dictionary;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function persist(lang: Lang) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    // Storage may be unavailable (private mode); the cookie still carries the choice.
  }
  // Only write the cookie when it changes: rewriting it on every load keeps the
  // page out of the browser's back/forward cache.
  if (!document.cookie.split("; ").includes(`${LOCALE_COOKIE}=${lang}`)) {
    document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }
  if (document.documentElement.lang !== lang) document.documentElement.lang = lang;
}

function readStored(): Lang | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLang(value) ? value : null;
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

/**
 * `initialLang` comes from the NEXT_LOCALE cookie on the server so the first
 * paint is already in the right language. Without the cookie, a previous choice
 * in localStorage is used; with neither, the first-visit modal asks (and is
 * already present in the server-rendered HTML, so it never flashes in).
 */
export function LanguageProvider({ initialLang, children }: { initialLang: Lang | null; children: ReactNode }) {
  const [chosen, setChosen] = useState<Lang | null>(initialLang);
  const stored = useSyncExternalStore(noopSubscribe, readStored, () => null);

  const lang: Lang = chosen ?? stored ?? "si";
  const needsChoice = chosen === null && stored === null;

  // Keep cookie, localStorage and <html lang> in sync with the effective language.
  useEffect(() => {
    if (!needsChoice) persist(lang);
  }, [lang, needsChoice]);

  const setLang = useCallback((next: Lang) => {
    setChosen(next);
    persist(next);
  }, []);

  const value = useMemo(() => ({ lang, t: getDictionary(lang), setLang }), [lang, setLang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
      {needsChoice && <LanguageModal onChoose={setLang} />}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
