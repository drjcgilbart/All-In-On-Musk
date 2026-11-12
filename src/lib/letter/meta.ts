import { LETTER_RSS_PATH } from "@/content/letter";
import { site } from "@/content/site";

/** Canonical plus the letter feed, so a page-level canonical does not drop the head link. */
export function letterAlternates(canonical: string) {
  return {
    canonical,
    types: {
      "application/rss+xml": `${site.url}${LETTER_RSS_PATH}`,
    },
  };
}
