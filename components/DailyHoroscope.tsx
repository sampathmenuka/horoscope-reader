"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Spinner } from "@/components/BirthForm";
import { RashiIcon } from "@/components/RashiIcon";
import { useLanguage } from "@/context/LanguageContext";
import { DIRECTION_DEGREES, type DailyHoroscope as DailyData, type DailyLagnaReading } from "@/lib/daily";
import {
  NAKSHATRA_NAMES,
  RASHI_NAMES,
  WEEKDAY_NAMES,
  formatDate,
  formatSriLankanTime,
  formatSriLankanTimeRange,
  type ErrorCode,
  type Lang,
} from "@/lib/i18n";

interface DailyHoroscopeProps {
  /** Only fetch once the tab is actually opened. */
  active: boolean;
  /** Highlights the visitor's own Lagna when they have already cast a chart. */
  userLagnaIndex?: number;
  /** Switches to the birth chart tab (CTA and "don't know your Lagna?" link). */
  onCheckFullChart: () => void;
}

/** "Mesha (Aries)" -> ["Mesha", "Aries"] */
function englishParts(index: number): [string, string] {
  const match = RASHI_NAMES.en[index].match(/^(.*) \((.*)\)$/);
  return match ? [match[1], match[2]] : [RASHI_NAMES.en[index], ""];
}

export function DailyHoroscope({ active, userLagnaIndex, onCheckFullChart }: DailyHoroscopeProps) {
  const { lang, t } = useLanguage();
  const [data, setData] = useState<Partial<Record<Lang, DailyData>>>({});
  const [errors, setErrors] = useState<Partial<Record<Lang, ErrorCode>>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const inFlight = useRef(new Set<Lang>());

  useEffect(() => {
    if (!active || data[lang] || errors[lang] || inFlight.current.has(lang)) return;
    const forLang = lang;
    inFlight.current.add(forLang);
    fetch(`/api/daily-horoscope?lang=${forLang}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (res.ok) setData((s) => ({ ...s, [forLang]: body as DailyData }));
        else setErrors((s) => ({ ...s, [forLang]: (body?.error as ErrorCode) ?? "predict_failed" }));
      })
      .catch(() => setErrors((s) => ({ ...s, [forLang]: "network" })))
      .finally(() => inFlight.current.delete(forLang));
  }, [active, lang, data, errors]);

  const today = data[lang];
  const error = errors[lang];
  const reading = today && selected !== null ? today.lagnas[selected] : null;

  return (
    <section aria-labelledby="daily-title" className="mx-auto max-w-5xl">
      <div className="mb-5 text-center sm:mb-7">
        <h2 id="daily-title" className="font-sinhala text-2xl leading-snug font-bold text-gold-200 sm:text-3xl">
          {t.dailyTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[15px] leading-relaxed text-indigo-100/70">{t.dailySubtitle}</p>
        <button
          type="button"
          onClick={onCheckFullChart}
          className="mt-2 inline-block rounded-lg px-2 py-1 text-sm leading-relaxed font-medium text-gold-300 underline decoration-gold-400/40 underline-offset-4 transition hover:text-gold-200 hover:decoration-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
        >
          {t.lagnaHelp}
        </button>
      </div>

      {!today && !error && (
        <div className="glass flex items-center justify-center gap-3 rounded-3xl px-4 py-12 text-indigo-100/80" aria-live="polite">
          <Spinner />
          {t.dailyLoading}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-3xl border border-red-400/30 bg-red-950/40 px-4 py-5 text-center text-sm text-red-200">
          <p>{t.errors[error]}</p>
          <button
            type="button"
            onClick={() => setErrors((s) => ({ ...s, [lang]: undefined }))}
            className="mt-3 rounded-xl border border-red-300/40 px-4 py-2 text-red-100 transition hover:bg-red-900/40"
          >
            {t.tryAgain}
          </button>
        </div>
      )}

      {today && (
        <>
          <PanchangaBanner data={today} />

          <ul className="mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:grid-cols-4 sm:gap-4">
            {today.lagnas.map((l) => (
              <li key={l.lagnaId}>
                <LagnaCard reading={l} isUser={l.lagnaIndex === userLagnaIndex} onOpen={() => setSelected(l.lagnaIndex)} />
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs leading-relaxed text-indigo-200/65">
            {today.source === "llm" ? t.dailySourceLlm : t.dailySourceRules}
          </p>
        </>
      )}

      {reading && today && (
        <ReadingSheet
          reading={reading}
          date={today.date}
          isUser={reading.lagnaIndex === userLagnaIndex}
          onClose={() => setSelected(null)}
          onCheckFullChart={() => {
            setSelected(null);
            onCheckFullChart();
          }}
        />
      )}
    </section>
  );
}

function PanchangaBanner({ data }: { data: DailyData }) {
  const { lang, t } = useLanguage();
  const p = data.panchanga;

  // Times after midnight belong to tomorrow's calendar date; say so explicitly.
  const when = (iso: string) => {
    const text = formatSriLankanTime(iso, lang);
    return iso.slice(0, 10) > data.date ? t.tomorrowAt(text) : text;
  };
  const rahu = formatSriLankanTimeRange(p.rahuKalaya.start, p.rahuKalaya.end, lang);

  return (
    <div className="glass rounded-3xl border-t-2 border-t-amber-500/40 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs leading-relaxed tracking-wide text-gold-100/60">{t.dailyDate}</p>
          <p className="font-sinhala text-xl leading-snug font-bold text-gold-100 sm:text-2xl">{formatDate(data.date, lang)}</p>
          <p className="text-[15px] leading-relaxed text-indigo-100/80">{WEEKDAY_NAMES[lang][p.weekdayIndex]}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-2.5">
          <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3.5 py-2.5 shadow-[0_0_24px_-8px_rgba(251,191,36,0.5)]">
            <svg className="h-5 w-5 shrink-0 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-xs leading-relaxed text-amber-200/80">{t.rahuKalaya}</p>
              <p className="text-base leading-snug font-bold whitespace-nowrap text-amber-200 tabular-nums">{rahu.text}</p>
              {rahu.sharedPeriod && <p className="text-[11px] leading-relaxed text-amber-200/65">{t.rahuBothPeriods(rahu.sharedPeriod)}</p>}
            </div>
          </div>
          {p.maruSoolama && (
            <DirectionBadge
              label={t.maruSoolama}
              hint={t.maruSoolamaHint}
              name={p.maruSoolama.name[lang]}
              degrees={DIRECTION_DEGREES[p.maruSoolama.code]}
              tone="avoid"
            />
          )}
          {p.subaDishawa && (
            <DirectionBadge
              label={t.subaDishawa}
              hint={t.subaDishawaHint}
              name={p.subaDishawa.name[lang]}
              degrees={DIRECTION_DEGREES[p.subaDishawa.code]}
              tone="good"
            />
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs leading-relaxed text-indigo-200/60">{t.todayNakshatra}</dt>
          <dd className="leading-relaxed">
            <span className="text-base font-semibold text-gold-200">{NAKSHATRA_NAMES[lang][p.nakshatraIndex]}</span>
            {p.nakshatraEndsAt && <span className="ml-1.5 text-indigo-100/70">({t.until(when(p.nakshatraEndsAt))})</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs leading-relaxed text-indigo-200/60">{t.moonTransit}</dt>
          <dd className="leading-relaxed">
            <span className="text-base font-semibold text-gold-200">{RASHI_NAMES[lang][p.moonRashiIndex]}</span>
            {p.moonSignChangesAt && p.nextMoonRashiIndex !== null && (
              <span className="ml-1.5 text-indigo-100/70">
                → {t.moonEnters(RASHI_NAMES[lang][p.nextMoonRashiIndex], when(p.moonSignChangesAt))}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs leading-relaxed text-indigo-200/60">{t.sunriseSunset}</dt>
          <dd className="text-base leading-relaxed font-semibold text-indigo-50 tabular-nums">
            {formatSriLankanTime(p.sunrise, lang)} · {formatSriLankanTime(p.sunset, lang)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-indigo-200/65">{t.timesForColombo}</p>
    </div>
  );
}

function LagnaCard({ reading, isUser, onOpen }: { reading: DailyLagnaReading; isUser: boolean; onOpen: () => void }) {
  const { lang, t } = useLanguage();
  const [traditional, western] = englishParts(reading.lagnaIndex);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className={`group relative flex h-full w-full flex-col items-center rounded-2xl border px-1.5 pt-4 pb-3 text-center transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:rounded-3xl sm:px-3 sm:pt-5 sm:pb-4 ${
        isUser
          ? "border-gold-400/70 bg-maroon-800/40 shadow-[0_0_24px_-6px_rgba(217,172,69,0.55)]"
          : "border-white/10 bg-cosmic-900/55 hover:border-gold-400/50 hover:bg-cosmic-800/60"
      }`}
    >
      {isUser && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] leading-relaxed font-bold whitespace-nowrap text-cosmic-950">
          {t.yourLagna}
        </span>
      )}
      {reading.chandrashtama && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" title={t.chandrashtama} />
      )}
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/40 bg-gradient-to-b from-gold-400/20 to-transparent text-gold-300 transition group-hover:border-gold-300 group-hover:text-gold-200 sm:h-16 sm:w-16">
        <RashiIcon index={reading.lagnaIndex} className="h-9 w-9 sm:h-12 sm:w-12" />
      </span>
      <span className="font-sinhala mt-2 text-base leading-snug font-semibold text-gold-100 sm:text-lg">
        {lang === "si" ? RASHI_NAMES.si[reading.lagnaIndex] : traditional}
      </span>
      <span className="text-[11px] leading-relaxed text-indigo-200/60 sm:text-xs">{western}</span>
      <Stars rating={reading.moodRating} className="mt-1.5" small />
    </button>
  );
}

function shareText(reading: DailyLagnaReading, date: string, lang: Lang, t: ReturnType<typeof useLanguage>["t"]): string {
  const stars = "⭐".repeat(reading.moodRating) + "☆".repeat(5 - reading.moodRating);
  return [
    `☀️ ${t.shareHeading} — ${t.shareLagna(reading.lagnaName.replace(/ \(.*\)$/, ""))}`,
    `📅 ${formatDate(date, lang)}  ${stars}`,
    "",
    reading.generalPrediction,
    "",
    `🎯 ${t.jayaAnkaya}: ${reading.jayaAnkaya}`,
    `🎨 ${t.jayaPata}: ${reading.jayaPata.name}`,
    `🧭 ${t.subaDishawa}: ${reading.subaDishawa}`,
    "",
    `${window.location.origin}/#daily`,
  ].join("\n");
}

function ReadingSheet({
  reading,
  date,
  isUser,
  onClose,
  onCheckFullChart,
}: {
  reading: DailyLagnaReading;
  date: string;
  isUser: boolean;
  onClose: () => void;
  onCheckFullChart: () => void;
}) {
  const { lang, t } = useLanguage();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const [traditional, western] = englishParts(reading.lagnaIndex);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Runs once per opening: focus, scroll lock, Escape, and focus return on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText(reading, date, lang, t))}`;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade-in absolute inset-0 bg-cosmic-950/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-title"
        className="animate-sheet relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-gold-400/25 bg-gradient-to-b from-cosmic-800 to-cosmic-950 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />

        {/* Centred header group: emblem on the left; name, other-script names and day rating on the right.
            The close button is pinned top-right so it doesn't pull the group off-centre. */}
        <div className="relative flex justify-center px-12 pt-4 sm:px-14 sm:pt-7">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="absolute top-3 right-3 rounded-full p-2 text-indigo-200/70 transition hover:bg-white/10 hover:text-gold-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:top-5 sm:right-5"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4Z" />
            </svg>
          </button>
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gold-400/50 bg-gradient-to-b from-gold-400/25 to-transparent text-gold-300">
              <RashiIcon index={reading.lagnaIndex} className="h-12 w-12" />
            </span>
            <div className="min-w-0 text-left">
              {isUser && (
                <span className="mb-1 inline-block rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-cosmic-950">{t.yourLagna}</span>
              )}
              <h3 id="reading-title" className="font-sinhala text-2xl leading-snug font-bold text-gold-100">
                {lang === "si" ? RASHI_NAMES.si[reading.lagnaIndex] : traditional}
              </h3>
              <p className="text-sm leading-relaxed text-indigo-200/70">{lang === "si" ? `${traditional} · ${western}` : western}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Stars rating={reading.moodRating} />
                <span className="sr-only">
                  {t.dayRating}: {reading.moodRating}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pt-5 pb-6 sm:px-7 sm:pb-7">
          <p className="mb-3 text-sm leading-relaxed font-medium text-gold-200/85">{t.moonInHouse(reading.moonHouse)}</p>

          {reading.chandrashtama && (
            <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2.5 text-sm leading-relaxed text-amber-100">
              <span aria-hidden>⚠️</span>
              <span>
                <strong className="font-semibold text-amber-200">{t.chandrashtama}:</strong> {t.chandrashtamaNote}
              </span>
            </p>
          )}

          <p className="text-base leading-[1.9] text-indigo-50/95">{reading.generalPrediction}</p>

          {/* Three equal cards: label, a 40px visual row, then a caption row of fixed height. */}
          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
            <Badge icon="🎯" label={t.jayaAnkaya} visual={<span className="text-[1.65rem] leading-none font-bold whitespace-nowrap text-gold-300 tabular-nums sm:text-3xl">{reading.jayaAnkaya}</span>} />
            <Badge
              icon="🎨"
              label={t.jayaPata}
              visual={
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-full ring-2 ring-white/25 ring-offset-2 ring-offset-cosmic-900"
                  style={{ backgroundColor: reading.jayaPata.hexColor, boxShadow: `0 0 16px 1px ${reading.jayaPata.hexColor}80` }}
                />
              }
              caption={<span className="text-base leading-snug font-bold text-indigo-50">{reading.jayaPata.name}</span>}
            />
            <Badge
              icon="🧭"
              label={t.subaDishawa}
              visual={<CompassArrow degrees={DIRECTION_DEGREES[reading.dishawaCode]} />}
              caption={
                <span className={`leading-snug font-bold break-words text-amber-300 ${lang === "si" ? "text-base min-[400px]:text-xl" : "text-sm min-[400px]:text-base"}`}>{reading.subaDishawa}</span>
              }
            />
          </div>

          <div className="mt-6 grid gap-2.5">
            <button
              type="button"
              onClick={onCheckFullChart}
              className="font-sinhala flex w-full items-center justify-center gap-2 rounded-2xl border border-gold-400/60 bg-gradient-to-b from-maroon-500 to-maroon-700 px-4 py-3.5 text-[15px] leading-relaxed sm:px-5 sm:text-base font-semibold text-gold-100 shadow-lg shadow-maroon-900/50 transition hover:from-maroon-500 hover:to-maroon-600"
            >
              <span aria-hidden>🔮</span> {t.checkFullChart}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sinhala flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-base leading-relaxed font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <WhatsAppIcon /> {t.shareWhatsApp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon, label, visual, caption }: { icon: string; label: string; visual: ReactNode; caption?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-gold-400/25 bg-cosmic-900/70 px-1.5 pt-2.5 pb-3 text-center">
      <span className="text-[11px] leading-relaxed whitespace-nowrap text-gold-100/70 sm:text-xs">
        <span aria-hidden>{icon}</span> {label}
      </span>
      <div className="mt-2 flex h-10 items-center justify-center">{visual}</div>
      <div className="mt-1.5 flex min-h-7 items-center justify-center">{caption}</div>
    </div>
  );
}

/** Small banner card for a day-level direction (Maru Soolama to avoid, or Suba Dishawa). */
function DirectionBadge({
  label,
  hint,
  name,
  degrees,
  tone,
}: {
  label: string;
  hint: string;
  name: string;
  degrees: number;
  tone: "avoid" | "good";
}) {
  const colours =
    tone === "avoid"
      ? "border-red-400/40 bg-red-500/10 text-red-200"
      : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  return (
    // Below 400px the two badges share a narrow row, so the compass sits above the
    // name and long Sinhala directions (නැගෙනහිර) get the card's full width.
    <div
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2.5 py-2.5 text-center min-[400px]:flex-row min-[400px]:gap-2.5 min-[400px]:px-3 min-[400px]:text-left ${colours}`}
      title={hint}
    >
      <CompassArrow degrees={degrees} className={`h-7 w-7 shrink-0 min-[400px]:h-8 min-[400px]:w-8 ${tone === "avoid" ? "text-red-300" : "text-emerald-300"}`} />
      <div className="min-w-0">
        <p className="text-xs leading-relaxed opacity-80">{label}</p>
        <p className="text-base leading-snug font-bold break-words">{name}</p>
      </div>
    </div>
  );
}

/** Compass ring with a needle pointing to the given direction (N at the top). */
function CompassArrow({ degrees, className = "h-10 w-10 text-gold-400" }: { degrees: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" aria-hidden>
      <circle cx="20" cy="20" r="17" strokeOpacity="0.45" strokeWidth="1.5" />
      <path d="M20 4.5v2.5M20 33v2.5M4.5 20H7M33 20h2.5" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      <g transform={`rotate(${degrees} 20 20)`}>
        <path d="M20 8 L24.5 21 H15.5 Z" fill="currentColor" stroke="none" />
        <path d="M20 32 L24.5 21 H15.5 Z" fill="currentColor" fillOpacity="0.25" stroke="none" />
      </g>
      <circle cx="20" cy="20" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

function Stars({ rating, small, className }: { rating: number; small?: boolean; className?: string }) {
  return (
    <span className={`flex items-center gap-0.5 ${className ?? ""}`} aria-label={`${rating}/5`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`${small ? "h-3 w-3" : "h-4 w-4"} ${i < rating ? "text-gold-400" : "text-white/15"}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5Z" />
        </svg>
      ))}
    </span>
  );
}
