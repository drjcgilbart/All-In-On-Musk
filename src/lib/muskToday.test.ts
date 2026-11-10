import assert from "node:assert/strict";
import test from "node:test";
import {
  MuskTodayError,
  comparePosts,
  emptyCache,
  nextCache,
  postsFromPayload,
  presentMuskToday,
  pullFromX,
  type MuskPost,
} from "./muskToday";

const NOW = Date.parse("2026-11-10T14:00:00.000Z");

function post(overrides: Partial<MuskPost> = {}): MuskPost {
  return {
    id: "1",
    text: "Hello",
    createdAt: new Date(NOW - 60 * 60 * 1000).toISOString(),
    views: 10,
    investorScore: 0,
    href: "https://x.com/elonmusk/status/1",
    ...overrides,
  };
}

function tweet(id: string, hoursAgo: number, views: number | null, text: string) {
  return {
    id,
    text,
    created_at: new Date(NOW - hoursAgo * 60 * 60 * 1000).toISOString(),
    public_metrics: views == null ? {} : { impression_count: views },
  };
}

test("ranks by views and uses investor score only as a tie-break", () => {
  const low = post({ id: "low", views: 9, text: "Tesla earnings beat", investorScore: 2 });
  const plain = post({ id: "plain", views: 20, text: "Nice weather", investorScore: 0 });
  const tesla = post({ id: "tesla", views: 20, text: "Tesla production update", investorScore: 2 });
  const ranked = [low, plain, tesla].sort(comparePosts).map((item) => item.id);
  assert.deepEqual(ranked, ["tesla", "plain", "low"]);
});

test("missing view counts do not get ranked by the investor score", () => {
  const unscored = post({ id: "new", views: null, investorScore: 0, createdAt: new Date(NOW - 1000).toISOString() });
  const scored = post({ id: "old", views: null, investorScore: 5, createdAt: new Date(NOW - 5000).toISOString() });
  const known = post({ id: "known", views: 1, investorScore: 0, createdAt: new Date(NOW - 9000).toISOString() });
  assert.deepEqual([scored, unscored, known].sort(comparePosts).map((item) => item.id), ["known", "new", "old"]);
});

test("keeps the last 24 hours, prefers the full note text, and links to X", () => {
  const posts = postsFromPayload({
    data: [
      tweet("10", 30, 9999, "Too old"),
      tweet("11", 2, 5, "short"),
      {
        ...tweet("12", 1, 5, "truncated"),
        note_tweet: { text: "Tesla full text" },
      },
      tweet("13", 3, 50, "SpaceX launch window"),
      { ...tweet("14", 1, 100, "RT @someone copied"), text: "RT @someone copied" },
      { ...tweet("15", 1, 80, "a reply"), in_reply_to_user_id: "99" },
    ],
  }, NOW);
  assert.deepEqual(posts.map((item) => item.id), ["13", "12", "11"]);
  assert.equal(posts[1].text, "Tesla full text");
  assert.equal(posts[1].investorScore > posts[2].investorScore, true);
  assert.equal(posts[0].href, "https://x.com/elonmusk/status/13");
});

test("an error payload does not become an empty success", () => {
  assert.throws(() => postsFromPayload({ errors: [{ message: "credits" }], status: 402 }, NOW), MuskTodayError);
});

test("a failed pull keeps the saved posts and does not write when the save cannot be read", () => {
  const saved = {
    ...emptyCache(),
    posts: [post({ id: "kept", text: "Real saved post", views: 40 })],
    updatedAt: "2026-11-09T09:15:00.000Z",
  };
  const kept = nextCache({ kind: "ok", cache: saved }, { ok: false, failure: "credits", status: 402 }, "2026-11-10T09:15:00.000Z");
  assert.equal(kept.write?.posts[0].id, "kept");
  assert.equal(kept.write?.posts[0].text, "Real saved post");
  assert.equal(kept.write?.updatedAt, "2026-11-09T09:15:00.000Z");
  assert.equal(kept.write?.stale, true);
  assert.equal(kept.write?.failure, "credits");

  const untouched = nextCache({ kind: "error" }, { ok: false, failure: "credits", status: 402 }, "2026-11-10T09:15:00.000Z");
  assert.equal(untouched.write, null);

  const empty = nextCache({ kind: "missing" }, { ok: false, failure: "rate", status: 429 }, "2026-11-10T09:15:00.000Z");
  assert.deepEqual(empty.write?.posts, []);
  assert.equal(empty.write?.updatedAt, null);
  assert.equal(empty.write?.failure, "rate");
});

test("a good pull replaces the save", () => {
  const saved = { ...emptyCache(), posts: [post({ id: "old" })], updatedAt: "2026-11-09T09:15:00.000Z" };
  const next = nextCache({ kind: "ok", cache: saved }, { ok: true, posts: [post({ id: "new", views: 3 })] }, "2026-11-10T09:15:00.000Z");
  assert.deepEqual(next.write?.posts.map((item) => item.id), ["new"]);
  assert.equal(next.write?.stale, false);
  assert.equal(next.write?.failure, null);
  assert.equal(next.write?.updatedAt, "2026-11-10T09:15:00.000Z");
});

test("the page stays honest with an empty cache and with a credit failure", () => {
  const empty = presentMuskToday(emptyCache(), NOW);
  assert.equal(empty.posts.length, 0);
  assert.match(empty.emptyMessage ?? "", /does not invent/);
  assert.equal(empty.notice, null);

  const failed = presentMuskToday({
    ...emptyCache(),
    posts: [post({ id: "kept", text: "Saved post" })],
    updatedAt: "2026-10-30T09:15:00.000Z",
    attemptedAt: "2026-11-10T09:15:00.000Z",
    stale: true,
    failure: "credits",
    failureStatus: 402,
  }, NOW);
  assert.equal(failed.posts.length, 1);
  assert.match(failed.notice ?? "", /HTTP 402/);
  assert.match(failed.notice ?? "", /last saved result was kept/i);
  assert.doesNotMatch(failed.notice ?? "", /test-token|Bearer /);
});

test("402 and a missing token each make one decision and do not retry", async () => {
  const original = globalThis.fetch;
  const previous = process.env.X_BEARER_TOKEN;
  try {
    delete process.env.X_BEARER_TOKEN;
    let calls = 0;
    globalThis.fetch = () => {
      calls += 1;
      throw new Error("fetch should not run");
    };
    await assert.rejects(() => pullFromX(NOW), (error: unknown) => error instanceof MuskTodayError && error.failure === "token");
    assert.equal(calls, 0);

    calls = 0;
    process.env.X_BEARER_TOKEN = "test-token-not-real";
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("no credits", { status: 402 });
    };
    await assert.rejects(() => pullFromX(NOW), (error: unknown) => {
      return error instanceof MuskTodayError && error.failure === "credits" && error.status === 402;
    });
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
    if (previous === undefined) delete process.env.X_BEARER_TOKEN;
    else process.env.X_BEARER_TOKEN = previous;
  }
});
