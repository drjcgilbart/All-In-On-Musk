/** Delayed quotes from the Yahoo Finance chart endpoint. No API key.
 *  If a symbol fails, that print is empty and the board is marked stale.
 *  Never invent a last price. */

export type Print = {
  symbol: string;
  name: string;
  last: number | null;
  prev: number | null;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  marketCap: number | null;
  asOf: string | null;
  points: number[];
};

export type Board = {
  source: "yahoo" | "none";
  stale: boolean;
  fetchedAt: string;
  indices: Print[];
  tsla: Print;
  spcx: Print;
};

type RangeKey = "1d" | "5d" | "1m" | "1y" | "max";

const RANGES: Record<RangeKey, [string, string]> = {
  "1d": ["1d", "1m"],
  "5d": ["5d", "15m"],
  "1m": ["1mo", "1d"],
  "1y": ["1y", "1d"],
  max: ["max", "1wk"],
};

const INDICES = [
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "DJIA" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^RUT", name: "Russell 2000" },
] as const;

const cache = new Map<string, { at: number; print: Print }>();
const TTL = 30_000;

function emptyPrint(symbol: string, name: string): Print {
  return {
    symbol,
    name,
    last: null,
    prev: null,
    change: null,
    changePct: null,
    volume: null,
    marketCap: null,
    asOf: null,
    points: [],
  };
}

function downsample(values: number[], max: number) {
  if (values.length <= max) return values;
  const out: number[] = [];
  const step = (values.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) out.push(values[Math.round(i * step)]);
  return out;
}

export function isRange(value: string | null): value is RangeKey {
  return value === "1d" || value === "5d" || value === "1m" || value === "1y" || value === "max";
}

export async function fetchPrint(symbol: string, name: string, range: RangeKey): Promise<Print> {
  const key = `${symbol}:${range}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.print;

  const [span, interval] = RANGES[range];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${span}&interval=${interval}&includePrePost=true`;
  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`quote ${symbol} ${response.status}`);
  const body = await response.json();
  const result = body?.chart?.result?.[0];
  const meta = result?.meta;
  const last = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
  const prev = typeof meta?.previousClose === "number"
    ? meta.previousClose
    : typeof meta?.chartPreviousClose === "number"
      ? meta.chartPreviousClose
      : null;
  const closes: number[] = (result?.indicators?.quote?.[0]?.close ?? []).filter(
    (value: unknown): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const print: Print = {
    symbol,
    name,
    last,
    prev,
    change: last != null && prev != null ? last - prev : null,
    changePct: last != null && prev ? (last - prev) / prev : null,
    volume: typeof meta?.regularMarketVolume === "number" ? meta.regularMarketVolume : null,
    marketCap: typeof meta?.marketCap === "number" ? meta.marketCap : null,
    asOf: typeof meta?.regularMarketTime === "number"
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
    points: downsample(closes, 72),
  };
  if (print.last == null) throw new Error(`quote ${symbol} empty`);
  cache.set(key, { at: Date.now(), print });
  return print;
}

const EQUITIES = [
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "SPCX", name: "SpaceX" },
] as const;

export async function fetchBoard(): Promise<Board> {
  const names = [...INDICES, ...EQUITIES];
  const settled = await Promise.allSettled(names.map((item) => fetchPrint(item.symbol, item.name, "1d")));
  const prints = settled.map((item, index) =>
    item.status === "fulfilled" ? item.value : emptyPrint(names[index].symbol, names[index].name),
  );
  const indices = prints.slice(0, INDICES.length);
  const tsla = prints[INDICES.length];
  const spcx = prints[INDICES.length + 1];
  const stale = prints.some((print) => print.last == null);
  return {
    source: stale && prints.every((print) => print.last == null) ? "none" : "yahoo",
    stale,
    fetchedAt: new Date().toISOString(),
    indices,
    tsla,
    spcx,
  };
}
