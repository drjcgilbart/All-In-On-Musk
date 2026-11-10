import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ny } from "@/lib/format";

/**
 * What Did Musk Say on X Today?
 *
 * One app-only read of the public @elonmusk timeline per refresh. Never posts,
 * likes, follows, DMs, or looks up a profile. The page reads the saved file,
 * not X. A failed pull must not replace a good save.
 *
 * Cache: public Upstash Blob bucket `all-in-on-musk` (UPSTASH_BLOB_TOKEN, same
 * token the studio catalog uses), object `musk-today/latest.json`.
 */

export const PULL_LIMIT = 10;
export const WINDOW_MS = 24 * 60 * 60 * 1000;
/** Clock skew allowed into the future so a just-posted item is not dropped. */
export const FUTURE_SKEW_MS = 10 * 60 * 1000;
/** Daily cron plus slack. Older than this, the page says the save is stale. */
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

/** Public user id for @elonmusk. Hard-coded so the refresh does not spend a second call on a lookup. */
const USER_ID = "44196397";
const HANDLE = "elonmusk";
const BLOB_PATH = "musk-today/latest.json";
const LOCAL_FILE = path.join(process.cwd(), "data", "musk-today.json");
const MAX_TEXT = 20_000;

const INVESTOR_TERMS: RegExp[] = [
  /\b(tesla|tsla)\b/i,
  /\b(spacex|starship|starlink)\b/i,
  /\b(xai|grok)\b/i,
  /\b(optimus|robotaxi|cybertruck|neuralink)\b/i,
  /\b(earnings|revenue|deliver(?:y|ies)|production|launch)\b/i,
];

export type FailureCode = "credits" | "rate" | "auth" | "http" | "network" | "token" | "payload" | "read";

export type MuskPost = {
  id: string;
  text: string;
  createdAt: string;
  /** Impression count from X, or null when X did not include it. Never guessed. */
  views: number | null;
  /** Tie-break only. Never outranks a higher view count. */
  investorScore: number;
  href: string;
};

export type MuskTodayCache = {
  posts: MuskPost[];
  /** When the posts were last pulled successfully. */
  updatedAt: string | null;
  /** When a pull was last attempted, including failures. */
  attemptedAt: string | null;
  stale: boolean;
  failure: FailureCode | null;
  failureStatus: number | null;
};

export type ReadState = { kind: "missing" } | { kind: "error" } | { kind: "ok"; cache: MuskTodayCache };

export type PullOutcome =
  | { ok: true; posts: MuskPost[] }
  | { ok: false; failure: FailureCode; status: number };

export type RefreshReport = {
  ok: boolean;
  kept: boolean;
  saved: boolean;
  untouched: boolean;
  failure: FailureCode | "store" | null;
  status: number | null;
  posts: number | null;
  updatedAt: string | null;
};

export class MuskTodayError extends Error {
  readonly failure: FailureCode;
  readonly status: number;

  constructor(failure: FailureCode, status: number, message: string) {
    super(message);
    this.name = "MuskTodayError";
    this.failure = failure;
    this.status = status;
  }
}

export function emptyCache(): MuskTodayCache {
  return {
    posts: [],
    updatedAt: null,
    attemptedAt: null,
    stale: false,
    failure: null,
    failureStatus: null,
  };
}

export function investorScore(text: string) {
  return INVESTOR_TERMS.reduce((sum, term) => sum + (term.test(text) ? 1 : 0), 0);
}

export function withinWindow(createdAt: string, now: number) {
  const time = Date.parse(createdAt);
  if (Number.isNaN(time)) return false;
  return time <= now + FUTURE_SKEW_MS && now - time <= WINDOW_MS;
}

/** Views first. Investor score only when the view counts are equal. Missing views sort last, by time. */
export function comparePosts(a: MuskPost, b: MuskPost) {
  if (a.views != null && b.views != null && a.views !== b.views) return b.views - a.views;
  if (a.views != null && b.views != null && a.views === b.views && a.investorScore !== b.investorScore) {
    return b.investorScore - a.investorScore;
  }
  if (a.views == null && b.views != null) return 1;
  if (a.views != null && b.views == null) return -1;
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
}

export function rankPosts(posts: MuskPost[]) {
  return [...posts].sort(comparePosts);
}

export function cleanText(input: string) {
  const text = input.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  if (text.length <= MAX_TEXT) return text;
  return `${text.slice(0, MAX_TEXT).trimEnd()}…`;
}

export function failureFromStatus(status: number): FailureCode {
  if (status === 402) return "credits";
  if (status === 429) return "rate";
  if (status === 401 || status === 403) return "auth";
  if (status === 0) return "network";
  return "http";
}

type RawTweet = {
  id?: unknown;
  text?: unknown;
  created_at?: unknown;
  note_tweet?: { text?: unknown } | null;
  public_metrics?: { impression_count?: unknown } | null;
  referenced_tweets?: { type?: unknown }[] | null;
  in_reply_to_user_id?: unknown;
};

function viewsOf(metrics: RawTweet["public_metrics"]): number | null {
  const value = metrics && typeof metrics === "object" ? metrics.impression_count : undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
}

function tweetText(row: RawTweet) {
  const note = row.note_tweet && typeof row.note_tweet.text === "string" ? row.note_tweet.text : "";
  const text = typeof row.text === "string" ? row.text : "";
  return cleanText(note || text);
}

function isRetweet(row: RawTweet, text: string) {
  if (/^RT @/i.test(text)) return true;
  return Array.isArray(row.referenced_tweets) && row.referenced_tweets.some((item) => item?.type === "retweeted");
}

function isReply(row: RawTweet) {
  return typeof row.in_reply_to_user_id === "string" || typeof row.in_reply_to_user_id === "number";
}

/**
 * Keep posts from the last 24 hours, at most PULL_LIMIT of the newest, then rank by views.
 * Throws on an error payload so the caller can keep the previous save.
 */
export function postsFromPayload(payload: unknown, now = Date.now()): MuskPost[] {
  if (!payload || typeof payload !== "object") {
    throw new MuskTodayError("payload", 0, "X sent a response this desk could not read.");
  }
  const body = payload as { data?: unknown; errors?: unknown; status?: unknown };
  if (body.errors || (typeof body.status === "number" && body.status >= 400)) {
    const status = typeof body.status === "number" ? body.status : 0;
    throw new MuskTodayError(status ? failureFromStatus(status) : "payload", status, "X returned an error payload.");
  }
  if (body.data !== undefined && !Array.isArray(body.data)) {
    throw new MuskTodayError("payload", 0, "X sent a response this desk could not read.");
  }
  const rows = (Array.isArray(body.data) ? body.data : []) as RawTweet[];
  const dated = rows.filter((row) => row && typeof row.created_at === "string" && !Number.isNaN(Date.parse(row.created_at)));
  if (rows.length > 0 && dated.length === 0) {
    throw new MuskTodayError("payload", 0, "X sent posts without times, so this desk did not replace the save.");
  }

  const parsed: MuskPost[] = [];
  for (const row of dated) {
    if (typeof row.id !== "string" || !/^\d{1,25}$/.test(row.id)) continue;
    const createdAt = String(row.created_at);
    if (!withinWindow(createdAt, now)) continue;
    const text = tweetText(row);
    if (isRetweet(row, text) || isReply(row)) continue;
    parsed.push({
      id: row.id,
      text,
      createdAt: new Date(createdAt).toISOString(),
      views: viewsOf(row.public_metrics),
      investorScore: investorScore(text),
      href: `https://x.com/${HANDLE}/status/${row.id}`,
    });
  }

  const newest = parsed
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .filter((post, index, all) => all.findIndex((item) => item.id === post.id) === index)
    .slice(0, PULL_LIMIT);
  return rankPosts(newest);
}

/** One timeline read. No retry, no pagination, no second request. */
export async function pullFromX(now = Date.now()): Promise<MuskPost[]> {
  const token = process.env.X_BEARER_TOKEN?.trim();
  if (!token) {
    throw new MuskTodayError("token", 0, "This host has no X bearer token, so nothing was pulled.");
  }

  const url = new URL(`https://api.x.com/2/users/${USER_ID}/tweets`);
  url.searchParams.set("max_results", String(PULL_LIMIT));
  url.searchParams.set("exclude", "retweets,replies");
  url.searchParams.set("tweet.fields", "created_at,public_metrics,note_tweet");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new MuskTodayError("network", 0, "X could not be reached.");
  }

  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    const failure = failureFromStatus(response.status);
    throw new MuskTodayError(failure, response.status, `X returned HTTP ${response.status}.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MuskTodayError("payload", 0, "X sent a response this desk could not read.");
  }
  return postsFromPayload(payload, now);
}

function normalizePost(raw: unknown): MuskPost | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MuskPost>;
  if (typeof row.id !== "string" || !/^\d{1,25}$/.test(row.id)) return null;
  if (typeof row.createdAt !== "string" || Number.isNaN(Date.parse(row.createdAt))) return null;
  const text = cleanText(typeof row.text === "string" ? row.text : "");
  const views = typeof row.views === "number" && Number.isFinite(row.views) && row.views >= 0 ? Math.floor(row.views) : null;
  return {
    id: row.id,
    text,
    createdAt: new Date(row.createdAt).toISOString(),
    views,
    investorScore: typeof row.investorScore === "number" && Number.isFinite(row.investorScore) ? row.investorScore : investorScore(text),
    href: `https://x.com/${HANDLE}/status/${row.id}`,
  };
}

export function normalizeCache(raw: unknown): MuskTodayCache | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MuskTodayCache>;
  const posts = Array.isArray(row.posts) ? rankPosts(row.posts.flatMap((item) => {
    const post = normalizePost(item);
    return post ? [post] : [];
  })) : [];
  const failure = typeof row.failure === "string" ? row.failure : null;
  const known: FailureCode[] = ["credits", "rate", "auth", "http", "network", "token", "payload", "read"];
  return {
    posts,
    updatedAt: typeof row.updatedAt === "string" && !Number.isNaN(Date.parse(row.updatedAt)) ? new Date(row.updatedAt).toISOString() : null,
    attemptedAt: typeof row.attemptedAt === "string" && !Number.isNaN(Date.parse(row.attemptedAt)) ? new Date(row.attemptedAt).toISOString() : null,
    stale: Boolean(row.stale),
    failure: failure && known.includes(failure as FailureCode) ? (failure as FailureCode) : null,
    failureStatus: typeof row.failureStatus === "number" && Number.isFinite(row.failureStatus) ? row.failureStatus : null,
  };
}

/**
 * Decide the next save. `write: null` means leave the bucket untouched
 * (the previous file could not be read, so replacing it might wipe a good save).
 */
export function nextCache(current: ReadState, outcome: PullOutcome, nowIso: string): { write: MuskTodayCache | null } {
  if (outcome.ok) {
    return {
      write: {
        posts: outcome.posts,
        updatedAt: nowIso,
        attemptedAt: nowIso,
        stale: false,
        failure: null,
        failureStatus: null,
      },
    };
  }
  if (current.kind === "error") return { write: null };
  if (current.kind === "ok") {
    return {
      write: {
        posts: current.cache.posts.map((post) => ({ ...post })),
        updatedAt: current.cache.updatedAt,
        attemptedAt: nowIso,
        stale: true,
        failure: outcome.failure,
        failureStatus: outcome.status || null,
      },
    };
  }
  return {
    write: {
      posts: [],
      updatedAt: null,
      attemptedAt: nowIso,
      stale: true,
      failure: outcome.failure,
      failureStatus: outcome.status || null,
    },
  };
}

function blobReady() {
  return Boolean(process.env.UPSTASH_BLOB_TOKEN?.trim());
}

function productionHost() {
  return process.env.VERCEL === "1";
}

function isNotFound(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "not_found");
}

async function readBlobState(): Promise<ReadState> {
  try {
    const { Bucket } = await import("@upstash/blob");
    const file = await Bucket.fromEnv().get(BLOB_PATH);
    const text = await new Response(file.body).text();
    const cache = normalizeCache(JSON.parse(text) as unknown);
    return cache ? { kind: "ok", cache } : { kind: "error" };
  } catch (error) {
    if (isNotFound(error)) return { kind: "missing" };
    return { kind: "error" };
  }
}

async function readLocalState(): Promise<ReadState> {
  try {
    const text = await readFile(LOCAL_FILE, "utf8");
    const cache = normalizeCache(JSON.parse(text) as unknown);
    return cache ? { kind: "ok", cache } : { kind: "error" };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? (error as { code?: string }).code : "";
    if (code === "ENOENT") return { kind: "missing" };
    return { kind: "error" };
  }
}

export async function readState(): Promise<ReadState> {
  if (blobReady()) return readBlobState();
  if (productionHost()) return { kind: "missing" };
  return readLocalState();
}

async function writeCache(cache: MuskTodayCache) {
  const body = JSON.stringify(cache);
  if (blobReady()) {
    const { Bucket } = await import("@upstash/blob");
    await Bucket.fromEnv().put(BLOB_PATH, body, {
      contentType: "application/json",
      cache: 60,
    });
    return;
  }
  if (productionHost()) {
    throw new Error("Musk today storage is not configured on this host.");
  }
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, body);
}

export async function readMuskToday(): Promise<MuskTodayCache> {
  const state = await readState();
  if (state.kind === "ok") return state.cache;
  if (state.kind === "missing") return emptyCache();
  return { ...emptyCache(), stale: true, failure: "read" };
}

export async function refreshMuskToday(now = new Date()): Promise<RefreshReport> {
  const current = await readState();
  let outcome: PullOutcome;
  try {
    outcome = { ok: true, posts: await pullFromX(now.getTime()) };
  } catch (error) {
    if (error instanceof MuskTodayError) outcome = { ok: false, failure: error.failure, status: error.status };
    else outcome = { ok: false, failure: "network", status: 0 };
    console.error("[musk-today] pull failed", outcome.ok ? "" : outcome.failure, outcome.ok ? "" : outcome.status);
  }

  const decision = nextCache(current, outcome, now.toISOString());
  const failure = outcome.ok ? null : outcome.failure;
  const status = outcome.ok ? null : outcome.status;
  if (!decision.write) {
    return { ok: false, kept: true, saved: false, untouched: true, failure, status, posts: null, updatedAt: null };
  }

  try {
    await writeCache(decision.write);
  } catch {
    console.error("[musk-today] cache write failed");
    return {
      ok: false,
      kept: current.kind === "ok",
      saved: false,
      untouched: true,
      failure: outcome.ok ? "store" : failure,
      status,
      posts: current.kind === "ok" ? current.cache.posts.length : 0,
      updatedAt: current.kind === "ok" ? current.cache.updatedAt : null,
    };
  }

  return {
    ok: outcome.ok,
    kept: !outcome.ok && current.kind === "ok",
    saved: true,
    untouched: false,
    failure,
    status,
    posts: decision.write.posts.length,
    updatedAt: decision.write.updatedAt,
  };
}

export type MuskTodayView = {
  posts: MuskPost[];
  updatedAt: string | null;
  notice: string | null;
  sortNote: string | null;
  emptyMessage: string | null;
};

function failureSentence(cache: MuskTodayCache) {
  switch (cache.failure) {
    case "credits":
      return "X returned HTTP 402. Credits are used up.";
    case "rate":
      return "X returned HTTP 429. The rate limit was hit.";
    case "auth":
      return `X refused this read${cache.failureStatus ? ` (HTTP ${cache.failureStatus})` : ""}.`;
    case "token":
      return "This host has no X bearer token, so nothing was pulled.";
    case "network":
      return "X could not be reached.";
    case "payload":
      return "X sent a response this desk could not read.";
    case "http":
      return `X returned HTTP ${cache.failureStatus ?? "error"}.`;
    case "read":
      return "The saved list could not be read just now. No posts are shown.";
    default:
      return "The pull did not succeed.";
  }
}

export function sortNote(posts: MuskPost[]) {
  if (!posts.length) return null;
  const known = posts.some((post) => post.views != null);
  const unknown = posts.some((post) => post.views == null);
  if (!known) return "X did not include view counts, so this list is newest first.";
  if (unknown) return "Highest views first. Posts without a view count are listed after.";
  return "Highest views first.";
}

export function presentMuskToday(cache: MuskTodayCache, now = Date.now()): MuskTodayView {
  const posts = rankPosts(cache.posts);
  const hasSaved = cache.updatedAt != null;
  const aged = hasSaved && now - Date.parse(cache.updatedAt as string) > STALE_AFTER_MS;
  let notice: string | null = null;
  if (cache.failure === "read") {
    notice = failureSentence(cache);
  } else if (cache.failure) {
    const when = cache.attemptedAt ? `Last try ${ny(cache.attemptedAt)}. ` : "";
    const tail = hasSaved ? "The last saved result was kept." : "No posts are saved yet.";
    notice = `${when}${failureSentence(cache)} ${tail}`;
  } else if (aged) {
    notice = `This saved list is from ${ny(cache.updatedAt)}, which is more than a day old. A newer pull has not replaced it.`;
  }

  let emptyMessage: string | null = null;
  if (!posts.length) {
    if (hasSaved && !cache.failure) emptyMessage = "The last pull found no posts from Elon Musk in the 24 hours before it.";
    else if (!notice) emptyMessage = "Nothing is saved yet. This page only lists posts from a successful pull. It does not invent any.";
  }

  return {
    posts,
    updatedAt: cache.updatedAt,
    notice,
    sortNote: sortNote(posts),
    emptyMessage,
  };
}

export function viewsLabel(views: number | null) {
  if (views == null) return "Views not included";
  return `${views.toLocaleString("en-US")} views`;
}
