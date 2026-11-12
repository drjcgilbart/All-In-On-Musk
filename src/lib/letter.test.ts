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

test("preview is an alias for summary", () => {
  const issue = parseLetterFile("2026-11-12.md", "---\ntitle: Hello\npreview: Short.\n---\n");
  assert.equal(issue.summary, "Short.");
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
  const blocks = parseMarkdown("Desk call: [Confirmed] [Reported] [Rumor]");
  assert.equal(blocks[0].type, "paragraph");
  if (blocks[0].type !== "paragraph") return;
  const chips = blocks[0].inlines.filter((item) => item.type === "chip").map((item) => (item.type === "chip" ? item.chip : ""));
  assert.deepEqual(chips, ["Confirmed", "Reported", "Rumor"]);
});

test("the placeholder issue is the current issue", () => {
  const current = getCurrentIssue();
  assert.ok(current);
  assert.equal(current?.date, "2026-11-12");
  assert.equal(current?.chip, "Placeholder");
  assert.match(current?.title ?? "", /placeholder/i);
  assert.equal(getIssue("1999-01-01"), null);
  assert.equal(getIssue("archive"), null);
});
