const hits = new Map<string, { count: number; reset: number }>();

export function studioAttemptAllowed(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const key = forwarded.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.reset < now) {
    hits.set(key, { count: 1, reset: now + 10 * 60 * 1000 });
    return { ok: true, retryAfterSec: 0 };
  }
  row.count += 1;
  if (row.count > 8) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((row.reset - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clearStudioAttempts(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  hits.delete(forwarded.split(",")[0]?.trim() || "local");
}
