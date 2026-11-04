import { and, desc, eq, notInArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { MAX_PROFILES, SaveProfileSchema } from "@/lib/types";

/**
 * Saved profiles for this visitor. There are no accounts: a random id in an
 * httpOnly cookie owns the rows, and it is only set once someone chooses to save.
 * Without a database these return 503 and the browser keeps its local copy.
 */

const VISITOR_COOKIE = "handahana_visitor";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // seconds
const visitorId = z.uuid();

const unavailable = () => Response.json({ error: "database_unavailable" }, { status: 503 });

async function currentVisitor(): Promise<string | null> {
  const parsed = visitorId.safeParse((await cookies()).get(VISITOR_COOKIE)?.value);
  return parsed.success ? parsed.data : null;
}

function toClient(row: typeof profiles.$inferSelect) {
  return {
    id: row.id,
    values: row.values,
    lagnaIndex: row.lagnaIndex ?? undefined,
    savedAt: row.savedAt.toISOString(),
  };
}

export async function GET() {
  if (!db) return unavailable();
  const visitor = await currentVisitor();
  if (!visitor) return Response.json({ profiles: [] });

  try {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.visitorId, visitor))
      .orderBy(desc(profiles.savedAt))
      .limit(MAX_PROFILES);
    return Response.json({ profiles: rows.map(toClient) });
  } catch (error) {
    console.error("[api/profiles] read failed:", error);
    return unavailable();
  }
}

export async function POST(request: Request) {
  if (!db) return unavailable();

  const parsed = SaveProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_profile" }, { status: 400 });
  const { id, values, lagnaIndex } = parsed.data;

  const existing = await currentVisitor();
  const visitor = existing ?? crypto.randomUUID();
  const savedAt = new Date();

  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(profiles)
        .values({ visitorId: visitor, id, values, lagnaIndex, savedAt })
        .onConflictDoUpdate({
          target: [profiles.visitorId, profiles.id],
          set: { values, lagnaIndex: lagnaIndex ?? null, savedAt },
        });

      // Keep the newest MAX_PROFILES, matching the limit in the browser.
      const newest = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.visitorId, visitor))
        .orderBy(desc(profiles.savedAt))
        .limit(MAX_PROFILES);
      await tx.delete(profiles).where(
        and(
          eq(profiles.visitorId, visitor),
          notInArray(
            profiles.id,
            newest.map((row) => row.id),
          ),
        ),
      );
    });
  } catch (error) {
    console.error("[api/profiles] save failed:", error);
    return unavailable();
  }

  // Refresh the expiry on every save, so active visitors keep their profiles.
  (await cookies()).set(VISITOR_COOKIE, visitor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_MAX_AGE,
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!db) return unavailable();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "invalid_profile" }, { status: 400 });

  const visitor = await currentVisitor();
  if (!visitor) return Response.json({ ok: true });

  try {
    await db.delete(profiles).where(and(eq(profiles.visitorId, visitor), eq(profiles.id, id)));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/profiles] delete failed:", error);
    return unavailable();
  }
}
