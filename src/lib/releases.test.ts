import assert from "node:assert/strict";
import test from "node:test";
import type { RssVideo } from "./channelRss";
import type { LetterIssue } from "./letter";
import { letterReleaseTime, rankReleases } from "./releases";

function letter(date: string, title: string): LetterIssue {
  return { date, title, summary: `${title} blurb`, body: "" };
}

function video(id: string, publishedAt: string, title: string, kind: RssVideo["kind"] = "video"): RssVideo {
  return {
    id,
    title,
    publishedAt,
    dateLabel: publishedAt,
    thumbnailUrl: "",
    summary: `${title} blurb`,
    kind,
    href: `/watch/${id}`,
  };
}

test("a letter is noon in New York", () => {
  assert.equal(new Date(letterReleaseTime("2026-11-20")).toISOString(), "2026-11-20T17:00:00.000Z");
});

test("the newer of the letter and the long video is first, and shorts are left out", () => {
  const ranked = rankReleases(
    [letter("2026-11-20", "Cybercab rolls into Dallas"), letter("2026-11-19", "Probably better together")],
    [
      video("nNQibfF2h70", "2026-11-19T19:00:13Z", "Subscriber short", "short"),
      video("yUtk-vcxGD8", "2026-11-19T19:00:09Z", "How Starlink Works: 11,000 Satellites by the Numbers"),
    ],
  );
  assert.deepEqual(
    ranked.map((item) => item.id),
    ["2026-11-20", "yUtk-vcxGD8", "2026-11-19"],
  );
  assert.equal(ranked[0]?.kind, "letter");
  assert.equal(ranked[1]?.href, "/watch/yUtk-vcxGD8");
});
