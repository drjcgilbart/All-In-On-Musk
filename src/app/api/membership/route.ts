import { NextResponse } from "next/server";
import { sendMembershipMail } from "@/lib/membership/mail";
import { hashMembershipPassword, markLatestMembershipMailed, saveMembershipRequest, type MembershipRequest } from "@/lib/membership/store";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, { count: number; reset: number }>();

function allowed(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const key = forwarded.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.reset < now) {
    hits.set(key, { count: 1, reset: now + 10 * 60 * 1000 });
    return true;
  }
  row.count += 1;
  return row.count <= 5;
}

function clean(value: unknown, max: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function PATCH(request: Request) {
  if (!allowed(request)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  const email = clean((body as { email?: string }).email, 120).toLowerCase();
  const detail = clean((body as { detail?: string }).detail, 180);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }
  await markLatestMembershipMailed(email, detail || "Sent from the membership form.");
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!allowed(request)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  const body = await request.json().catch(() => ({}));
  if (clean((body as { company?: string }).company, 80)) {
    return NextResponse.json({ ok: true, message: "Request sent. The admin will review it." });
  }
  const name = clean((body as { name?: string }).name, 80);
  const email = clean((body as { email?: string }).email, 120).toLowerCase();
  const password = String((body as { password?: string }).password || "");
  const phone = clean((body as { phone?: string }).phone, 40);
  const area = clean((body as { area?: string }).area, 80);
  if (name.length < 2) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const mail = await sendMembershipMail({ name, email, phone, area }, "https://allinonmusk.com");
  const row: MembershipRequest = {
    id: randomBytes(8).toString("hex"),
    name,
    email,
    phone,
    area,
    passwordHash: hashMembershipPassword(password),
    createdAt: new Date().toISOString(),
    mailed: mail.ok,
    mailDetail: mail.detail,
  };
  let stored = false;
  try {
    await saveMembershipRequest(row);
    stored = true;
  } catch {
    stored = false;
  }
  if (!mail.ok && !stored) {
    return NextResponse.json({ error: "The request could not be sent. Try again in a minute." }, { status: 503 });
  }
  const needsActivation = /activat/i.test(mail.detail);
  return NextResponse.json({
    ok: true,
    mailed: mail.ok,
    mailDetail: mail.detail,
    message: mail.ok
      ? "Request sent. The admin will review your free membership."
      : needsActivation
        ? "Request saved. The admin will review your free membership."
        : "Your request is saved on this desk. The email to the admin did not send, so try again later if you do not hear back.",
  });
}
