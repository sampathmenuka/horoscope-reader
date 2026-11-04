import { z } from "zod";
import { FAST_MODEL, SINHALA_STYLE, generateJson, geminiKey, logGeminiError } from "@/lib/gemini";
import { NAKSHATRA_NAMES, RASHI_NAMES, type Lang } from "@/lib/i18n";
import { PorondamResultSchema, ruleSummary, verdictOf, type PorondamResponse, type PorondamResult } from "@/lib/porondam";
import { BirthRequestSchema } from "@/lib/types";

export const maxDuration = 120;

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const RequestSchema = z.object({
  bride: BirthRequestSchema,
  groom: BirthRequestSchema,
  lang: z.enum(["si", "en"]),
});

const SummarySchema = z.object({ paragraphs: z.array(z.string().min(10)).min(1).max(5) });

const SYSTEM_PROMPT = `You are an experienced, kind Sri Lankan astrologer explaining a porondam (horoscope matching) result to a family.

Use only the facts given: each person's birth star, pada and Moon sign, which porondam agree or not (Rajju, Vedha and Nadi are the major ones), the overall verdict, and Kuja Dosha. Write 2-3 short paragraphs about the couple's harmony: strengths first, then any concerns with gentle, practical advice and traditional remedies where appropriate.

Never declare that the couple must not marry, never predict divorce, death or illness, and remind them that a full chart comparison by a qualified astrologer is wise before a decision.`;

function digest(r: PorondamResult): string {
  const person = (label: string, p: PorondamResult["bride"]) =>
    `${label}: ${p.name}, birth star ${NAKSHATRA_NAMES.en[p.nakshatra.index]} pada ${p.nakshatra.pada}, Moon in ${RASHI_NAMES.en[p.moon_rashi_index]}, Lagna ${RASHI_NAMES.en[p.lagna_rashi_index]}, Kuja Dosha ${p.kuja_dosha ? "present" : "absent"}`;
  return [
    person("Bride", r.bride),
    person("Groom", r.groom),
    `Score: ${r.passed}/${r.total} (${r.percentage}%), verdict: ${verdictOf(r)}`,
    "Porondam:",
    ...r.items.map((i) => `- ${i.name.en}${i.critical ? " [major]" : ""}: ${i.passed ? "agrees" : "does not agree"} — ${i.detail.en}`),
    r.kuja_dosha_note ? `Kuja Dosha: ${r.kuja_dosha_note.en}` : "Kuja Dosha: none",
  ].join("\n");
}

async function geminiSummary(result: PorondamResult, lang: Lang, key: string): Promise<string[]> {
  const language =
    lang === "si"
      ? `Write in Sinhala (සිංහල). ${SINHALA_STYLE} Use the Sinhala porondam names (නැකැත්, ගණ, රජ්ජු, වේධ, නාඩි, ...).`
      : "Write in clear, warm English.";
  const parsed = await generateJson({
    key,
    model: FAST_MODEL,
    system: SYSTEM_PROMPT,
    prompt: `${language}\n\n<porondam>\n${digest(result)}\n</porondam>`,
    jsonSchema: {
      type: "object",
      properties: { paragraphs: { type: "array", items: { type: "string" } } },
      required: ["paragraphs"],
    },
    validate: SummarySchema,
    maxOutputTokens: 8192,
  });
  return parsed.paragraphs.map((p) => p.trim());
}

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_input", detail: parsed.error?.issues }, { status: 400 });
  const { bride, groom, lang } = parsed.data;

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/porondam`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bride, groom }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[api/porondam] backend unreachable:", error);
    return Response.json({ error: "backend_unreachable" }, { status: 502 });
  }
  if (!upstream.ok) {
    return Response.json({ error: upstream.status === 422 ? "invalid_input" : "calc_failed" }, { status: upstream.status === 422 ? 400 : 502 });
  }
  const result = PorondamResultSchema.safeParse(await upstream.json().catch(() => null));
  if (!result.success) {
    console.error("[api/porondam] unexpected backend payload:", result.error.issues);
    return Response.json({ error: "calc_failed" }, { status: 502 });
  }

  let summary: PorondamResponse["summary"] = { paragraphs: ruleSummary(result.data, lang), source: "rules" };
  const key = geminiKey();
  if (key) {
    try {
      summary = { paragraphs: await geminiSummary(result.data, lang, key), source: "llm" };
    } catch (error) {
      logGeminiError("api/porondam", error);
    }
  }

  const body: PorondamResponse = { result: result.data, summary };
  return Response.json(body);
}
