import type { Dictionary, Gender } from "@/lib/i18n";
import { getTown } from "@/lib/sriLankaTowns";
import type { BirthRequest } from "@/lib/types";

export interface BirthFormValues {
  name: string;
  gender: Gender | "";
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
  townId: string;
}

export const EMPTY_BIRTH_FORM: BirthFormValues = {
  name: "",
  gender: "",
  year: "",
  month: "",
  day: "",
  hour: "",
  minute: "",
  period: "AM",
  townId: "",
};

export type BirthFieldErrors = Partial<Record<"name" | "gender" | "date" | "time" | "place", keyof Dictionary>>;

export const MIN_YEAR = 1900;

export function daysInMonth(year: number, month: number): number {
  // Without a year yet, allow 29 for February so a leap-day birth can be chosen first.
  if (!year) return month === 2 ? 29 : new Date(2001, month, 0).getDate();
  return new Date(year, month, 0).getDate();
}

/** 12-hour clock (පෙ.ව. / ප.ව.) to 24-hour. */
export function to24h(values: BirthFormValues): number {
  const hour = Number(values.hour);
  if (values.period === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

export function validateBirthForm(values: BirthFormValues): { errors: BirthFieldErrors; request?: BirthRequest } {
  const errors: BirthFieldErrors = {};
  if (!values.name.trim()) errors.name = "errNameRequired";
  if (!values.gender) errors.gender = "errGenderRequired";

  const y = Number(values.year);
  const m = Number(values.month);
  const d = Number(values.day);
  if (!values.year || !values.month || !values.day) {
    errors.date = "errDateRequired";
  } else if (d > daysInMonth(y, m)) {
    errors.date = "errDateInvalid";
  }

  const hourOk = values.hour !== "" && Number(values.hour) >= 1 && Number(values.hour) <= 12;
  if (!hourOk || values.minute === "") errors.time = "errTimeRequired";

  if (!errors.date && !errors.time) {
    const birth = new Date(y, m - 1, d, to24h(values), Number(values.minute));
    if (birth.getTime() > Date.now() + 24 * 3600 * 1000) errors.date = "errDateFuture";
  }

  const town = getTown(values.townId);
  if (!town) errors.place = "errPlaceRequired";

  if (Object.keys(errors).length || !town || !values.gender) return { errors };

  return {
    errors,
    request: {
      name: values.name.trim(),
      gender: values.gender,
      year: y,
      month: m,
      day: d,
      hour: to24h(values),
      minute: Number(values.minute),
      lat: town.lat,
      lon: town.lon,
      place: town.en,
    },
  };
}
