/** Latest uploads for the video block on /news.
 *  Public YouTube channel RSS (no API key). Cached by Next for 30 minutes (ISR).
 *  A failed pull returns an empty list and the block hides itself.
 */
import { channelIdFromEnv } from "@/lib/youtubeChannel";
import { readCatalog } from "@/lib/studio/catalog";

export type RssVideo = {
  id: string;
  title: string;
  publishedAt: string;
  dateLabel: string;
  thumbnailUrl: string;
  kind: "video" | "short";
  href: string;
};

export const VIDEO_REVALIDATE = 1800;

/** Videos that have their own coded page under /watch. */
const WATCH_PAGES: Record<string, string> = {
  evW52aF0x1I: "/watch/grok-bot-best-model",
};

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

const pick = (xml: string, re: RegExp) => decode(xml.match(re)?.[1] ?? "");

function dateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });
}

export async function getChannelRss(limit = 6): Promise<RssVideo[]> {
  const channelId = channelIdFromEnv();
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
      next: { revalidate: VIDEO_REVALIDATE },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    const videos: RssVideo[] = [];
    for (const entry of entries) {
      const id = pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/);
      const title = pick(entry, /<title>([\s\S]*?)<\/title>/);
      const publishedAt = pick(entry, /<published>([^<]+)<\/published>/);
      const link = pick(entry, /<link rel="alternate" href="([^"]+)"/);
      if (!id || !title) continue;
      const kind = link.includes("/shorts/") ? "short" : "video";
      videos.push({
        id,
        title: title.replace(/\s*#shorts\b/gi, "").trim(),
        publishedAt,
        dateLabel: dateLabel(publishedAt),
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        kind,
        href: WATCH_PAGES[id] ?? (kind === "short" ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`),
      });
    }
    return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
  } catch {
    return [];
  }
}

/** Channel RSS plus videos added in Creator Studio (each has a /watch page), newest first, de-duplicated by YouTube id. */
export async function getNewsVideos(limit = 6): Promise<RssVideo[]> {
  const [rss, catalog] = await Promise.all([getChannelRss(15), readCatalog().catch(() => null)]);
  const studio: RssVideo[] = (catalog?.clips ?? []).map((clip) => ({
    id: clip.youtubeId || clip.id,
    title: clip.title,
    publishedAt: clip.publishedAt,
    dateLabel: dateLabel(clip.publishedAt),
    thumbnailUrl: clip.thumbnailUrl || (clip.youtubeId ? `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg` : ""),
    kind: "video" as const,
    href: `/watch/${clip.slug}`,
  }));
  const byId = new Map<string, RssVideo>();
  for (const v of rss) byId.set(v.id, v);
  for (const v of studio) byId.set(v.id, { ...(byId.get(v.id) ?? {}), ...v, kind: byId.get(v.id)?.kind ?? v.kind });
  return [...byId.values()]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
