"use client";

import type { Launch } from "@/lib/launches";
import type { Board, Print } from "@/lib/quotes";
import { ny, num, pct } from "@/lib/format";
import { useEffect, useState } from "react";

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <svg className="spark" viewBox="0 0 80 24" aria-hidden="true" />;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 80;
      const y = 22 - ((point - min) / span) * 20;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="spark" viewBox="0 0 80 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function Tape() {
  const [board, setBoard] = useState<Board | null>(null);
  const [down, setDown] = useState(false);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [launchDown, setLaunchDown] = useState(false);

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/quotes")
        .then((response) => response.json())
        .then((body: Board) => {
          if (stop) return;
          setBoard(body);
          setDown(Boolean(body.stale) || body.source === "none");
        })
        .catch(() => {
          if (!stop) setDown(true);
        });
    };
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    const load = () => {
      fetch("/api/launches")
        .then((response) => response.json())
        .then((body: { launches?: Launch[]; stale?: boolean }) => {
          if (stop) return;
          setLaunches(Array.isArray(body.launches) ? body.launches : []);
          setLaunchDown(Boolean(body.stale));
        })
        .catch(() => {
          if (!stop) setLaunchDown(true);
        });
    };
    load();
    const timer = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, []);

  const prints = [board?.tsla, board?.spcx].filter((print): print is Print => Boolean(print && print.symbol));

  return (
    <div className="tape" aria-label="Market tape">
      <div className="tape-row">
        {prints.length === 0 ? <span className="mono">FEED STALE</span> : null}
        {prints.map((print) => (
          <span className="tick" key={print.symbol}>
            <span className="mono">{print.name}</span>
            <strong className={print.change != null && print.change < 0 ? "down" : "up"}>
              {num(print.last, print.symbol === "TSLA" || print.symbol === "SPCX" ? 2 : 0)}
            </strong>
            <em className={print.changePct != null && print.changePct < 0 ? "down" : "up"}>{pct(print.changePct)}</em>
            <Spark points={print.points} />
          </span>
        ))}
        {launches.map((launch) => (
          <a className="tick" key={launch.id} href="/launches">
            <span className="mono">{launch.name}</span>
            <strong>
              {ny(launch.net)}
              {launch.status && launch.status !== "Go" ? ` · ${launch.status}` : ""}
            </strong>
          </a>
        ))}
        {launchDown ? <span className="mono">LAUNCH FEED STALE</span> : null}
      </div>
      <p className="mono tape-asof">
        {down ? "FEED STALE · " : ""}
        {board?.tsla?.asOf || board?.spcx?.asOf ? `as of ${ny(board?.tsla?.asOf ?? board?.spcx?.asOf ?? null)}` : "as of — ET"}
        {" · "}
        <a href="/markets">Markets</a>
        {" · "}
        <a href="/launches">Launch board</a>
      </p>
    </div>
  );
}
