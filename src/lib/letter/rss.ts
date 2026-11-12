import { LETTER_NAME, LETTER_PATH, LETTER_RSS_PATH, letterIssuePath } from "@/content/letter";
import type { LetterIssue } from "@/lib/letter";
import { site } from "@/content/site";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rssDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return new Date(0).toUTCString();
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 15, 0, 0)).toUTCString();
}

export function renderLetterRss(issues: LetterIssue[], origin = site.url) {
  const channelLink = `${origin}${LETTER_PATH}`;
  const self = `${origin}${LETTER_RSS_PATH}`;
  const items = issues
    .map((issue) => {
      const link = `${origin}${issue.permalink && issue.permalink.startsWith("/") ? issue.permalink : letterIssuePath(issue.date)}`;
      return [
        "<item>",
        `<title>${escapeXml(issue.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `<pubDate>${rssDate(issue.date)}</pubDate>`,
        `<description>${escapeXml(issue.summary)}</description>`,
        "</item>",
      ].join("");
    })
    .join("");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(LETTER_NAME)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${escapeXml(`Free daily letter from ${site.name}.`)}</description>`,
    "<language>en-us</language>",
    `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `<atom:link href="${escapeXml(self)}" rel="self" type="application/rss+xml"/>`,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
