import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { refreshMuskToday } from "@/lib/muskToday";

/**
 * Refreshes the Musk Today desk.
 * Vercel Cron hits GET daily at 09:15 UTC (4:15 AM EST, 5:15 AM EDT) and sends
 * `Authorization: Bearer ${CRON_SECRET}`. One X read per run. A failed pull
 * returns 200 so the platform is not invited to retry and spend another credit.
 * If CRON_SECRET is missing, this door stays shut and X is not called.
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

const unauthorized = () => new Response("Unauthorized", { status: 401 });

async function run() {
  const report = await refreshMuskToday();
  if (report.saved) revalidatePath("/musk-today");
  return Response.json({ ...report, at: new Date().toISOString() });
}

export async function GET(req: Request) {
  return cronOk(req) ? run() : unauthorized();
}

export async function POST(req: Request) {
  return cronOk(req) ? run() : unauthorized();
}
