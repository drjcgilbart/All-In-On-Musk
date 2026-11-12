import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";

export const LETTER_CHIPS = ["Confirmed", "Reported", "Rumor", "Placeholder"] as const;
export type LetterChip = (typeof LETTER_CHIPS)[number];

export type LetterIssue = {
  date: string;
  title: string;
  summary: string;
  chip?: LetterChip;
  body: string;
};

export type Inline =
  | { type: "text"; text: string }
  | { type: "strong"; text: string }
  | { type: "em"; text: string }
  | { type: "code"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "chip"; chip: LetterChip };

export type Block =
  | { type: "heading"; level: 2 | 3 | 4; inlines: Inline[] }
  | { type: "paragraph"; inlines: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; inlines: Inline[] }
  | { type: "rule" }
  | { type: "video"; id: string; title: string };

const DIR = path.join(process.cwd(), "content", "letter");
const DATE_FILE = /^(\d{4}-\d{2}-\d{2})\.md$/;

export function isValidDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseChip(value: string | undefined): LetterChip | undefined {
  if (!value) return undefined;
  return LETTER_CHIPS.find((chip) => chip.toLowerCase() === value.trim().toLowerCase());
}

function splitFrontmatter(raw: string) {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { data: {} as Record<string, string>, body: text.trim() };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { data: {} as Record<string, string>, body: text.trim() };
  const data: Record<string, string> = {};
  for (const line of text.slice(4, end).split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    data[match[1].toLowerCase()] = value;
  }
  return { data, body: text.slice(end + 5).trim() };
}

export function parseLetterFile(filename: string, raw: string): LetterIssue {
  const match = DATE_FILE.exec(filename);
  if (!match || !isValidDate(match[1])) {
    throw new Error(`content/letter/${filename} must be named YYYY-MM-DD.md`);
  }
  const date = match[1];
  const { data, body } = splitFrontmatter(raw);
  if (data.date && data.date !== date) {
    throw new Error(`content/letter/${filename}: date ${data.date} does not match the file name`);
  }
  const title = (data.title || "").trim();
  if (!title) throw new Error(`content/letter/${filename}: missing title`);
  const summary = (data.summary || data.preview || "").trim();
  if (!summary) throw new Error(`content/letter/${filename}: missing summary`);
  if (data.chip && !parseChip(data.chip)) {
    throw new Error(`content/letter/${filename}: chip must be Confirmed, Reported, Rumor, or Placeholder`);
  }
  return { date, title, summary, chip: parseChip(data.chip), body };
}

export function safeUrl(url: string) {
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    return null;
  }
  return null;
}

export function youtubeIdFromUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const allowed = host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com";
  if (!allowed) return null;
  let id = "";
  if (host === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0] || "";
  } else if (parsed.pathname === "/watch") {
    id = parsed.searchParams.get("v") || "";
  } else {
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") id = parts[1] || "";
  }
  return /^[\w-]{11}$/.test(id) ? id : null;
}

export function parseInline(text: string): Inline[] {
  const nodes: Inline[] = [];
  const pattern =
    /\[(Confirmed|Reported|Rumor|Placeholder)\](?!\()|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: "text", text: text.slice(last, index) });
    if (match[1]) nodes.push({ type: "chip", chip: match[1] as LetterChip });
    else if (match[2]) nodes.push({ type: "strong", text: match[2] });
    else if (match[3]) nodes.push({ type: "em", text: match[3] });
    else if (match[4]) nodes.push({ type: "code", text: match[4] });
    else if (match[5] && match[6]) {
      const href = safeUrl(match[6]);
      nodes.push(href ? { type: "link", text: match[5], href } : { type: "text", text: match[5] });
    }
    last = index + match[0].length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

function videoFromInlines(inlines: Inline[]): { id: string; title: string } | null {
  if (inlines.length !== 1) return null;
  const only = inlines[0];
  if (only.type === "link") {
    const id = youtubeIdFromUrl(only.href);
    return id ? { id, title: only.text.trim() || "Video" } : null;
  }
  if (only.type === "text") {
    const trimmed = only.text.trim();
    const id = youtubeIdFromUrl(trimmed);
    return id ? { id, title: "Video" } : null;
  }
  return null;
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const startsBlock = (line: string) => /^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>|-{3,}\s*$|\*{3,}\s*$)/.test(line);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line.trim())) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = (heading[1].length === 1 ? 2 : heading[1].length === 2 ? 3 : 4) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, inlines: parseInline(heading[2].trim()) });
      i += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", inlines: parseInline(quote.join(" ")) });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*[-*]\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(parseInline(lines[i].replace(/^\s*\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    const inlines = parseInline(para.join(" "));
    const video = videoFromInlines(inlines);
    blocks.push(video ? { type: "video", id: video.id, title: video.title } : { type: "paragraph", inlines });
  }
  return blocks;
}

function loadIssues(): LetterIssue[] {
  let names: string[] = [];
  try {
    names = readdirSync(DIR);
  } catch {
    return [];
  }
  const issues = names
    .filter((name) => DATE_FILE.test(name))
    .map((name) => parseLetterFile(name, readFileSync(path.join(DIR, name), "utf8")));
  issues.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return issues;
}

export const listIssues = cache(loadIssues);

export function getIssue(date: string) {
  if (!isValidDate(date)) return null;
  return listIssues().find((issue) => issue.date === date) ?? null;
}

export function getCurrentIssue() {
  return listIssues()[0] ?? null;
}

export function issueNeighbors(date: string) {
  const issues = listIssues();
  const index = issues.findIndex((issue) => issue.date === date);
  if (index === -1) return { newer: null, older: null };
  return {
    newer: index > 0 ? issues[index - 1] : null,
    older: index < issues.length - 1 ? issues[index + 1] : null,
  };
}
