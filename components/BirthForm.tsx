"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ProfileChips } from "@/components/ProfileChips";
import { TownSelect } from "@/components/TownSelect";
import { useLanguage } from "@/context/LanguageContext";
import {
  EMPTY_BIRTH_FORM,
  MIN_YEAR,
  daysInMonth,
  validateBirthForm,
  type BirthFieldErrors,
  type BirthFormValues,
} from "@/lib/birthForm";
import { MONTH_NAMES } from "@/lib/i18n";
import type { BirthRequest } from "@/lib/types";

export { EMPTY_BIRTH_FORM, type BirthFormValues } from "@/lib/birthForm";

interface BirthFormProps {
  values: BirthFormValues;
  onChange: (values: BirthFormValues) => void;
  onSubmit: (request: BirthRequest, options: { save: boolean }) => void;
  loading: boolean;
}

export function BirthForm({ values, onChange, onSubmit, loading }: BirthFormProps) {
  const { t } = useLanguage();
  const [errors, setErrors] = useState<BirthFieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [save, setSave] = useState(false);

  function change(next: BirthFormValues) {
    onChange(next);
    if (submitted) setErrors(validateBirthForm(next).errors);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return; // a chart is already being calculated
    setSubmitted(true);
    const result = validateBirthForm(values);
    setErrors(result.errors);
    if (result.request) onSubmit(result.request, { save });
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={loading} className="glass no-print rounded-3xl border-t-2 border-t-amber-500/40 p-4 sm:p-8">
      <h2 className="font-sinhala mb-5 text-center text-base leading-relaxed font-semibold text-balance text-gold-200 sm:mb-6 sm:text-lg">{t.formTitle}</h2>

      <ProfileChips
        className="mb-6"
        onSelect={change}
        onNew={() => {
          onChange(EMPTY_BIRTH_FORM);
          setErrors({});
          setSubmitted(false);
          setSave(false);
        }}
      />

      <BirthFields idPrefix="birth" values={values} errors={errors} onChange={change} />

      {/* The whole card toggles the checkbox; it saves to localStorage and the database (lib/profiles.ts). */}
      <label
        htmlFor="birth-save"
        className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-cosmic-900/40 px-4 py-2.5 transition-colors duration-150 hover:border-gold-400/40 has-[:checked]:border-gold-400/50 has-[:checked]:bg-maroon-900/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-300/70"
      >
        <span className="relative mt-[3px] flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            id="birth-save"
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
            aria-describedby="birth-save-hint"
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gold-400/60 bg-cosmic-950/70 transition-colors duration-150 checked:border-gold-300 checked:bg-gradient-to-b checked:from-gold-300 checked:to-gold-500 focus-visible:outline-none"
          />
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute h-3.5 w-3.5 text-maroon-800 opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4.5 10.5 3.5 3.5 7.5-8" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-sm leading-relaxed text-indigo-50">{t.saveProfile}</span>
          <span id="birth-save-hint" className="block text-xs leading-relaxed text-indigo-200/70">
            {t.saveProfileHint}
          </span>
        </span>
      </label>

      {/* Phones: full-width, primary on top. sm+: one row, primary on the right. */}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => {
            onChange(EMPTY_BIRTH_FORM);
            setErrors({});
            setSubmitted(false);
          }}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/15 px-5 text-sm leading-relaxed text-indigo-100/80 transition duration-150 hover:border-gold-400/40 hover:text-gold-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 active:scale-[0.98] sm:w-auto motion-reduce:transform-none"
        >
          {t.reset}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="font-sinhala inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl border border-gold-400/60 bg-gradient-to-b from-maroon-500 to-maroon-700 px-4 text-[15px] leading-snug font-semibold text-gold-100 sm:px-7 shadow-lg shadow-maroon-900/50 transition duration-200 hover:-translate-y-px hover:border-gold-300 hover:from-maroon-500 hover:to-maroon-600 hover:shadow-maroon-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-900 active:translate-y-0 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-75 sm:w-auto sm:whitespace-nowrap motion-reduce:transform-none"
        >
          {loading && <Spinner />}
          {loading ? t.calculating : t.submit}
        </button>
      </div>
    </form>
  );
}

/**
 * The birth-detail fields on their own (name, gender, date, time, town), so they
 * can be reused, e.g. twice on the porondam page. `idPrefix` keeps ids unique.
 */
export function BirthFields({
  idPrefix,
  values,
  errors,
  onChange,
}: {
  idPrefix: string;
  values: BirthFormValues;
  errors: BirthFieldErrors;
  onChange: (values: BirthFormValues) => void;
}) {
  const { lang, t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - MIN_YEAR + 1 }, (_, i) => currentYear - i);
  const maxDay = values.month ? daysInMonth(Number(values.year), Number(values.month)) : 31;
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const id = (name: string) => `${idPrefix}-${name}`;

  function update<K extends keyof BirthFormValues>(key: K, value: BirthFormValues[K]) {
    const next = { ...values, [key]: value };
    if ((key === "month" || key === "year") && next.day && next.month && Number(next.day) > daysInMonth(Number(next.year), Number(next.month))) {
      next.day = "";
    }
    onChange(next);
  }

  const err = (key: keyof BirthFieldErrors) => (errors[key] ? (t[errors[key]!] as string) : undefined);

  return (
    <div className="grid gap-5">
      <Field label={t.fullName} name={id("name")} htmlFor={id("name")} error={err("name")}>
        <input
          id={id("name")}
          className="field"
          autoComplete="name"
          maxLength={120}
          // The example name follows the chosen gender (e.g. the bride's form shows a female name).
          placeholder={values.gender === "female" ? t.fullNamePlaceholderFemale : t.fullNamePlaceholder}
          value={values.name}
          aria-invalid={!!errors.name || undefined}
          aria-describedby={describedBy(id("name"), !!errors.name)}
          onChange={(e) => update("name", e.target.value)}
        />
      </Field>

      <Field label={t.gender} name={id("gender")} error={err("gender")} asGroup>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-labelledby={`${id("gender")}-label`}
          aria-describedby={describedBy(id("gender"), !!errors.gender)}
        >
          {(["male", "female", "other"] as const).map((g) => (
            <label
              key={g}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-[15px] leading-relaxed transition-colors duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold-300/80 ${
                values.gender === g
                  ? "border-gold-400 bg-maroon-700/50 text-gold-100"
                  : "border-white/15 bg-cosmic-900/60 text-indigo-100 hover:border-amber-400/60"
              }`}
            >
              <input type="radio" name={id("gender")} value={g} className="sr-only" checked={values.gender === g} onChange={() => update("gender", g)} />
              {t.genders[g]}
            </label>
          ))}
        </div>
      </Field>

      <Field label={t.dateOfBirth} name={id("date")} error={err("date")} asGroup>
        <div className="grid grid-cols-[1.1fr_1.3fr_1fr] gap-2" role="group" aria-labelledby={`${id("date")}-label`}>
          <select aria-label={t.year} className="field" value={values.year} aria-invalid={!!errors.date || undefined} aria-describedby={describedBy(id("date"), !!errors.date)} onChange={(e) => update("year", e.target.value)}>
            <option value="">{t.year}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select aria-label={t.month} className="field" value={values.month} aria-invalid={!!errors.date || undefined} aria-describedby={describedBy(id("date"), !!errors.date)} onChange={(e) => update("month", e.target.value)}>
            <option value="">{t.month}</option>
            {MONTH_NAMES[lang].map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select aria-label={t.day} className="field" value={values.day} aria-invalid={!!errors.date || undefined} aria-describedby={describedBy(id("date"), !!errors.date)} onChange={(e) => update("day", e.target.value)}>
            <option value="">{t.day}</option>
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field label={t.timeOfBirth} name={id("time")} error={err("time")} hint={t.timeHint} asGroup>
        <div className="flex items-center gap-2 sm:gap-3" role="group" aria-labelledby={`${id("time")}-label`}>
          <select aria-label={t.hour} className="field field-compact min-w-0 flex-1" value={values.hour} aria-invalid={!!errors.time || undefined} aria-describedby={describedBy(id("time"), !!errors.time, true)} onChange={(e) => update("hour", e.target.value)}>
            <option value="">{t.hour}</option>
            {hours.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}
              </option>
            ))}
          </select>
          <span className="shrink-0 text-lg font-semibold text-gold-300" aria-hidden>
            :
          </span>
          <select aria-label={t.minute} className="field field-compact min-w-0 flex-[1.3]" value={values.minute} aria-invalid={!!errors.time || undefined} aria-describedby={describedBy(id("time"), !!errors.time, true)} onChange={(e) => update("minute", e.target.value)}>
            <option value="">{t.minute}</option>
            {Array.from({ length: 60 }, (_, i) => i).map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>

          <Segmented
            label={`${t.am} / ${t.pm}`}
            value={values.period}
            options={[
              { value: "AM", label: t.am },
              { value: "PM", label: t.pm },
            ]}
            onChange={(v) => update("period", v)}
          />
        </div>
      </Field>

      <Field label={t.placeOfBirth} name={id("place")} htmlFor={id("place")} error={err("place")} hint={t.placeHint}>
        <TownSelect
          id={id("place")}
          value={values.townId}
          onChange={(town) => update("townId", town)}
          invalid={!!errors.place}
          describedBy={describedBy(id("place"), !!errors.place, true)}
        />
      </Field>
    </div>
  );
}

/**
 * Label + control + hint/error. `name` is the base for the ids `${name}-label`,
 * `${name}-hint` and `${name}-error`, which controls reference via
 * aria-labelledby / aria-describedby (see describedBy()).
 */
function Field({
  label,
  name,
  htmlFor,
  error,
  hint,
  className,
  asGroup,
  children,
}: {
  label: string;
  name: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  asGroup?: boolean;
  children: ReactNode;
}) {
  const Label = asGroup ? "span" : "label";
  return (
    <div className={className}>
      <Label id={`${name}-label`} {...(asGroup ? {} : { htmlFor })} className="mb-2 block text-[15px] leading-relaxed font-medium text-gold-100/90">
        {label}
      </Label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-2 text-[13px] leading-relaxed text-indigo-200/70">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] leading-relaxed text-red-300">
          <span aria-hidden>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/** aria-describedby for a field: its error when shown, otherwise its hint (if any). */
function describedBy(name: string, hasError: boolean, hasHint = false): string | undefined {
  if (hasError) return `${name}-error`;
  return hasHint ? `${name}-hint` : undefined;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 rounded-xl border border-white/15 bg-cosmic-900/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-2.5 py-1.5 text-[15px] leading-relaxed whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/80 sm:px-3 ${
            value === o.value ? "bg-gold-400 font-semibold text-cosmic-950" : "text-indigo-100/80 hover:text-gold-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
