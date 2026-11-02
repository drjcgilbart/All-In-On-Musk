"use client";
import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function DropCountdown({ endsAt }: { endsAt: string }) {
  const end = Date.parse(endsAt);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);
  const endET = new Date(end).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  if (now === null) return <p className="shop-mono drop-clock">Ends {endET}</p>;
  const left = Math.max(0, end - now);
  if (left === 0) return <p className="shop-mono drop-clock">This drop has ended.</p>;
  const s = Math.floor(left / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return (
    <p className="shop-mono drop-clock" aria-live="off">
      <span className="drop-time">{pad(h)}:{pad(m)}:{pad(sec)}</span> left · ends {endET}
    </p>
  );
}
