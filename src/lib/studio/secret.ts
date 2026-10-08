import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_FILE = path.join(process.cwd(), "data", "studio-password.json");
const RECORD_KEY = "deskPasswordHash";
const TEAM_ID = "team_gplq57jkUzmg6wm7asnQQ548";

function recordOk(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{32}:[0-9a-f]{64}$/.test(value);
}

export function hashStudioPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyStudioPassword(password: string, record: string) {
  const [salt, expectedHex] = record.split(":");
  if (!salt || !expectedHex || !/^[0-9a-f]{32}$/.test(salt) || !/^[0-9a-f]{64}$/.test(expectedHex)) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function remoteConfigured() {
  return Boolean(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG);
}

function configId() {
  const connection = process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG || "";
  if (!connection) return "";
  try {
    return new URL(connection).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
}

async function readRemote() {
  const { get } = await import("@vercel/global-config");
  const value = await get(RECORD_KEY);
  return recordOk(value) ? value : null;
}

async function readLocal() {
  try {
    const parsed = JSON.parse(await readFile(LOCAL_FILE, "utf8")) as { hash?: unknown };
    return recordOk(parsed.hash) ? parsed.hash : null;
  } catch {
    return null;
  }
}

function canWriteRemote() {
  return Boolean(configId() && process.env.STUDIO_CONFIG_TOKEN);
}

export async function readPasswordRecord() {
  if (process.env.VERCEL === "1" || canWriteRemote()) {
    if (!remoteConfigured()) return null;
    try {
      return await readRemote();
    } catch {
      return null;
    }
  }
  return readLocal();
}

async function writeLocal(record: string) {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify({ hash: record }, null, 2));
}

async function waitUntilVisible(record: string) {
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      if ((await readRemote()) === record) return;
    } catch {
      // Keep checking until the saved password is visible.
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

export async function writePasswordRecord(record: string) {
  if (!recordOk(record)) throw new Error("Could not save the new password.");
  const id = configId();
  const token = process.env.STUDIO_CONFIG_TOKEN || "";
  if (id && token) {
    const team = process.env.VERCEL_ORG_ID || TEAM_ID;
    const response = await fetch(`https://api.vercel.com/v1/global-config/${id}/items?teamId=${encodeURIComponent(team)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ operation: "upsert", key: RECORD_KEY, value: record }],
      }),
    });
    if (!response.ok) throw new Error("Could not save the new password.");
    await waitUntilVisible(record);
    return;
  }
  if (process.env.VERCEL === "1") throw new Error("Could not save the new password.");
  await writeLocal(record);
}
