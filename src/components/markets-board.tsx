"use client";

import type { Board, Print } from "@/lib/quotes";
import { compact, ny, num, pct } from "@/lib/format";
import { useEffect, useRef, useState } from "react";

const ranges = ["1d", "5d", "1m", "1y", "max"] as const;
type RangeKey = (typeof ranges)[number];

function Chart({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <p className="mono">No bars.</p>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 640;
      const y = 160 - ((point - min) / span) * 148;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="chart" viewBox="0 0 640 170" role="img" aria-label="Price chart">
      <path d={d} />
    </svg>
  );
}

function QuoteLine({ print }: { print: Print }) {
  return (
    <article className="quote">
      <header>
        <span className="mono">{print.symbol.replace("^", "")}</span>
        <h3>{print.name}</h3>
      </header>
      <p className="quote-last">
        <strong>{num(print.last, 2)}</strong>
        <span className={print.change != null && print.change < 0 ? "down" : "up"}>{num(print.change, 2)}</span>
        <em className={print.changePct != null && print.changePct < 0 ? "down" : "up"}>{pct(print.changePct)}</em>
      </p>
      <Chart points={print.points} />
      <p className="mono">{print.asOf ? ny(print.asOf) : "—"}</p>
    </article>
  );
}

function EquityPanel({
  id,
  symbol,
  name,
  exchange,
  print,
  note,
}: {
  id?: string;
  symbol: "TSLA" | "SPCX";
  name: string;
  exchange: string;
  print: Print | null;
  note: string;
}) {
  const [range, setRange] = useState<RangeKey>("1d");
  const [points, setPoints] = useState<number[] | null>(null);
  const rangeRef = useRef(range);
  rangeRef.current = range;

  useEffect(() => {
    if (rangeRef.current === "1d") setPoints(print?.points ?? null);
  }, [print]);

  useEffect(() => {
    if (range === "1d") {
      setPoints(print?.points ?? null);
      return;
    }
    let stop = false;
    fetch(`/api/quotes?symbol=${symbol}&range=${range}`)
      .then((response) => response.json())
      .then((body: { print?: Print }) => {
        if (!stop && body.print) setPoints(body.print.points);
      })
      .catch(() => {
        if (!stop) setPoints(null);
      });
    return () => {
      stop = true;
    };
  }, [range, symbol, print]);

  return (
    <section className="panel" id={id}>
      <header className="panel-head">
        <p className="kicker">
          {symbol} · {exchange}
        </p>
        <h2>{name}</h2>
      </header>
      {print && print.last != null ? (
        <>
          <p className="quote-last">
            <strong>{num(print.last, 2)}</strong>
            <em className={print.changePct != null && print.changePct < 0 ? "down" : "up"}>{pct(print.changePct)}</em>
            <span className="mono"> chg {num(print.change, 2)}</span>
          </p>
          <dl className="facts">
            <div>
              <dt>Volume</dt>
              <dd>{compact(print.volume)}</dd>
            </div>
            <div>
              <dt>Market cap</dt>
              <dd>{print.marketCap == null ? "Not in this feed" : compact(print.marketCap)}</dd>
            </div>
            <div>
              <dt>Next earnings</dt>
              <dd>Not in this feed</dd>
            </div>
            <div>
              <dt>As of</dt>
              <dd>{ny(print.asOf)}</dd>
            </div>
          </dl>
          <div className="range-row">
            {ranges.map((item) => (
              <button key={item} type="button" className={item === range ? "on" : ""} onClick={() => setRange(item)}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <Chart points={points ?? print.points} />
          <p>{note}</p>
        </>
      ) : (
        <p className="mono">FEED STALE · no {name} print cached.</p>
      )}
    </section>
  );
}

export function MarketsBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/quotes")
        .then((response) => {
          if (!response.ok) throw new Error("stale");
          return response.json();
        })
        .then((body: Board) => {
          if (stop) return;
          setBoard(body);
          setFailed(body.source === "none" || body.stale);
        })
        .catch(() => {
          if (!stop) setFailed(true);
        });
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div>
      {failed ? <p className="stale mono">FEED STALE</p> : null}
      <div className="quote-grid">
        {board?.indices.map((print) => (
          <QuoteLine key={print.symbol} print={print} />
        ))}
      </div>
      <EquityPanel
        symbol="TSLA"
        name="Tesla"
        exchange="Nasdaq"
        print={board?.tsla ?? null}
        note="What moved it is not in the quote. Read the filing or the wire. This number is a print, not a reason."
      />
      <EquityPanel
        id="spacex"
        symbol="SPCX"
        name="SpaceX"
        exchange="Nasdaq"
        print={board?.spcx ?? null}
        note="Class A common stock, ticker SPCX. Listed on Nasdaq 12 June 2026. This is the chart print, not a target and not the first-day close."
      />
    </div>
  );
}
