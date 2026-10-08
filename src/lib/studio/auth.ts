import { createHmac, timingSafeEqual } from "node:crypto";
import { readPasswordRecord, verifyStudioPassword } from "@/lib/studio/secret";

export const STUDIO_COOKIE = "aim_studio";

/** The desk sign-in username is this email address. */
export const STUDIO_LOGIN_EMAIL = "dr.gilbart@comcast.net";

function envPassword() {
  return process.env.STUDIO_PASSWORD || "";
}

function recordOk(value: string) {
  return /^[0-9a-f]{32}:[0-9a-f]{64}$/.test(value);
}

async function secretMaterial() {
  const record = await readPasswordRecord();
  if (record) return record;
  return envPassword();
}

function secretsMatch(given: string, expected: string) {
  if (!given || given.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < given.length; i++) mismatch |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export function studioEmailMatches(value: string) {
  const given = value.trim().toLowerCase();
  const expected = STUDIO_LOGIN_EMAIL;
  if (!given || given.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < given.length; i++) mismatch |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

export async function passwordMatches(given: string) {
  const current = await secretMaterial();
  if (recordOk(current)) return verifyStudioPassword(given, current);
  return secretsMatch(given, current);
}

export async function studioConfigured() {
  return (await secretMaterial()).length >= 8;
}

export function tokenFor(material: string) {
  return createHmac("sha256", material).update("aim-studio-v1").digest("hex");
}

export async function studioToken() {
  return tokenFor(await secretMaterial());
}

export async function studioTokenMatches(value: string | undefined) {
  if (!(await studioConfigured()) || !value) return false;
  const expected = Buffer.from(await studioToken());
  const given = Buffer.from(value);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function studioCookieValue(header: string | null | undefined) {
  const cookie = header || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STUDIO_COOKIE}=`))
    ?.slice(STUDIO_COOKIE.length + 1);
  return token ? decodeURIComponent(token) : "";
}

export async function studioRequestAuthenticated(request: Request) {
  return studioTokenMatches(studioCookieValue(request.headers.get("cookie")));
}

export function studioCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  };
}
