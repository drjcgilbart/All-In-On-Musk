import { letterDateLabel, letterIssuePath } from "@/content/letter";
import { getChannelRss, type RssVideo } from "@/lib/channelRss";
import { listIssues, type LetterIssue } from "@/lib/letter";
import { letterHasShareImage, letterOgPublicPath } from "@/lib/letter/share";

export type Release = {
  kind: "letter" | "video";
  id: string;
  title: string;
  /** Sort key, milliseconds. */
  at: number;
  dateLabel: string;
  blurb: string;
  href: string;
  image: string;
  imageFallback: string;
};

const ROW_LIMIT = 6;

/** Noon in New York, so a letter dated that day sits with the day's videos. */
export function letterReleaseTime(isoDate: string) {
  const utcNoon = Date.parse(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(utcNoon)) return 0;
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(utcNoon)),
  );
  if (!Number.isFinite(hour)) return utcNoon;
  return utcNoon + (12 - hour) * 3_600_000;
}

function videoDateLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function letterToRelease(issue: LetterIssue): Release {
  const image = letterHasShareImage(issue.date) ? letterOgPublicPath(issue.date) : "";
  return {
    kind: "letter",
    id: issue.date,
    title: issue.title,
    at: letterReleaseTime(issue.date),
    dateLabel: letterDateLabel(issue.date),
    blurb: issue.summary,
    href: letterIssuePath(issue.date),
    image,
    imageFallback: "",
  };
}

export function videoToRelease(video: RssVideo): Release | null {
  if (video.kind !== "video") return null;
  if (!/^[\w-]{11}$/.test(video.id)) return null;
  const at = Date.parse(video.publishedAt);
  if (Number.isNaN(at)) return null;
  return {
    kind: "video",
    id: video.id,
    title: video.title,
    at,
    dateLabel: videoDateLabel(video.publishedAt),
    blurb: video.summary || "New on the channel.",
    href: video.href.startsWith("/") ? video.href : `/watch/${video.id}`,
    image: `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
    imageFallback: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
  };
}

/** Newest first. Letters and long videos only. Shorts stay in the video player. */
export function rankReleases(letters: LetterIssue[], videos: RssVideo[]) {
  const releases = [
    ...letters.map(letterToRelease),
    ...videos.map(videoToRelease).filter((item): item is Release => item !== null),
  ];
  releases.sort((a, b) => b.at - a.at || a.title.localeCompare(b.title));
  return releases;
}

export async function listReleases() {
  const letters = listIssues();
  let videos: RssVideo[] = [];
  try {
    videos = await getChannelRss(15);
  } catch {
    videos = [];
  }
  const ranked = rankReleases(letters, videos);
  return {
    featured: ranked[0] ?? null,
    earlier: ranked.slice(1, 1 + ROW_LIMIT),
  };
}
