import { createHash, timingSafeEqual } from "node:crypto";
import { redisFromEnv } from "@/lib/shop/idempotency";
import { TOTAL_KEY, dayKey, lastNyDates, nyDate } from "@/lib/shop/visits";

/**
 * POST: count one /shop page load (INCR total + today's NY-date key). Stores nothing personal.
 * GET:  read counts (total + last 30 days). Requires
 *       `Authorization: Bearer ${CRON_SECRET}` or `Authorization: Bearer ${SHOP_STATS_KEY}`
 *       (SHOP_STATS_KEY is read-only for this endpoint; it does not authorize other routes).
 */
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function POST() {
  const redis = redisFromEnv();
  if (!redis) return new Response(null, { status: 204, headers: noStore });
  try {
    const day = dayKey(nyDate());
    const p = redis.pipeline();
    p.incr(TOTAL_KEY);
    p.incr(day);
    p.expire(day, 60 * 60 * 24 * 400);
    await p.exec();
  } catch {
    // counting is best-effort; never break the page
  }
  return new Response(null, { status: 204, headers: noStore });
}

function bearerMatches(req: Request, secret: string | undefined): boolean {
  const given = req.headers.get("authorization");
  if (!secret?.trim() || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(`Bearer ${secret.trim()}`).digest();
  return timingSafeEqual(a, b);
}

function authorized(req: Request) {
  // Evaluate both so timing does not short-circuit on the first match.
  const cronOk = bearerMatches(req, process.env.CRON_SECRET);
  const statsOk = bearerMatches(req, process.env.SHOP_STATS_KEY);
  return cronOk || statsOk;
}

export async function GET(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401, headers: noStore });
  const redis = redisFromEnv();
  if (!redis) return Response.json({ error: "redis not configured" }, { status: 503, headers: noStore });
  const dates = lastNyDates(30);
  const vals = await redis.mget<(number | string | null)[]>(TOTAL_KEY, ...dates.map(dayKey));
  const [total, ...days] = vals.map((v) => Number(v ?? 0));
  return Response.json(
    { total, last30: days.reduce((s, n) => s + n, 0), days: dates.map((date, i) => ({ date, visits: days[i] })) },
    { headers: noStore },
  );
}
