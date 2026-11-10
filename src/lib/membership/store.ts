import { randomBytes, scryptSync } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";

const LOCAL_FILE = path.join(process.cwd(), "data", "membership-requests.json");

// Rows include password hashes. Keep them in private Redis, or in the local
// file when developing off Vercel. Do not write them to a public blob bucket.
const PRODUCTION_KEY = "membership:requests";

export type MembershipRequest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  passwordHash: string;
  createdAt: string;
  mailed: boolean;
  mailDetail: string;
};

export type MembershipView = Omit<MembershipRequest, "passwordHash">;

type MembershipList = {
  push(row: MembershipRequest): Promise<void>;
  read(): Promise<Array<MembershipRequest | null>>;
  replace(index: number, row: MembershipRequest): Promise<void>;
};

export function membershipRedisKey(env?: { VERCEL_ENV?: string }) {
  const name = (env?.VERCEL_ENV ?? process.env.VERCEL_ENV)?.trim() || "development";
  return name === "production" ? PRODUCTION_KEY : `${PRODUCTION_KEY}:${name}`;
}

function redisFromEnv(env: NodeJS.ProcessEnv = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim() || env.KV_REST_API_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim() || env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function onVercel(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL === "1";
}

function parseRow(item: unknown): MembershipRequest | null {
  let value = item;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const row = value as Partial<MembershipRequest>;
  if (typeof row.id !== "string" || typeof row.email !== "string" || typeof row.passwordHash !== "string") return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    email: row.email,
    phone: typeof row.phone === "string" ? row.phone : "",
    area: typeof row.area === "string" ? row.area : "",
    passwordHash: row.passwordHash,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    mailed: row.mailed === true,
    mailDetail: typeof row.mailDetail === "string" ? row.mailDetail : "",
  };
}

function parseList(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseRow);
}

function latestUnmailedIndex(rows: Array<MembershipRequest | null>, email: string) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row && row.email === email && !row.mailed) return index;
  }
  return -1;
}

async function readLocal() {
  try {
    return parseList(JSON.parse(await readFile(LOCAL_FILE, "utf8")));
  } catch {
    return [];
  }
}

async function writeLocal(rows: Array<MembershipRequest | null>) {
  const kept = rows.filter((row): row is MembershipRequest => row !== null);
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(kept, null, 2));
}

function fileList(): MembershipList {
  return {
    async push(row) {
      const rows = await readLocal();
      rows.push(row);
      await writeLocal(rows);
    },
    read: readLocal,
    async replace(index, row) {
      const rows = await readLocal();
      if (!rows[index]) return;
      rows[index] = row;
      await writeLocal(rows);
    },
  };
}

function redisList(redis: Redis, key: string): MembershipList {
  return {
    async push(row) {
      await redis.rpush(key, row);
    },
    async read() {
      return parseList(await redis.lrange(key, 0, -1));
    },
    async replace(index, row) {
      await redis.lset(key, index, row);
    },
  };
}

async function resolveList(env: NodeJS.ProcessEnv = process.env): Promise<MembershipList | "unconfigured"> {
  const redis = redisFromEnv(env);
  if (redis) return redisList(redis, membershipRedisKey({ VERCEL_ENV: env.VERCEL_ENV }));
  if (onVercel(env)) return "unconfigured";
  return fileList();
}

export function hashMembershipPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function toView(row: MembershipRequest): MembershipView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    area: row.area,
    createdAt: row.createdAt,
    mailed: row.mailed,
    mailDetail: row.mailDetail,
  };
}

async function openList(list?: MembershipList) {
  return list ?? (await resolveList());
}

export async function listMembershipRequests(list?: MembershipList): Promise<MembershipView[]> {
  const store = await openList(list);
  if (store === "unconfigured") return [];
  const rows = await store.read();
  return rows
    .filter((row): row is MembershipRequest => row !== null)
    .map(toView)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveMembershipRequest(row: MembershipRequest, list?: MembershipList) {
  const store = await openList(list);
  if (store === "unconfigured") {
    throw new Error("Membership storage is not configured on this host.");
  }
  await store.push(row);
}

export async function markLatestMembershipMailed(email: string, detail: string, list?: MembershipList) {
  const store = await openList(list);
  if (store === "unconfigured") return;
  const rows = await store.read();
  const index = latestUnmailedIndex(rows, email);
  const current = index >= 0 ? rows[index] : null;
  if (!current) return;
  await store.replace(index, {
    ...current,
    mailed: true,
    mailDetail: detail || "Sent from the membership form.",
  });
}
