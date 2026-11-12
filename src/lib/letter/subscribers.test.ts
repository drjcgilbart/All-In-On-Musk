import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { LETTER_RSS_PATH, LETTER_SUBSCRIBE_PATH } from "../../content/letter";
import { letterEmailFooter } from "./email-footer";
import { listIssues } from "../letter";
import { renderLetterRss } from "./rss";
import {
  letterRedisKeys,
  letterRedisPrefix,
  memoryLetterStore,
  normalizeLetterEmail,
  subscribeToLetter,
  unsubscribeFromLetter,
} from "./subscribers";

test("email validation rejects junk and accepts a normal address", () => {
  assert.equal(normalizeLetterEmail("not-an-email"), null);
  assert.equal(normalizeLetterEmail("a@b"), null);
  assert.equal(normalizeLetterEmail(" Reader@Example.com "), "reader@example.com");
});

test("redis keys stay in the letter namespace", () => {
  assert.equal(letterRedisPrefix({ VERCEL_ENV: "production" }), "aiom:letter");
  assert.equal(letterRedisPrefix({ VERCEL_ENV: "preview" }), "aiom:letter:preview");
  const keys = letterRedisKeys("aiom:letter");
  assert.equal(keys.subscribers, "aiom:letter:subscribers");
  assert.equal(keys.record("a@b.co"), "aiom:letter:subscriber:a@b.co");
  assert.equal(keys.token("abc"), "aiom:letter:token:abc");
  assert.match(keys.rate("subscribe", "hash"), /^aiom:letter:ratelimit:subscribe:/);
});

test("subscribe is idempotent and a honeypot stores nothing", async () => {
  const store = memoryLetterStore();
  const first = await subscribeToLetter(store, { email: "reader@example.com", name: "Ada" }, "1.1.1.1");
  assert.equal(first.ok, true);
  const saved = await store.findByEmail("reader@example.com");
  assert.ok(saved);
  const again = await subscribeToLetter(store, { email: "reader@example.com" }, "1.1.1.1");
  assert.equal(again.ok, true);
  const still = await store.findByEmail("reader@example.com");
  assert.equal(still?.token, saved?.token);
  assert.equal(still?.createdAt, saved?.createdAt);
  const bot = await subscribeToLetter(store, { email: "bot@example.com", company: "acme" }, "1.1.1.1");
  assert.equal(bot.ok, true);
  assert.equal(await store.findByEmail("bot@example.com"), null);
  const bad = await subscribeToLetter(store, { email: "nope" }, "1.1.1.1");
  assert.equal(bad.ok, false);
});

test("token unsubscribe works and an email lookup stays neutral", async () => {
  const store = memoryLetterStore();
  await subscribeToLetter(store, { email: "reader@example.com" }, "1.1.1.1");
  const row = await store.findByEmail("reader@example.com");
  assert.ok(row);
  const removed = await unsubscribeFromLetter(store, { token: row.token }, "1.1.1.1");
  assert.equal(removed.ok, true);
  if (removed.ok) assert.match(removed.message, /off the list/);
  assert.equal((await store.findByEmail("reader@example.com"))?.status, "unsubscribed");
  const missing = await unsubscribeFromLetter(store, { email: "nobody@example.com" }, "8.8.8.8");
  assert.equal(missing.ok, true);
  if (missing.ok) assert.match(missing.message, /If that address is on the list/);
  const bad = await unsubscribeFromLetter(store, { token: "nope" }, "8.8.8.8");
  assert.equal(bad.ok, false);
});

test("rate limit blocks the sixth subscribe from one address", async () => {
  const store = memoryLetterStore();
  for (let index = 0; index < 5; index += 1) {
    const result = await subscribeToLetter(store, { email: `r${index}@example.com` }, "9.9.9.9");
    assert.equal(result.ok, true);
  }
  const blocked = await subscribeToLetter(store, { email: "late@example.com" }, "9.9.9.9");
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.status, 429);
});

test("rss uses absolute site urls and escapes text", () => {
  const xml = renderLetterRss(
    [
      {
        date: "2026-11-12",
        title: "Tom & Jerry",
        summary: "A <preview>",
        permalink: "/letter/2026-11-12",
        body: "",
      },
    ],
    "https://allinonmusk.com",
  );
  assert.match(xml, /<rss version="2.0"/);
  assert.match(xml, /<link>https:\/\/allinonmusk\.com\/letter\/2026-11-12<\/link>/);
  assert.match(xml, /Tom &amp; Jerry/);
  assert.match(xml, /A &lt;preview&gt;/);
  assert.doesNotMatch(xml, /href="\/letter/);
  const live = renderLetterRss(listIssues(), "https://allinonmusk.com");
  assert.match(live, new RegExp(`<atom:link href="https://allinonmusk.com${LETTER_RSS_PATH}"`));
  assert.match(live, /Starship Flight 15/);
});

test("email footer is a template and is not mounted by a page", () => {
  const html = letterEmailFooter({
    issueUrl: "https://allinonmusk.com/letter/2026-11-12",
    unsubscribeUrl: "https://allinonmusk.com/letter/unsubscribe?token=abc",
  });
  assert.match(html, /Read in your browser/);
  assert.match(html, new RegExp(LETTER_SUBSCRIBE_PATH));
  assert.match(html, /unsubscribe\?token=abc/);
  const pages = [
    "src/app/(desk)/letter/page.tsx",
    "src/app/(desk)/letter/[date]/page.tsx",
    "src/components/letter-view.tsx",
    "src/components/letter-card.tsx",
  ];
  for (const file of pages) {
    assert.equal(readFileSync(file, "utf8").includes("email-footer"), false);
  }
});
