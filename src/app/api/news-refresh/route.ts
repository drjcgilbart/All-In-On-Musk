import { revalidatePath } from "next/cache";

/** Vercel Cron hits this daily (10:00 UTC = 6 AM ET) to refresh the home desk. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  for (const p of ["/", "/news", "/markets", "/machines/[slug]"]) revalidatePath(p, p.includes("[") ? "page" : undefined);
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
