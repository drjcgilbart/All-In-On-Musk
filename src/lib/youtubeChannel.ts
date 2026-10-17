/** Latest uploads for Journal Videos on /watch.
 *  YouTube Data API v3. The key stays on the server.
 *  Put YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in `.env.local` on this PC.
 *  On Vercel, add the same names to the all-in-on-musk project, then redeploy.
 *  See `.env.example`. Results are remembered for a few minutes so repeat
 *  visits do not spend the daily quota. A failed refresh keeps the last list.
 */

export type ChannelVideo = {
  id: string;
  title: string;
  publishedAt: string;
  dateLabel: string;
  thumbnailUrl: string;
  duration: string;
  kind: "video" | "short";
};

export type ChannelFeed = {
  videos: ChannelVideo[];
  stale: boolean;
  unavailable: boolean;
};

const HANDLE = "allinonmusk";
const DEFAULT_CHANNEL_ID = "UC5ClTOsb87rCKbW6AuvwVgg";
const TTL = 5 * 60_000;
const API = "https://www.googleapis.com/youtube/v3";

let cache: { at: number; channelId: string; videos: ChannelVideo[] } | null = null;

type Thumbnails = Record<string, { url?: string } | undefined>;

type PlaylistItem = {
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: Thumbnails;
    resourceId?: { videoId?: string };
  };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
};

type VideoDetails = {
  id?: string;
  contentDetails?: { duration?: string };
};

export function channelIdFromEnv() {
  const set = process.env.YOUTUBE_CHANNEL_ID?.trim();
  return set || DEFAULT_CHANNEL_ID;
}

/** YouTube's Videos and Shorts tabs are system playlists derived from the channel id. */
export function systemPlaylistId(channelId: string, tab: "video" | "short") {
  if (!channelId.startsWith("UC") || channelId.length < 4) {
    throw new Error("YOUTUBE_CHANNEL_ID must look like UC…");
  }
  return `${tab === "short" ? "UUSH" : "UULF"}${channelId.slice(2)}`;
}

export function formatRunTime(iso: string) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || "");
  if (!match) return "";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

function dateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

function thumbnail(thumbs?: Thumbnails) {
  if (!thumbs) return "";
  return (
    thumbs.maxres?.url ||
    thumbs.standard?.url ||
    thumbs.high?.url ||
    thumbs.medium?.url ||
    thumbs.default?.url ||
    ""
  );
}

async function youtubeGet(path: string, params: Record<string, string>, key: string) {
  const url = new URL(API + path);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", key);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`YouTube ${response.status}`);
  return response.json() as Promise<{ items?: unknown[] }>;
}

async function listPlaylist(playlistId: string, kind: ChannelVideo["kind"], key: string) {
  const body = await youtubeGet(
    "/playlistItems",
    { part: "snippet,contentDetails", playlistId, maxResults: "15" },
    key,
  );
  const items = Array.isArray(body.items) ? (body.items as PlaylistItem[]) : [];
  const videos: ChannelVideo[] = [];
  for (const item of items) {
    const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || "";
    const title = item.snippet?.title?.trim() || "";
    const publishedAt = item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || "";
    if (!id || !title || title === "Private video" || title === "Deleted video") continue;
    videos.push({
      id,
      title,
      publishedAt,
      dateLabel: dateLabel(publishedAt),
      thumbnailUrl: thumbnail(item.snippet?.thumbnails),
      duration: "",
      kind,
    });
  }
  return videos;
}

async function fillDurations(videos: ChannelVideo[], key: string) {
  const ids = [...new Set(videos.map((video) => video.id))].slice(0, 50);
  if (ids.length === 0) return videos;
  const body = await youtubeGet("/videos", { part: "contentDetails", id: ids.join(",") }, key);
  const rows = Array.isArray(body.items) ? (body.items as VideoDetails[]) : [];
  const byId = new Map(rows.map((row) => [row.id || "", formatRunTime(row.contentDetails?.duration || "")]));
  return videos.map((video) => ({ ...video, duration: byId.get(video.id) || "" }));
}

export async function fetchChannelVideos(now = Date.now()): Promise<ChannelFeed> {
  const key = process.env.YOUTUBE_API_KEY?.trim() || "";
  const channelId = channelIdFromEnv();
  if (!key) return { videos: [], stale: false, unavailable: true };
  if (cache && cache.channelId === channelId && now - cache.at < TTL) {
    return { videos: cache.videos, stale: false, unavailable: false };
  }
  try {
    const [videos, shorts] = await Promise.all([
      listPlaylist(systemPlaylistId(channelId, "video"), "video", key),
      listPlaylist(systemPlaylistId(channelId, "short"), "short", key),
    ]);
    const seen = new Set<string>();
    const merged = [...videos, ...shorts]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .filter((video) => {
        if (seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
      })
      .slice(0, 24);
    const withTime = await fillDurations(merged, key);
    cache = { at: now, channelId, videos: withTime };
    return { videos: withTime, stale: false, unavailable: false };
  } catch {
    if (cache && cache.channelId === channelId) return { videos: cache.videos, stale: true, unavailable: false };
    return { videos: [], stale: false, unavailable: true };
  }
}

export const channelHandle = HANDLE;
