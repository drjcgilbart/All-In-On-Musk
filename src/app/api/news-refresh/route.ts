import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

/**
 * Refreshes the news desk.
 * - Vercel Cron hits GET daily (10:00 UTC = 6 AM ET) and sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 * - A manual refresh POSTs the NEWS_REFRESH_PASSWORD (JSON `{ "password": "…" }` or `x-refresh-password` header).
 * Anything else gets 401. If an env var is missing, that way in is closed.
 */
export const dynamic = "force-dynamic";

function same(given: string | null | undefined, expected: string | undefined) {
  if (!given || !expected) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function cronOk(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return same(req.headers.get("authorization"), `Bearer ${secret}`);
}

function refresh() {
  for (const p of ["/", "/news", "/markets", "/merger", "/machines/[slug]"]) revalidatePath(p, p.includes("[") ? "page" : undefined);
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}

const unauthorized = () => new Response("Unauthorized", { status: 401 });

export async function GET(req: Request) {
  return cronOk(req) ? refresh() : unauthorized();
}

export async function POST(req: Request) {
  if (cronOk(req)) return refresh();
  let password = req.headers.get("x-refresh-password");
  if (!password) {
    const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
    password = typeof body?.password === "string" ? body.password : null;
  }
  return same(password, process.env.NEWS_REFRESH_PASSWORD?.trim()) ? refresh() : unauthorized();
}
