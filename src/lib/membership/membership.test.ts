import assert from "node:assert/strict";
import { readFile, unlink } from "node:fs/promises";
import { describe, test } from "node:test";
import { POST } from "../../app/api/membership/route";
import { membershipAck, membershipFromAddress, sendMembershipMail, type MembershipMail } from "./mail";
import {
  hashMembershipPassword,
  listMembershipRequests,
  markLatestMembershipMailed,
  membershipRedisKey,
  saveMembershipRequest,
  type MembershipRequest,
} from "./store";

const sample: MembershipMail = { name: "Ada Tester", email: "ada@example.com", phone: "", area: "Austin" };
const LOCAL_FILE = `${process.cwd()}/data/membership-requests.json`;

function row(partial: Partial<MembershipRequest> = {}): MembershipRequest {
  return {
    id: "abc",
    name: "Ada Tester",
    email: "ada@example.com",
    phone: "",
    area: "Austin",
    passwordHash: "salt:hash",
    createdAt: "2026-01-01T00:00:00.000Z",
    mailed: false,
    mailDetail: "",
    ...partial,
  };
}

test("sender uses membership from, then order mail, then the old default", () => {
  assert.equal(
    membershipFromAddress({ MEMBERSHIP_FROM: " Membership <m@example.com> ", ORDER_MAIL_FROM: "Orders <o@example.com>" }),
    "Membership <m@example.com>",
  );
  assert.equal(membershipFromAddress({ ORDER_MAIL_FROM: " Orders <o@example.com> " }), "Orders <o@example.com>");
  assert.equal(membershipFromAddress({}), "All In On Musk <onboarding@resend.dev>");
});

test("preview requests use their own redis list", () => {
  assert.equal(membershipRedisKey({ VERCEL_ENV: "production" }), "membership:requests");
  assert.equal(membershipRedisKey({ VERCEL_ENV: "preview" }), "membership:requests:preview");
  assert.equal(membershipRedisKey({}), "membership:requests:development");
});

test("mail reports success only after a real send, and resend failure tries the form", async () => {
  const previous = {
    key: process.env.RESEND_API_KEY,
    from: process.env.MEMBERSHIP_FROM,
    order: process.env.ORDER_MAIL_FROM,
  };
  process.env.RESEND_API_KEY = "test-key";
  delete process.env.MEMBERSHIP_FROM;
  process.env.ORDER_MAIL_FROM = "Shop <orders@example.com>";
  try {
    const calls: string[] = [];
    const fallback: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(url);
      const body = JSON.parse(String(init?.body)) as { from?: string; email?: string };
      if (url.includes("api.resend.com")) {
        assert.equal(body.from, "Shop <orders@example.com>");
        return new Response("no", { status: 403 });
      }
      assert.match(url, /formsubmit\.co\/ajax\/admin@allinonmusk\.com/);
      assert.equal(body.email, sample.email);
      return Response.json({ success: true, message: "Sent to the admin inbox." });
    };
    const mailed = await sendMembershipMail(sample, "https://allinonmusk.com", fallback);
    assert.equal(mailed.ok, true);
    assert.equal(mailed.detail, "Sent to the admin inbox.");
    assert.deepEqual(
      calls.map((url) => (url.includes("resend") ? "resend" : "form")),
      ["resend", "form"],
    );

    process.env.MEMBERSHIP_FROM = "Desk <desk@example.com>";
    const onlyResend: typeof fetch = async (input, init) => {
      const body = JSON.parse(String(init?.body)) as { from?: string };
      assert.equal(body.from, "Desk <desk@example.com>");
      assert.match(String(input), /api\.resend\.com/);
      return Response.json({ id: "email_1" });
    };
    const sent = await sendMembershipMail(sample, "https://allinonmusk.com", onlyResend);
    assert.equal(sent.ok, true);
    assert.equal(sent.detail, "Sent with the mail provider.");

    const afterThrow = await sendMembershipMail(sample, "https://allinonmusk.com", async (input) => {
      if (String(input).includes("resend")) throw new Error("network down");
      return Response.json({ success: "true", message: "Sent to the admin inbox." });
    });
    assert.equal(afterThrow.ok, true);

    delete process.env.RESEND_API_KEY;
    const urls: string[] = [];
    await sendMembershipMail(sample, "https://allinonmusk.com", async (input) => {
      urls.push(String(input));
      return Response.json({ success: true, message: "Sent to the admin inbox." });
    });
    assert.deepEqual(urls.map((url) => (url.includes("formsubmit") ? "form" : "other")), ["form"]);

    process.env.RESEND_API_KEY = "test-key";
    const failed = await sendMembershipMail(sample, "https://allinonmusk.com", async (input) => {
      if (String(input).includes("resend")) return new Response("no", { status: 422 });
      return Response.json({ success: false, message: "This form needs Activation." });
    });
    assert.equal(failed.ok, false);
    assert.match(failed.detail, /Mail provider 422/);
    assert.match(failed.detail, /Activation/);
  } finally {
    if (previous.key === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous.key;
    if (previous.from === undefined) delete process.env.MEMBERSHIP_FROM;
    else process.env.MEMBERSHIP_FROM = previous.from;
    if (previous.order === undefined) delete process.env.ORDER_MAIL_FROM;
    else process.env.ORDER_MAIL_FROM = previous.order;
  }
});

test("the route acknowledges a request only when it was stored or mailed", () => {
  const saved = membershipAck({ mailOk: false, stored: true, mailDetail: "Email did not send." });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.stored, true);
  assert.equal(saved.body.mailed, false);
  assert.match(saved.body.message || "", /saved/i);

  const sent = membershipAck({ mailOk: true, stored: false, mailDetail: "Sent with the mail provider." });
  assert.equal(sent.status, 200);
  assert.equal(sent.body.mailed, true);
  assert.equal(sent.body.stored, false);

  const neither = membershipAck({
    mailOk: false,
    stored: false,
    mailDetail: "Mail provider 403 This form needs Activation.",
  });
  assert.equal(neither.status, 503);
  assert.equal(neither.body.ok, undefined);
  assert.equal(neither.body.mailed, false);
  assert.equal(neither.body.stored, false);
  assert.match(neither.body.mailDetail, /Activation/);

  const hidden = membershipAck({ mailOk: false, stored: true, mailDetail: "Mail provider 403 account body" });
  assert.equal(hidden.body.mailDetail, "Email did not send.");
});

test("saved requests keep the password hash out of the admin view", async () => {
  const slots: Array<MembershipRequest | null> = [
    row({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" }),
    null,
    row({ id: "newer", createdAt: "2026-03-01T00:00:00.000Z" }),
  ];
  const list = {
    async push(item: MembershipRequest) {
      slots.push(item);
    },
    async read() {
      return slots;
    },
    async replace(index: number, item: MembershipRequest) {
      slots[index] = item;
    },
  };
  await markLatestMembershipMailed("ada@example.com", "Sent from the membership form.", list);
  assert.equal(slots[0]?.mailed, false);
  assert.equal(slots[2]?.mailed, true);
  assert.equal(slots[2]?.mailDetail, "Sent from the membership form.");
  const views = await listMembershipRequests(list);
  assert.deepEqual(views.map((item) => item.id), ["newer", "older"]);
  assert.equal("passwordHash" in views[0], false);
  assert.equal(slots[2]?.passwordHash, "salt:hash");
  assert.match(hashMembershipPassword("correct horse battery"), /^[a-f0-9]{32}:[a-f0-9]{64}$/);
});

describe("storage backend", { concurrency: 1 }, () => {
  test("vercel without redis does not use the local file", async () => {
    const previous = process.env.VERCEL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.VERCEL = "1";
    try {
      await assert.rejects(() => saveMembershipRequest(row({ id: "cloud" })), /not configured/);
      assert.deepEqual(await listMembershipRequests(), []);
      await markLatestMembershipMailed("ada@example.com", "ignored");
    } finally {
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });

  test("local development stores requests in the gitignored file", async () => {
    const previous = process.env.VERCEL;
    delete process.env.VERCEL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    await unlink(LOCAL_FILE).catch(() => undefined);
    try {
      await saveMembershipRequest(row({ id: "file-1", email: "file@example.com" }));
      await markLatestMembershipMailed("file@example.com", "Sent from the membership form.");
      const saved = await listMembershipRequests();
      assert.equal(saved.length, 1);
      assert.equal(saved[0]?.email, "file@example.com");
      assert.equal(saved[0]?.mailed, true);
      assert.equal("passwordHash" in (saved[0] || {}), false);
      const raw = JSON.parse(await readFile(LOCAL_FILE, "utf8")) as Array<{ passwordHash?: string }>;
      assert.equal(raw[0]?.passwordHash, "salt:hash");
    } finally {
      await unlink(LOCAL_FILE).catch(() => undefined);
      if (previous === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous;
    }
  });

  test("the route stores a local request and does not claim success when nothing worked", async () => {
    const previous = {
      vercel: process.env.VERCEL,
      key: process.env.RESEND_API_KEY,
      fetch: globalThis.fetch,
    };
    delete process.env.VERCEL;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.RESEND_API_KEY = "test-key";
    await unlink(LOCAL_FILE).catch(() => undefined);
    const calls: string[] = [];
    const send = (body: unknown, ip: string) =>
      POST(
        new Request("https://allinonmusk.com/api/membership", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify(body),
        }),
      );
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("api.resend.com")) return new Response("no", { status: 403 });
      if (url.includes("formsubmit.co")) return Response.json({ success: true, message: "Sent to the admin inbox." });
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;
    try {
      const honeypot = await send(
        { name: "Bot", email: "bot@example.com", password: "longpassword", company: "spam" },
        "203.0.113.20",
      );
      assert.equal(honeypot.status, 200);
      assert.equal((await honeypot.json()).mailed, true);
      assert.equal(calls.length, 0);

      const invalid = await send({ name: "Ada Tester", email: "ada@example.com", password: "short" }, "203.0.113.21");
      assert.equal(invalid.status, 400);
      assert.equal(calls.length, 0);

      const ok = await send(
        { name: "Ada Tester", email: "Ada@Example.com", password: "longpassword", phone: "555", area: "Austin" },
        "203.0.113.22",
      );
      assert.equal(ok.status, 200);
      const body = await ok.json();
      assert.equal(body.ok, true);
      assert.equal(body.mailed, true);
      assert.equal(body.stored, true);
      assert.equal(body.passwordHash, undefined);
      assert.deepEqual(
        calls.map((url) => (url.includes("resend") ? "resend" : "form")),
        ["resend", "form"],
      );
      const raw = JSON.parse(await readFile(LOCAL_FILE, "utf8")) as Array<{ email?: string; passwordHash?: string }>;
      assert.equal(raw[0]?.email, "ada@example.com");
      assert.match(raw[0]?.passwordHash || "", /:/);

      calls.length = 0;
      globalThis.fetch = (async () => new Response("no", { status: 500 })) as typeof fetch;
      process.env.VERCEL = "1";
      await unlink(LOCAL_FILE).catch(() => undefined);
      const failed = await send({ name: "Ada Tester", email: "ada@example.com", password: "longpassword" }, "203.0.113.23");
      assert.equal(failed.status, 503);
      const failedBody = await failed.json();
      assert.equal(failedBody.stored, false);
      assert.equal(failedBody.mailed, false);
      assert.equal(failedBody.ok, undefined);
      await assert.rejects(() => readFile(LOCAL_FILE, "utf8"));
    } finally {
      globalThis.fetch = previous.fetch;
      if (previous.vercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previous.vercel;
      if (previous.key === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previous.key;
      await unlink(LOCAL_FILE).catch(() => undefined);
    }
  });
});
