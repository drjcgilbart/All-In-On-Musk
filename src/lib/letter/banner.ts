import { getCurrentIssue, listIssues } from "@/lib/letter";
import { letterHasShareImage, letterOgPublicPath } from "@/lib/letter/share";
import type { LetterBanners } from "@/content/art";

/**
 * Desk-shell banners for the daily letter. The shell is a client component and
 * only knows the URL, and `/letter` has no date in the path, so the server
 * layout passes this catalog down. A new `public/letter/og/YYYY-MM-DD.jpg` is
 * enough for the next issue's banner, Latest card, and archive thumbnail.
 */
export function letterBannerCatalog(): LetterBanners {
  const byDate: LetterBanners["byDate"] = {};
  for (const issue of listIssues()) {
    if (!letterHasShareImage(issue.date)) continue;
    byDate[issue.date] = {
      src: letterOgPublicPath(issue.date),
      alt: issue.title,
      width: 1200,
      height: 675,
    };
  }
  return { currentDate: getCurrentIssue()?.date ?? null, byDate };
}
