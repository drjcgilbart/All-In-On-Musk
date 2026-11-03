// Privacy-friendly /shop visit counter: only aggregate integers in Redis.
// No IPs, cookies, user agents or any personal data are read or stored.
export const TOTAL_KEY = "shop:visits:total";
export const dayKey = (d: string) => `shop:visits:${d}`;

/** YYYY-MM-DD in America/New_York. */
export function nyDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

/** Last `n` NY dates, newest first. */
export function lastNyDates(n: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(nyDate(new Date(now.getTime() - i * 86_400_000)));
  return [...new Set(out)];
}
