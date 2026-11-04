import { BirthRequestSchema, ChartResponseSchema } from "@/lib/types";
import type { ErrorCode } from "@/lib/i18n";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

function fail(code: ErrorCode, status: number, detail?: unknown) {
  return Response.json({ error: code, detail }, { status });
}

/** Validates birth details and proxies them to the FastAPI calculation service. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_input", 400);
  }

  const parsed = BirthRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("invalid_input", 400, parsed.error.issues);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_URL}/api/chart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    console.error("[api/chart] backend unreachable:", error);
    return fail("backend_unreachable", 502);
  }

  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return fail(upstream.status === 422 ? "invalid_input" : "calc_failed", upstream.status === 422 ? 400 : 502, payload);
  }

  const chart = ChartResponseSchema.safeParse(payload);
  if (!chart.success) {
    console.error("[api/chart] unexpected backend payload:", chart.error.issues);
    return fail("calc_failed", 502);
  }
  return Response.json(chart.data);
}
