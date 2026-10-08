/** Upcoming SpaceX launches from Launch Library 2.
 *  Only windows inside the next seven days are returned.
 *  A failed fetch is stale and empty. Never invent a window. */

export type Launch = {
  id: string;
  name: string;
  net: string;
  status: string;
};

const URL = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?lsp__id=121&limit=20&mode=list";
const WEEK = 7 * 86_400_000;
const TTL = 10 * 60_000;

let cache: { at: number; launches: Launch[] } | null = null;

function shortName(name: string) {
  const mission = name.split("|").pop() ?? name;
  return mission.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export async function fetchLaunches(now = Date.now()): Promise<{ launches: Launch[]; stale: boolean }> {
  if (cache && now - cache.at < TTL) return { launches: cache.launches, stale: false };
  try {
    const response = await fetch(URL, {
      headers: { "user-agent": "Mozilla/5.0" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const body = await response.json();
    const rows = Array.isArray(body?.results) ? body.results : [];
    const end = now + WEEK;
    const launches: Launch[] = rows
      .map((row: { id?: string; name?: string; net?: string; status?: { abbrev?: string } }) => ({
        id: String(row.id ?? row.net ?? row.name ?? ""),
        name: shortName(String(row.name ?? "Launch")),
        net: String(row.net ?? ""),
        status: String(row.status?.abbrev ?? ""),
      }))
      .filter((launch: Launch) => {
        const time = Date.parse(launch.net);
        return Boolean(launch.id) && Number.isFinite(time) && time >= now && time <= end;
      })
      .sort((a: Launch, b: Launch) => Date.parse(a.net) - Date.parse(b.net));
    cache = { at: now, launches };
    return { launches, stale: false };
  } catch {
    if (cache) return { launches: cache.launches, stale: true };
    return { launches: [], stale: true };
  }
}
