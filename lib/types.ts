import { z } from "zod";
import { PLANET_KEYS, SECTION_KEYS } from "@/lib/i18n";

/* ---------- Saved profiles (lib/profiles.ts, /api/profiles) ---------- */

export const MAX_PROFILES = 12;

const formField = z.string().max(4);

export const SaveProfileSchema = z.object({
  id: z.string().min(1).max(200),
  values: z.object({
    name: z.string().min(1).max(100),
    gender: z.enum(["male", "female", "other", ""]),
    year: formField,
    month: formField,
    day: formField,
    hour: formField,
    minute: formField,
    period: z.enum(["AM", "PM"]),
    townId: z.string().max(100),
  }),
  lagnaIndex: z.number().int().min(0).max(11).optional(),
});

/* ---------- Chart (mirrors backend/main.py ChartResponse) ---------- */

const planetKey = z.enum(PLANET_KEYS);
const bilingual = z.object({ en: z.string(), si: z.string() });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/);

export const NakshatraInfoSchema = z.object({
  index: z.number().int().min(0).max(26),
  name: bilingual,
  pada: z.number().int().min(1).max(4),
  lord: planetKey,
  degree_in_nakshatra: z.number(),
  fraction_elapsed: z.number(),
});

export const PlanetPositionSchema = z.object({
  key: planetKey,
  name: bilingual,
  longitude: z.number(),
  rashi_index: z.number().int().min(0).max(11),
  rashi: bilingual,
  degree_in_sign: z.number(),
  house: z.number().int().min(1).max(12),
  navamsha_rashi_index: z.number().int().min(0).max(11),
  navamsha_house: z.number().int().min(1).max(12),
  retrograde: z.boolean(),
  dignity: z.enum(["exalted", "debilitated", "own", "neutral"]),
  nakshatra: NakshatraInfoSchema,
});

export const HouseBoxSchema = z.object({
  house: z.number().int().min(1).max(12),
  rashi_index: z.number().int().min(0).max(11),
  rashi: bilingual,
  occupants: z.array(planetKey),
});

export const ChartGridSchema = z.object({
  lagna_rashi_index: z.number().int().min(0).max(11),
  houses: z.array(HouseBoxSchema).length(12),
});

export const DashaPeriodSchema = z.object({
  lord: planetKey,
  name: bilingual,
  start: isoDate,
  end: isoDate,
  years: z.number(),
  is_current: z.boolean(),
});

export const MahaDashaSchema = DashaPeriodSchema.extend({
  antar_dashas: z.array(DashaPeriodSchema),
});

const TransitSnapshotSchema = z.object({
  key: planetKey,
  rashi_index: z.number().int().min(0).max(11),
  rashi: bilingual,
  retrograde: z.boolean(),
  house_from_moon: z.number().int().min(1).max(12),
  house_from_lagna: z.number().int().min(1).max(12),
});

export const ApalaSchema = z.object({
  as_of: isoDate,
  saturn: TransitSnapshotSchema,
  rahu: TransitSnapshotSchema,
  items: z.array(
    z.object({
      key: z.string(),
      planet: planetKey,
      severity: z.enum(["high", "medium"]),
      title: bilingual,
      detail: bilingual,
    }),
  ),
  active: z.boolean(),
});

export const ChartResponseSchema = z.object({
  birth: z.object({
    name: z.string(),
    gender: z.enum(["male", "female", "other"]),
    place: z.string().nullable(),
    lat: z.number(),
    lon: z.number(),
    local_datetime: z.string(),
    utc_datetime: z.string(),
    utc_offset: z.string(),
  }),
  julian_day_ut: z.number(),
  ayanamsha: z.number(),
  ayanamsha_name: z.string(),
  ephemeris: z.string(),
  lagna: z.object({
    longitude: z.number(),
    rashi_index: z.number().int().min(0).max(11),
    rashi: bilingual,
    degree_in_sign: z.number(),
    lord: planetKey,
    nakshatra: NakshatraInfoSchema,
    navamsha_rashi_index: z.number().int().min(0).max(11),
    navamsha_rashi: bilingual,
    navamsha_lord: planetKey,
  }),
  moon_sign: HouseBoxSchema,
  rashi_lord: planetKey,
  nakshatra: NakshatraInfoSchema,
  planets: z.array(PlanetPositionSchema).length(9),
  rashi_chart: ChartGridSchema,
  navamsha_chart: ChartGridSchema,
  dasha: z.object({
    as_of: isoDate,
    birth_balance: z.object({
      lord: planetKey,
      years: z.number().int(),
      months: z.number().int(),
      days: z.number().int(),
      total_years: z.number(),
    }),
    maha_dashas: z.array(MahaDashaSchema),
    current_maha: DashaPeriodSchema.nullable(),
    current_antar: DashaPeriodSchema.nullable(),
  }),
  apala: ApalaSchema,
});

export type NakshatraInfo = z.infer<typeof NakshatraInfoSchema>;
export type PlanetPosition = z.infer<typeof PlanetPositionSchema>;
export type HouseBox = z.infer<typeof HouseBoxSchema>;
export type ChartGrid = z.infer<typeof ChartGridSchema>;
export type DashaPeriod = z.infer<typeof DashaPeriodSchema>;
export type MahaDasha = z.infer<typeof MahaDashaSchema>;
export type ChartResponse = z.infer<typeof ChartResponseSchema>;
export type Apala = z.infer<typeof ApalaSchema>;

/* ---------- Birth request (sent to /api/chart) ---------- */

export const BirthRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  gender: z.enum(["male", "female", "other"]),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  place: z.string().max(120).optional(),
});
export type BirthRequest = z.infer<typeof BirthRequestSchema>;

/* ---------- Prediction ---------- */

export const PredictionSectionSchema = z.object({
  paragraphs: z.array(z.string().min(1)).min(1),
  highlights: z.array(z.string()),
});

export const PredictionBodySchema = z.object({
  sections: z.object({
    summary: PredictionSectionSchema,
    personality: PredictionSectionSchema,
    career: PredictionSectionSchema,
    marriage: PredictionSectionSchema,
    future: PredictionSectionSchema,
  }),
  remedies: z.array(z.string().min(1)).min(1),
});

export type PredictionSection = z.infer<typeof PredictionSectionSchema>;
export type PredictionBody = z.infer<typeof PredictionBodySchema>;

export interface Prediction extends PredictionBody {
  lang: "si" | "en";
  source: "llm" | "rules";
  model?: string;
  generatedAt: string;
}

export const PredictRequestSchema = z.object({
  chart: ChartResponseSchema,
  lang: z.enum(["si", "en"]),
});

// Compile-time guard that the schema's section keys match the UI's SECTION_KEYS.
const _sectionKeysCheck: Record<(typeof SECTION_KEYS)[number], unknown> = PredictionBodySchema.shape.sections.shape;
void _sectionKeysCheck;
