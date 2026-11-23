import assert from "node:assert/strict";
import test from "node:test";
import { classifyRssTitle, isYouTubeShort, resolveWatchVideo, runtimeSeconds } from "./shorts";

test("runtime accepts ISO durations and clock times", () => {
  assert.equal(runtimeSeconds("PT45S"), 45);
  assert.equal(runtimeSeconds("PT3M"), 180);
  assert.equal(runtimeSeconds("PT3M1S"), 181);
  assert.equal(runtimeSeconds("PT1H2M3S"), 3723);
  assert.equal(runtimeSeconds("0:45"), 45);
  assert.equal(runtimeSeconds("3:00"), 180);
  assert.equal(runtimeSeconds("1:02:03"), 3723);
  assert.equal(runtimeSeconds(""), null);
  assert.equal(runtimeSeconds("soon"), null);
});

test("shorts playlist, /shorts/ link, or #Shorts title wins", () => {
  assert.equal(isYouTubeShort([{ kind: "short" }]), true);
  assert.equal(isYouTubeShort([{ url: "https://www.youtube.com/shorts/tRqSbqyMhW8" }]), true);
  assert.equal(isYouTubeShort([{ title: "Tesla Optimus Won't Cost You $30,000 (Here's Why) #Shorts" }]), true);
  assert.equal(isYouTubeShort([{ title: "A #shorts note", kind: "video", duration: "12:04" }]), true);
});

test("a regular video stays widescreen even when it is under three minutes", () => {
  assert.equal(isYouTubeShort([{ kind: "video", title: "How Starship Works", duration: "2:30" }]), false);
  assert.equal(isYouTubeShort([{ url: "https://www.youtube.com/watch?v=YGy8CTyT3K4", kind: "video" }]), false);
});

test("duration under about three minutes is the fallback when kind is unknown", () => {
  assert.equal(isYouTubeShort([{ duration: "2:59" }]), true);
  assert.equal(isYouTubeShort([{ duration: "PT3M" }]), true);
  assert.equal(isYouTubeShort([{ duration: "3:01" }]), false);
  assert.equal(isYouTubeShort([{ duration: "12:04" }]), false);
  assert.equal(isYouTubeShort([{ duration: "0:00" }]), false);
  assert.equal(isYouTubeShort([null, undefined]), false);
});

test("RSS classification uses the shorts link and the title, then hides the tag", () => {
  assert.deepEqual(classifyRssTitle("SpaceX Just Caught Starship Coming Back From Orbit #Shorts", "https://www.youtube.com/shorts/tRqSbqyMhW8"), {
    kind: "short",
    title: "SpaceX Just Caught Starship Coming Back From Orbit",
  });
  assert.equal(classifyRssTitle("How Starship Works: 33 Engines, 15 Flights, by the Numbers", "https://www.youtube.com/watch?v=YGy8CTyT3K4").kind, "video");
  assert.equal(classifyRssTitle("Listed as a watch link #Shorts", "https://www.youtube.com/watch?v=CSUGftkzIlM").kind, "short");
});

test("watch page prefers playlist and title signals over a short runtime", () => {
  const fromRss = resolveWatchVideo([
    {
      kind: "short",
      title: "Tesla's Next Chip Goes to Optimus, Not Your Car",
      dateLabel: "Nov 23, 2026",
      summary: "AI5 goes to Optimus first.",
    },
  ]);
  assert.equal(fromRss.short, true);
  assert.equal(fromRss.title, "Tesla's Next Chip Goes to Optimus, Not Your Car");
  assert.equal(fromRss.dateLabel, "Nov 23, 2026");

  const longForm = resolveWatchVideo([
    { kind: "video", title: "How Starship Works: 33 Engines, 15 Flights, by the Numbers", duration: "12:04" },
  ]);
  assert.equal(longForm.short, false);

  const onlyRuntime = resolveWatchVideo([{ title: "Older upload", duration: "0:58" }]);
  assert.equal(onlyRuntime.short, true);
  assert.equal(onlyRuntime.title, "Older upload");

  const tagged = resolveWatchVideo([{ title: "Older upload #Shorts", duration: "8:00" }]);
  assert.equal(tagged.short, true);
  assert.equal(tagged.title, "Older upload");

  assert.deepEqual(resolveWatchVideo([]), { title: "Video", dateLabel: "", summary: "", short: false });
});
