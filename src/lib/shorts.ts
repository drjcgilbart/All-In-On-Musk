/** How a /watch page decides a YouTube upload is a Short. */

export type ShortKind = "video" | "short";

export type ShortSignals = {
  kind?: ShortKind | null;
  title?: string | null;
  /** ISO-8601 (PT1M30S) or a clock (m:ss, h:mm:ss). */
  duration?: string | null;
  url?: string | null;
};

export type WatchVideoSource = ShortSignals & {
  dateLabel?: string | null;
  summary?: string | null;
};

const SHORTS_TAG = /#shorts\b/i;

/** YouTube Shorts can run up to about three minutes. */
export const SHORT_MAX_SECONDS = 180;

export function runtimeSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const iso = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value.trim());
  if (iso && (iso[1] || iso[2] || iso[3])) {
    return Number(iso[1] || 0) * 3600 + Number(iso[2] || 0) * 60 + Number(iso[3] || 0);
  }
  const clock = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!clock) return null;
  return Number(clock[1] || 0) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
}

/**
 * Shorts playlist membership, a /shorts/ link, or "#Shorts" in the title.
 * Duration is only a fallback, so a regular video that happens to be short stays 16:9.
 */
export function isYouTubeShort(signals: Array<ShortSignals | null | undefined>, maxSeconds = SHORT_MAX_SECONDS): boolean {
  const list = signals.filter((item): item is ShortSignals => Boolean(item));
  if (list.some((item) => item.kind === "short")) return true;
  if (list.some((item) => item.url?.includes("/shorts/"))) return true;
  if (list.some((item) => item.title && SHORTS_TAG.test(item.title))) return true;
  if (list.some((item) => item.kind === "video")) return false;
  return list.some((item) => {
    const seconds = runtimeSeconds(item.duration);
    return seconds != null && seconds > 0 && seconds <= maxSeconds;
  });
}

/** Kind from the RSS link and title, and a title safe to show on the page. */
export function classifyRssTitle(title: string, link = ""): { kind: ShortKind; title: string } {
  const kind: ShortKind = link.includes("/shorts/") || SHORTS_TAG.test(title) ? "short" : "video";
  return { kind, title: title.replace(/\s*#shorts\b/gi, "").trim() };
}

export function resolveWatchVideo(sources: Array<WatchVideoSource | null | undefined>): {
  title: string;
  dateLabel: string;
  summary: string;
  short: boolean;
} {
  const list = sources.filter((item): item is WatchVideoSource => Boolean(item));
  const rawTitle = list.map((item) => item.title?.trim() || "").find(Boolean) || "";
  const title = rawTitle ? classifyRssTitle(rawTitle).title : "Video";
  return {
    title: title || "Video",
    dateLabel: list.map((item) => item.dateLabel?.trim() || "").find(Boolean) || "",
    summary: list.map((item) => item.summary?.trim() || "").find(Boolean) || "",
    short: isYouTubeShort(list),
  };
}
