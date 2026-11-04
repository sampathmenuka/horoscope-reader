import { ApiError, FinishReason, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { ZodType } from "zod";

/**
 * Shared Gemini plumbing for the API routes and server actions.
 * Server-side only: reads the API key from the environment.
 */

export const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
// "-latest" aliases follow Google's current Flash model; pinned versions get retired
// (gemini-2.5-flash is no longer available to new API keys). Override with GEMINI_DAILY_MODEL.
export const FAST_MODEL = process.env.GEMINI_DAILY_MODEL ?? "gemini-flash-latest";

export function geminiKey(): string | undefined {
  if (process.env.PREDICTION_ENGINE === "rules") return undefined;
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined;
}

/** House style for every Sinhala text the app asks Gemini to write. */
export const SINHALA_STYLE = `Write in natural, traditional Sri Lankan Sinhala as used in Sinhala newspaper horoscope columns and by village astrologers — warm and idiomatic, never stiff or translated from English. Prefer everyday phrases such as "කරන කියන කටයුතු සාර්ථක වේ", "හිතමිතුරන්ගේ සහ රැකියා ස්ථානයේ අයගේ සහයෝගය හිමිවේ", "මුදල් ලැබීම් ඇත", "පවුලේ සාමය රැකේ", "සෞඛ්‍යය ගැන සැලකිලිමත් වන්න". Never use machine-translated or bookish words such as "සගයන්" (use "හිතමිතුරන්" or "රැකියා ස්ථානයේ අය") or "ඵලදායිතාව" (say "කරන කියන කටයුතු සාර්ථක වන"). Use correct Sinhala Unicode.`;

interface GenerateJsonOptions<T> {
  key: string;
  model?: string;
  system: string;
  prompt: string;
  /** JSON schema sent to Gemini (structured output). */
  jsonSchema: Record<string, unknown>;
  /** Zod schema the parsed response must satisfy. */
  validate: ZodType<T>;
  maxOutputTokens?: number;
  /** Writing tasks need little reasoning; low thinking keeps responses fast. */
  thinkingLevel?: ThinkingLevel;
  /**
   * Give up after this long and let the caller use its rule-based fallback.
   * Gemini can take minutes under heavy demand; visitors shouldn't wait that long.
   */
  timeoutMs?: number;
}

/** One structured-output call: returns validated JSON or throws with a clear reason. */
export async function generateJson<T>({
  key,
  model = DEFAULT_MODEL,
  system,
  prompt,
  jsonSchema,
  validate,
  maxOutputTokens = 32768,
  thinkingLevel = ThinkingLevel.LOW,
  timeoutMs = 45_000,
}: GenerateJsonOptions<T>): Promise<T> {
  // One retry for transient overloads (429 / 5xx "high demand"), each attempt time-boxed.
  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      timeout: timeoutMs,
      retryOptions: { attempts: 2, initialDelay: 1.5, maxDelay: 5, httpStatusCodes: [429, 500, 502, 503] },
    },
  });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
      maxOutputTokens,
      thinkingConfig: { thinkingLevel },
    },
  });

  const blocked = response.promptFeedback?.blockReason;
  if (blocked) throw new Error(`Gemini blocked the prompt (${blocked})`);
  const finish = response.candidates?.[0]?.finishReason;
  if (finish === FinishReason.MAX_TOKENS) throw new Error("Gemini response was truncated at maxOutputTokens");
  if (finish && finish !== FinishReason.STOP) throw new Error(`Gemini stopped early (${finish})`);
  if (!response.text) throw new Error("Gemini returned an empty response");

  return validate.parse(JSON.parse(response.text));
}

export function logGeminiError(scope: string, error: unknown): void {
  if (error instanceof ApiError) {
    console.error(`[${scope}] Gemini API error ${error.status}:`, error.message);
  } else {
    console.error(`[${scope}] Gemini failed, using the fallback:`, error);
  }
}
