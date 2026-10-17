import type { NewsItem } from "@/content/news";
import { ANTI_TESLA, BASHING, blockedOutlet, CORE, TOPIC_LEFT_POLITICS, TOPIC_LGBTQ } from "@/lib/newsFilters";

/**
 * Live desk. Bing News RSS searches (direct publisher URLs), pulled at most every 6h
 * and forced daily by the 6 AM ET cron (/api/news-refresh). Headlines and links come
 * from the same pull. Every link is checked; dead ones are dropped. No article text is copied.
 */
const REFRESH = 21600;
const QUERIES = [
  "Tesla", "Tesla Robotaxi OR Optimus OR Cybertruck", "SpaceX", "Starship OR Starlink",
  "xAI OR Grok", "Elon Musk X", "Neuralink", "Boring Company", "Terafab",
];

const TAGS: [string, RegExp][] = [
  ["Tesla", /\b(tesla|cybertruck|robotaxi|optimus|model [3sxy]|megapack|tsla)\b/i],
  ["Terafab", /\bterafab\b/i],
  ["Starlink", /\bstarlink\b/i],
  ["SpaceX", /\b(spacex|starship|falcon|starbase|spcx|dragon)\b/i],
  ["xAI", /\b(xai|grok)\b/i],
  ["Neuralink", /\bneuralink\b/i],
  ["Boring", /\bboring (company|co)\b/i],
  ["X", /\b(x corp|twitter|musk'?s x|on x)\b/i],
];
const MUSK = /\bmusk\b/i;

export type Dropped = { source: string; title: string; reason: string };
export let lastDropped: Dropped[] = [];

function screen(n: NewsItem & { raw?: string; desc?: string }): string | null {
  if (blockedOutlet(n.source, n.href)) return "blocked outlet";
  const text = `${n.raw ?? n.title} ${n.desc ?? ""}`;
  let m = text.match(TOPIC_LGBTQ);
  if (m) return `topic: LGBTQ (${m[0]})`;
  if ((m = text.match(TOPIC_LEFT_POLITICS))) return `topic: left politics (${m[0]})`;
  if ((m = text.match(BASHING)) && !CORE.test(n.raw ?? n.title)) return `Musk-bashing (${m[0]})`;
  if ((m = text.match(ANTI_TESLA)) && !CORE.test(n.raw ?? n.title)) return `anti-Tesla (${m[0]})`;
  return null;
}

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
   .replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const pick = (xml: string, tag: string) => decode(xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ?? "");

/** Turn a feed headline into a tiny original one-liner. */
function shorten(raw: string): string {
  let t = raw.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
  t = t.split(/\s[|–—]\s|:\s/)[0].trim();
  const words = t.split(/\s+/);
  if (words.length > 9) t = words.slice(0, 9).join(" ").replace(/[,;]$/, "") + "…";
  if (!/[.!?…]$/.test(t)) t += ".";
  return t;
}

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "America/New_York" });

/** Bing wraps links in apiclick.aspx?url=...; take the publisher URL directly. */
function direct(link: string): string | null {
  try {
    const u = new URL(link);
    const inner = u.hostname.endsWith("bing.com") ? u.searchParams.get("url") : link;
    if (!inner) return null;
    const out = new URL(inner);
    return out.protocol.startsWith("http") ? out.toString() : null;
  } catch { return null; }
}

async function fetchQuery(q: string): Promise<(NewsItem & { raw: string; desc: string })[]> {
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&qft=sortbydate%3d%221%22&mkt=en-US`;
  const res = await fetch(url, { next: { revalidate: REFRESH }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const xml = await res.text();
  return (xml.match(/<item>[\s\S]*?<\/item>/g) ?? []).flatMap((it) => {
    const title = pick(it, "title");
    const desc = pick(it, "description").replace(/<[^>]+>/g, " ");
    const source = pick(it, "News:Source") || "News";
    const href = direct(pick(it, "link"));
    const date = new Date(pick(it, "pubDate"));
    const tags = TAGS.filter(([, re]) => re.test(title)).map(([t]) => t);
    if (!href || !title || isNaN(+date) || (tags.length === 0 && !MUSK.test(title))) return [];
    return [{
      id: href, title: shorten(title), source, href, time: fmt(date), iso: date.toISOString(),
      tags: tags.length ? tags : ["Musk"], chip: "Reported" as const,
      summary: `Via ${source}. Full story at the link.`, raw: title, desc,
    }];
  });
}

/** Drop links that are gone (404/410/5xx/unreachable). 401/403/429 = alive but bot-walled. */
async function alive(href: string): Promise<boolean> {
  try {
    const res = await fetch(href, {
      redirect: "follow", signal: AbortSignal.timeout(6000), next: { revalidate: REFRESH },
      headers: { "user-agent": "Mozilla/5.0 (compatible; AllInOnMuskDesk/1.0)" },
    });
    res.body?.cancel().catch(() => {});
    return res.ok || [401, 403, 429].includes(res.status);
  } catch { return false; }
}

export async function pull(): Promise<NewsItem[]> {
  const raw = (await Promise.all(QUERIES.map((q) => fetchQuery(q).catch(() => [])))).flat();
  const dropped: Dropped[] = [];
  const all = raw.filter((n) => {
    const why = screen(n);
    if (why && !dropped.some((d) => d.title === n.title)) dropped.push({ source: n.source, title: n.title, reason: why });
    return !why;
  }).map(({ raw: _r, desc: _d, ...n }: NewsItem & { raw?: string; desc?: string }) => n as NewsItem);
  lastDropped = dropped;
  if (dropped.length) console.log("[liveNews] screened out", JSON.stringify(dropped));
  const seen = new Set<string>();
  const fresh = all
    .filter((n) => Date.now() - Date.parse(n.iso) < 7 * 86_400_000)
    .sort((a, b) => Date.parse(b.iso) - Date.parse(a.iso))
    .filter((n) => {
      const key = n.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
      if (seen.has(key) || seen.has(n.href)) return false;
      seen.add(key); seen.add(n.href); return true;
    })
    .slice(0, 60);
  const ok = await Promise.all(fresh.map((n) => alive(n.href)));
  return fresh.filter((_, i) => ok[i]);
}

let memo: { at: number; items: Promise<NewsItem[]> } | null = null;

/** Newest first. Throws at runtime on an empty pull so ISR keeps the last good page. */
export async function getLiveNews(limit = 5): Promise<NewsItem[]> {
  if (!memo || Date.now() - memo.at > 60_000) memo = { at: Date.now(), items: pull() };
  const items = await memo.items.catch(() => [] as NewsItem[]);
  if (items.length === 0) {
    memo = null;
    if (process.env.NEXT_PHASE === "phase-production-build") return [];
    throw new Error("live news pull came back empty");
  }
  return items.slice(0, limit);
}

/** Newest verified item per tag, for the Stack cards. */
export async function latestByTag(tags: string[]): Promise<Record<string, NewsItem | undefined>> {
  const items = await getLiveNews(60);
  return Object.fromEntries(tags.map((t) => [t, items.find((n) => n.tags.includes(t))]));
}
