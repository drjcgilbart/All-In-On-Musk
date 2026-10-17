// Dedupe store for processed Stripe sessions.
// Production: Upstash Redis (free tier) or Vercel KV when its REST env vars are set
//   (UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN or KV_REST_API_URL/KV_REST_API_TOKEN).
// Fallback: in-memory + a JSON file in .data/ (fine locally / single server; NOT shared across Vercel instances).
// Printful's `external_id` (derived from the session id) is a second line of defence: Printful rejects duplicates.
import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

export interface DedupeStore {
  has(id: string): Promise<boolean>;
  add(id: string): Promise<void>;
  remove(id: string): Promise<void>;
  /** Atomically claim an id. Returns false if it was already claimed. */
  claim?(id: string): Promise<boolean>;
}

export function memoryStore(): DedupeStore {
  const s = new Set<string>();
  return {
    has: async (id) => s.has(id),
    add: async (id) => void s.add(id),
    remove: async (id) => void s.delete(id),
    claim: async (id) => (s.has(id) ? false : (s.add(id), true)),
  };
}

export function fileStore(file = path.join(process.cwd(), ".data", "processed-sessions.json")): DedupeStore {
  const read = (): string[] => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; } };
  const write = (ids: string[]) => { try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(ids)); } catch { /* read-only FS */ } };
  const mem = new Set(read());
  return {
    has: async (id) => mem.has(id),
    add: async (id) => { mem.add(id); write([...mem]); },
    remove: async (id) => { mem.delete(id); write([...mem]); },
  };
}

const KEY = (id: string) => `shop:stripe-session:${id}`;
const TTL_SECONDS = 60 * 60 * 24 * 90; // Stripe retries for up to 3 days; keep 90 for audit

export function redisStore(redis: Pick<Redis, "get" | "set" | "del">): DedupeStore {
  return {
    has: async (id) => (await redis.get(KEY(id))) !== null,
    add: async (id) => { await redis.set(KEY(id), Date.now(), { ex: TTL_SECONDS }); },
    remove: async (id) => { await redis.del(KEY(id)); },
    claim: async (id) => (await redis.set(KEY(id), Date.now(), { nx: true, ex: TTL_SECONDS })) === "OK",
  };
}

export function redisFromEnv(env: NodeJS.ProcessEnv = process.env): Redis | null {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

let defaultStore: DedupeStore | null = null;
export function getDedupeStore() {
  if (defaultStore) return defaultStore;
  const redis = redisFromEnv();
  return (defaultStore = redis ? redisStore(redis) : fileStore());
}
