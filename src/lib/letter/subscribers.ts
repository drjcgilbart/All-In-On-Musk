import { createHash, randomBytes } from "crypto";
import { Redis } from "@upstash/redis";

/** Production keys. Preview and local development add `:preview` or `:development`. */
export const LETTER_REDIS_NAMESPACE = "aiom:letter";

export type LetterSubscriber = {
  email: string;
  name: string;
  createdAt: string;
  token: string;
  status: "active" | "unsubscribed";
  unsubscribedAt?: string;
};

export type LetterSubscriberStore = {
  findByEmail(email: string): Promise<LetterSubscriber | null>;
  findByToken(token: string): Promise<LetterSubscriber | null>;
  save(subscriber: LetterSubscriber): Promise<void>;
  forget(email: string): Promise<void>;
  /** False when this IP is over the limit for the action. */
  allow(ip: string, action: "subscribe" | "unsubscribe"): Promise<boolean>;
};

type LetterRedis = {
  get(key: string): Promise<unknown>;
  set(key: string, value: string): Promise<unknown>;
  del(...keys: string[]): Promise<unknown>;
  sadd(key: string, member: string): Promise<unknown>;
  srem(key: string, member: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
};

const RATE_WINDOW_SECONDS = 10 * 60;
const RATE_LIMIT = 5;

export function letterRedisPrefix(env: { VERCEL_ENV?: string } = { VERCEL_ENV: process.env.VERCEL_ENV }) {
  const name = env.VERCEL_ENV?.trim() || "development";
  return name === "production" ? LETTER_REDIS_NAMESPACE : `${LETTER_REDIS_NAMESPACE}:${name}`;
}

export function letterRedisKeys(prefix = LETTER_REDIS_NAMESPACE) {
  return {
    subscribers: `${prefix}:subscribers`,
    record: (email: string) => `${prefix}:subscriber:${email}`,
    token: (token: string) => `${prefix}:token:${token}`,
    rate: (action: string, ipHash: string) => `${prefix}:ratelimit:${action}:${ipHash}`,
  };
}

export function normalizeLetterEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(email)) {
    return null;
  }
  const [local, domain] = email.split("@");
  if (!local || !domain || local.length > 64 || domain.includes("..") || local.includes("..")) return null;
  return email;
}

export function cleanLetterName(value: string) {
  return value.replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function letterToken() {
  return randomBytes(32).toString("hex");
}

export function validLetterToken(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

function ipHash(ip: string) {
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function readRecord(raw: unknown): LetterSubscriber | null {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<LetterSubscriber>;
  if (typeof row.email !== "string" || typeof row.token !== "string" || typeof row.createdAt !== "string") return null;
  if (row.status !== "active" && row.status !== "unsubscribed") return null;
  return {
    email: row.email,
    name: typeof row.name === "string" ? row.name : "",
    createdAt: row.createdAt,
    token: row.token,
    status: row.status,
    unsubscribedAt: typeof row.unsubscribedAt === "string" ? row.unsubscribedAt : undefined,
  };
}

export function memoryLetterStore(): LetterSubscriberStore {
  const byEmail = new Map<string, LetterSubscriber>();
  const byToken = new Map<string, string>();
  const hits = new Map<string, { count: number; reset: number }>();
  return {
    async findByEmail(email) {
      return byEmail.get(email) ?? null;
    },
    async findByToken(token) {
      const email = byToken.get(token);
      return email ? (byEmail.get(email) ?? null) : null;
    },
    async save(subscriber) {
      byEmail.set(subscriber.email, subscriber);
      byToken.set(subscriber.token, subscriber.email);
    },
    async forget(email) {
      const row = byEmail.get(email);
      if (row) byToken.delete(row.token);
      byEmail.delete(email);
    },
    async allow(ip, action) {
      const key = `${action}:${ipHash(ip)}`;
      const now = Date.now();
      const row = hits.get(key);
      if (!row || row.reset < now) {
        hits.set(key, { count: 1, reset: now + RATE_WINDOW_SECONDS * 1000 });
        return true;
      }
      row.count += 1;
      return row.count <= RATE_LIMIT;
    },
  };
}

export function redisLetterStore(redis: LetterRedis, prefix = letterRedisPrefix()): LetterSubscriberStore {
  const keys = letterRedisKeys(prefix);
  return {
    async findByEmail(email) {
      return readRecord(await redis.get(keys.record(email)));
    },
    async findByToken(token) {
      const email = await redis.get(keys.token(token));
      if (typeof email !== "string" || !email) return null;
      return readRecord(await redis.get(keys.record(email)));
    },
    async save(subscriber) {
      await redis.set(keys.record(subscriber.email), JSON.stringify(subscriber));
      await redis.set(keys.token(subscriber.token), subscriber.email);
      await redis.sadd(keys.subscribers, subscriber.email);
    },
    async forget(email) {
      const row = readRecord(await redis.get(keys.record(email)));
      await redis.srem(keys.subscribers, email);
      const drop = [keys.record(email)];
      if (row?.token) drop.push(keys.token(row.token));
      await redis.del(...drop);
    },
    async allow(ip, action) {
      const key = keys.rate(action, ipHash(ip));
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, RATE_WINDOW_SECONDS);
      return count <= RATE_LIMIT;
    },
  };
}

function redisFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim() || env.KV_REST_API_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim() || env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** Throws. The web routes turn that into a generic unavailable message. */
export function beehiivLetterStore(): LetterSubscriberStore {
  const unavailable = async () => {
    throw new Error("Letter list provider is not available.");
  };
  return {
    findByEmail: unavailable,
    findByToken: unavailable,
    save: unavailable,
    forget: unavailable,
    allow: unavailable,
  };
}

export function letterListProvider(env: NodeJS.ProcessEnv = process.env) {
  return env.LETTER_LIST_PROVIDER?.trim().toLowerCase() === "beehiiv" ? "beehiiv" : "redis";
}

export function getLetterSubscriberStore(env: NodeJS.ProcessEnv = process.env) {
  if (letterListProvider(env) === "beehiiv") return beehiivLetterStore();
  const redis = redisFromEnv(env);
  if (!redis) return null;
  return redisLetterStore(redis, letterRedisPrefix({ VERCEL_ENV: env.VERCEL_ENV }));
}

export type SubscribeResult = { ok: true; token?: string } | { ok: false; status: number; error: string };
export type UnsubscribeResult =
  | { ok: true; message: string }
  | { ok: false; status: number; error: string };

const NEUTRAL_REMOVAL = "If that address is on the list, it has been removed.";

export async function subscribeToLetter(
  store: LetterSubscriberStore,
  input: { email?: string; name?: string; company?: string },
  ip: string,
): Promise<SubscribeResult> {
  if (!(await store.allow(ip, "subscribe"))) {
    return { ok: false, status: 429, error: "Too many requests. Try again later." };
  }
  if (cleanLetterName(input.company || "")) return { ok: true };
  const email = normalizeLetterEmail(input.email || "");
  if (!email) return { ok: false, status: 400, error: "Enter a valid email." };
  const name = cleanLetterName(input.name || "");
  const existing = await store.findByEmail(email);
  if (existing?.status === "active") {
    if (name && name !== existing.name) {
      existing.name = name;
      await store.save(existing);
    }
    return { ok: true, token: existing.token };
  }
  if (existing) {
    existing.status = "active";
    existing.unsubscribedAt = undefined;
    if (name) existing.name = name;
    await store.save(existing);
    return { ok: true, token: existing.token };
  }
  const token = letterToken();
  await store.save({
    email,
    name,
    createdAt: new Date().toISOString(),
    token,
    status: "active",
  });
  return { ok: true, token };
}

export async function unsubscribeFromLetter(
  store: LetterSubscriberStore,
  input: { token?: string; email?: string },
  ip: string,
): Promise<UnsubscribeResult> {
  if (!(await store.allow(ip, "unsubscribe"))) {
    return { ok: false, status: 429, error: "Too many requests. Try again later." };
  }
  const token = (input.token || "").trim();
  if (token) {
    if (!validLetterToken(token)) return { ok: false, status: 400, error: "That link does not match a subscription." };
    const row = await store.findByToken(token);
    if (!row) return { ok: false, status: 400, error: "That link does not match a subscription." };
    await store.forget(row.email);
    return { ok: true, message: "You're off the list." };
  }
  const email = normalizeLetterEmail(input.email || "");
  if (!email) return { ok: false, status: 400, error: "Enter a valid email." };
  const row = await store.findByEmail(email);
  if (row) await store.forget(row.email);
  return { ok: true, message: NEUTRAL_REMOVAL };
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "local";
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0]?.trim();
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
