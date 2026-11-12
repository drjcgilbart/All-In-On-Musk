import assert from "node:assert/strict";
import test from "node:test";
import { getCurrentIssue, getIssue, isValidDate, parseLetterFile, parseMarkdown, safeUrl, youtubeIdFromUrl } from "./letter";

test("calendar dates reject impossible days", () => {
  assert.equal(isValidDate("2026-11-12"), true);
  assert.equal(isValidDate("2026-02-29"), false);
  assert.equal(isValidDate("2028-02-29"), true);
  assert.equal(isValidDate("2026-13-01"), false);
});

test("frontmatter date must match the file name", () => {
  const issue = parseLetterFile(
    "2026-11-12.md",
    "---\ntitle: Hello\ndate: 2026-11-12\nsummary: A line.\nchip: reported\n---\n\nBody [Confirmed]",
  );
  assert.equal(issue.chip, "Reported");
  assert.equal(issue.summary, "A line.");
  assert.throws(() => parseLetterFile("2026-11-12.md", "---\ntitle: Hello\ndate: 2026-11-11\nsummary: A line.\n---\n"), /does not match/);
});

test("subject is the headline and preview is the card text", () => {
  const issue = parseLetterFile(
    "2026-11-12.md",
    "---\ntitle: Today in Musk World: 12 Nov 2026\ndate: 2026-11-12\nissue: Issue 001\nsubject: Two catches\npreview: Plus the truck.\npermalink: /letter/2026-11-12\n---\n",
  );
  assert.equal(issue.title, "Two catches");
  assert.equal(issue.summary, "Plus the truck.");
  assert.equal(issue.issue, "Issue 001");
  assert.equal(issue.permalink, "/letter/2026-11-12");
});

test("preview is an alias for summary", () => {
  const issue = parseLetterFile("2026-11-12.md", "---\ntitle: Hello\npreview: Short.\n---\n");
  assert.equal(issue.summary, "Short.");
  assert.equal(issue.title, "Hello");
});

test("markdown keeps html as text and drops unsafe links", () => {
  const blocks = parseMarkdown("<script>alert(1)</script>\n\n[click](javascript:alert(1))\n\n[ok](/letter)");
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "paragraph");
  assert.equal(blocks[2].type, "paragraph");
  if (blocks[0].type !== "paragraph" || blocks[1].type !== "paragraph" || blocks[2].type !== "paragraph") return;
  assert.equal(blocks[0].inlines[0].type, "text");
  if (blocks[0].inlines[0].type === "text") assert.match(blocks[0].inlines[0].text, /<script>/);
  assert.equal(blocks[1].inlines.some((item) => item.type === "link"), false);
  const link = blocks[2].inlines.find((item) => item.type === "link");
  assert.ok(link && link.type === "link" && link.href === "/letter");
});

test("youtube links on their own line become embeds", () => {
  const id = "abcdefghijk";
  const blocks = parseMarkdown(`See [the clip](https://www.youtube.com/watch?v=${id}) inline.\n\nhttps://youtu.be/${id}\n`);
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "video");
  if (blocks[1].type === "video") assert.equal(blocks[1].id, id);
  assert.equal(youtubeIdFromUrl(`https://evil.example/watch?v=${id}`), null);
  assert.equal(safeUrl("javascript:alert(1)"), null);
});

test("labels render as chips", () => {
  const blocks = parseMarkdown("Desk call: [Confirmed] [Reported] [Rumor]\n\n`Confirmed / Reported` · Tesla\n");
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "paragraph");
  if (blocks[0].type !== "paragraph" || blocks[1].type !== "paragraph") return;
  const chips = blocks[0].inlines.filter((item) => item.type === "chip").map((item) => (item.type === "chip" ? item.chip : ""));
  assert.deepEqual(chips, ["Confirmed", "Reported", "Rumor"]);
  const pair = blocks[1].inlines.filter((item) => item.type === "chip").map((item) => (item.type === "chip" ? item.chip : ""));
  assert.deepEqual(pair, ["Confirmed", "Reported"]);
});

test("site shop links stay on /shop and mail links stay", () => {
  const blocks = parseMarkdown("[Shop the desk →](https://allinonmusk.com/shop)\n\n[Tips](mailto:jonvale@allinonmusk.com)\n");
  assert.equal(blocks[0].type, "paragraph");
  assert.equal(blocks[1].type, "paragraph");
  if (blocks[0].type !== "paragraph" || blocks[1].type !== "paragraph") return;
  const shop = blocks[0].inlines.find((item) => item.type === "link");
  const mail = blocks[1].inlines.find((item) => item.type === "link");
  assert.ok(shop && shop.type === "link" && shop.href === "/shop" && shop.text === "Shop the desk →");
  assert.ok(mail && mail.type === "link" && mail.href === "mailto:jonvale@allinonmusk.com");
});

test("section headings stay above the item headings", () => {
  const blocks = parseMarkdown("# Today in Musk World\n\n## The brief\n\n### 01. Flight 15\n");
  assert.equal(blocks[0].type, "heading");
  assert.equal(blocks[1].type, "heading");
  assert.equal(blocks[2].type, "heading");
  if (blocks[0].type !== "heading" || blocks[1].type !== "heading" || blocks[2].type !== "heading") return;
  assert.equal(blocks[0].mast, true);
  assert.equal(blocks[0].level, 2);
  assert.equal(blocks[1].level, 2);
  assert.equal(blocks[1].mast, false);
  assert.equal(blocks[2].level, 3);
});

test("issue 1 is the current issue", () => {
  const current = getCurrentIssue();
  assert.ok(current);
  assert.equal(current?.date, "2026-11-12");
  assert.equal(current?.title, "Two catches, one window: Starship Flight 15 goes Friday");
  assert.match(current?.summary ?? "", /Cybertruck/);
  assert.equal(current?.issue, "Issue 001");
  assert.equal(current?.permalink, "/letter/2026-11-12");
  assert.equal(current?.chip, undefined);
  assert.doesNotMatch(current?.body ?? "", /placeholder/i);
  assert.equal(getIssue("1999-01-01"), null);
  assert.equal(getIssue("archive"), null);
});
