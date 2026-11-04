import { DEFAULT_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { chartDigest, deriveFacts } from "@/lib/chartFacts";
import type { Lang } from "@/lib/i18n";
import { generateRulePrediction } from "@/lib/ruleEngine";
import {
  PredictRequestSchema,
  PredictionBodySchema,
  type ChartResponse,
  type Prediction,
  type PredictionBody,
} from "@/lib/types";

// Long Sinhala readings can take a while to write.
export const maxDuration = 300;

const MODEL = DEFAULT_MODEL;


const sectionSchema = {
  type: "object",
  properties: {
    paragraphs: { type: "array", items: { type: "string" } },
    highlights: { type: "array", items: { type: "string" } },
  },
  required: ["paragraphs", "highlights"],
  additionalProperties: false,
} as const;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    sections: {
      type: "object",
      properties: {
        summary: sectionSchema,
        personality: sectionSchema,
        career: sectionSchema,
        marriage: sectionSchema,
        future: sectionSchema,
      },
      required: ["summary", "personality", "career", "marriage", "future"],
      additionalProperties: false,
    },
    remedies: { type: "array", items: { type: "string" } },
  },
  required: ["sections", "remedies"],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `You are a senior Sri Lankan astrologer (jyotishya) writing a personal Handahana reading in the traditional Sri Lankan style, using sidereal Lahiri positions and whole-sign houses.

The chart has already been calculated precisely. Base every statement on the facts provided; never recompute, invent or alter positions, dates or periods.

Write the five sections:
- summary: Lagna, Navamsha Lagna, birth Nakshatra (Upan Nakatha) and pada, Moon sign (Rashi) and Rashi lord, Lagna lord, and the dasha balance at birth. Highlights are short "label: value" facts.
- personality: from the Lagna, planets in the 1st house, the Lagna lord's placement, the Moon sign and the Nakshatra.
- career: education, career and wealth from the 2nd, 4th, 5th, 10th and 11th houses, their lords and occupants; suggest suitable fields.
- marriage: from the 7th house, its lord and occupants, Venus (and Jupiter for a woman), the Navamsha 7th house and Navamsha placements, and Kuja dosha.
- future: a detailed analysis of the current Maha Dasha and Antar Dasha (with their dates), what the coming sub-periods and the next Maha Dasha bring.
Put culturally appropriate Sri Lankan remedies in "remedies": Bodhi Pooja, graha shanthi, Pirith, sil, dana, devalaya offerings — tied to the relevant planets and weekdays.

Tone: warm, respectful and balanced, as a trusted family astrologer would speak. Present difficulties constructively with guidance, never as fixed fate. Do not predict death, specific illnesses, or anything frightening. Each section should have 3–5 substantial paragraphs.`;

function languageInstruction(lang: Lang): string {
  return lang === "si"
    ? `${SINHALA_STYLE} Write every string in respectful Sinhala (සිංහල) using traditional Sri Lankan astrological terms (ලග්නය, භාවය, මහ දශාව, අන්තර් දශාව, නැකත, ශාන්තිකර්ම). Use Sinhala planet names (රවි, චන්ද්‍ර, කුජ, බුධ, ගුරු, ශුක්‍ර, ශනි, රාහු, කේතු), Sinhala rashi names and Sinhala nakatha names. Do not use English words except proper names.`
    : "Write every string in clear, natural English. Use the traditional names alongside English where helpful, e.g. 'Guru (Jupiter)', 'Mesha (Aries)'.";
}

async function generateWithGemini(chart: ChartResponse, lang: Lang, key: string): Promise<PredictionBody> {
  const digest = chartDigest(deriveFacts(chart));
  return generateJson({
    key,
    model: MODEL,
    system: SYSTEM_PROMPT,
    prompt: `${languageInstruction(lang)}\n\n<chart>\n${digest}\n</chart>`,
    jsonSchema: OUTPUT_SCHEMA,
    validate: PredictionBodySchema,
    // A full five-section reading is long; allow more time before the rule-based fallback.
    timeoutMs: 120_000,
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  const parsed = PredictRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_input", detail: parsed.error.issues }, { status: 400 });
  }
  const { chart, lang } = parsed.data;
  const generatedAt = new Date().toISOString();

  const key = geminiKey();
  if (key) {
    try {
      const prediction: Prediction = {
        ...(await generateWithGemini(chart, lang, key)),
        lang,
        source: "llm",
        model: MODEL,
        generatedAt,
      };
      return Response.json(prediction);
    } catch (error) {
      logGeminiError("api/predict", error);
    }
  }

  try {
    const prediction: Prediction = { ...generateRulePrediction(chart, lang), lang, source: "rules", generatedAt };
    return Response.json(prediction);
  } catch (error) {
    console.error("[api/predict] rule engine failed:", error);
    return Response.json({ error: "predict_failed" }, { status: 500 });
  }
}
