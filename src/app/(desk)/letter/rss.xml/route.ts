import { renderLetterRss } from "@/lib/letter/rss";
import { listIssues } from "@/lib/letter";

export const dynamic = "force-static";

export function GET() {
  const xml = renderLetterRss(listIssues());
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
