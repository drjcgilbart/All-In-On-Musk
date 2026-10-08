import { randomBytes, scryptSync } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const LOCAL_FILE = path.join(process.cwd(), "data", "membership-requests.json");
const BLOB_PATH = "membership/requests.json";

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

function blobReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function productionHost() {
  return process.env.VERCEL === "1";
}

function asList(raw: unknown): MembershipRequest[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === "object" && typeof (item as MembershipRequest).email === "string") as MembershipRequest[];
}

async function readLocal() {
  try {
    return asList(JSON.parse(await readFile(LOCAL_FILE, "utf8")));
  } catch {
    return [];
  }
}

async function writeLocal(rows: MembershipRequest[]) {
  await mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await writeFile(LOCAL_FILE, JSON.stringify(rows, null, 2));
}

async function readBlob() {
  const { head } = await import("@vercel/blob");
  try {
    const meta = await head(BLOB_PATH);
    const response = await fetch(meta.url, { cache: "no-store" });
    if (!response.ok) return [];
    return asList(await response.json());
  } catch {
    return [];
  }
}

async function writeBlob(rows: MembershipRequest[]) {
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATH, JSON.stringify(rows), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
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

export async function listMembershipRequests(): Promise<MembershipView[]> {
  const rows = blobReady() ? await readBlob() : productionHost() ? [] : await readLocal();
  return rows.map(toView).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function saveMembershipRequest(row: MembershipRequest) {
  if (blobReady()) {
    const rows = await readBlob();
    rows.push(row);
    await writeBlob(rows);
    return;
  }
  if (productionHost()) {
    throw new Error("Membership storage is not configured on this host.");
  }
  const rows = await readLocal();
  rows.push(row);
  await writeLocal(rows);
}

export async function markLatestMembershipMailed(email: string, detail: string) {
  const apply = (rows: MembershipRequest[]) => {
    const match = [...rows].reverse().find((row) => row.email === email && !row.mailed);
    if (!match) return false;
    match.mailed = true;
    match.mailDetail = detail || "Sent from the membership form.";
    return true;
  };
  if (blobReady()) {
    const rows = await readBlob();
    if (!apply(rows)) return;
    await writeBlob(rows);
    return;
  }
  if (productionHost()) return;
  const rows = await readLocal();
  if (!apply(rows)) return;
  await writeLocal(rows);
}
