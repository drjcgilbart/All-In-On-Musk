import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { site } from "@/content/site";
import type { LetterIssue } from "@/lib/letter";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Public path for a day's teaser. Drop the file at `public/letter/og/YYYY-MM-DD.jpg`. */
export function letterOgPublicPath(date: string) {
  return `/letter/og/${date}.jpg`;
}

/** True when that day's JPEG is in `public/letter/og`. Checked while the static pages are built. */
export function letterHasShareImage(date: string) {
  if (!DATE.test(date)) return false;
  return existsSync(path.join(process.cwd(), "public", "letter", "og", `${date}.jpg`));
}

/**
 * Share tags for one issue. Relative image and page URLs so the root `metadataBase`
 * (`https://allinonmusk.com`) makes them absolute. Returns nothing when the JPEG is absent,
 * which leaves the site-wide card in place. `openGraph` and `twitter` are set in full
 * because Next replaces those objects instead of merging their fields.
 */
export function letterShareMetadata(issue: LetterIssue, pagePath: string): Metadata {
  if (!letterHasShareImage(issue.date)) return {};
  const image = {
    url: letterOgPublicPath(issue.date),
    width: 1200,
    height: 675,
    alt: issue.title,
    type: "image/jpeg",
  };
  return {
    openGraph: {
      type: "article",
      url: pagePath,
      title: issue.title,
      description: issue.summary,
      siteName: site.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description: issue.summary,
      images: [image],
    },
  };
}
