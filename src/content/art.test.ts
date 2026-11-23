import assert from "node:assert/strict";
import test from "node:test";
import { pageFrames, type LetterBanners } from "./art";

const banners: LetterBanners = {
  currentDate: "2026-11-23",
  byDate: {
    "2026-11-23": { src: "/letter/og/2026-11-23.jpg", alt: "AI5 goes to Optimus. Cars stay on AI4." },
    "2026-11-21": { src: "/letter/og/2026-11-21.jpg", alt: "Italy says yes to Tesla's self-driving" },
  },
};

test("a dated letter uses that day's graphic", () => {
  const frames = pageFrames("/letter/2026-11-23", banners);
  assert.equal(frames.length, 1);
  assert.equal(frames[0]?.src, "/letter/og/2026-11-23.jpg");
  assert.match(frames[0]?.alt ?? "", /Optimus/);
});

test("the current letter uses the newest issue graphic", () => {
  assert.equal(pageFrames("/letter", banners)[0]?.src, "/letter/og/2026-11-23.jpg");
  assert.equal(pageFrames("/letter/", banners)[0]?.src, "/letter/og/2026-11-23.jpg");
});

test("a letter without a graphic keeps the campus banner", () => {
  assert.equal(pageFrames("/letter/2026-11-12", banners)[0]?.src, "/art/campus.jpg");
  assert.equal(pageFrames("/letter/2026-11-12", banners)[0]?.alt, "An oceanside industrial campus at night");
});

test("archive, subscribe, and other desks keep their own banners", () => {
  assert.equal(pageFrames("/letter/archive", banners)[0]?.src, "/art/campus.jpg");
  assert.equal(pageFrames("/letter/subscribe", banners)[0]?.src, "/art/campus.jpg");
  assert.equal(pageFrames("/letter/unsubscribe", banners)[0]?.src, "/art/campus.jpg");
  assert.equal(pageFrames("/", banners)[0]?.src, "/art/starship.jpg");
  assert.equal(pageFrames("/about", banners)[0]?.src, "/art/campus.jpg");
});

test("missing catalog leaves letter pages on the campus banner", () => {
  assert.equal(pageFrames("/letter")[0]?.src, "/art/campus.jpg");
  assert.equal(pageFrames("/letter/2026-11-23")[0]?.src, "/art/campus.jpg");
});
