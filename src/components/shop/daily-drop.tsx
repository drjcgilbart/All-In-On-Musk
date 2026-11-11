import Link from "next/link";
import { dropItemPath, dropLabel, dropPhase, getActiveDrop, getEndedDrop, shopClock, type Drop, type DropItem } from "@/lib/drops";
import { formatPrice } from "@/lib/shop/catalog";
import { DropCountdown } from "./drop-countdown";
import { DropImage } from "./drop-image";

const RETIRED_WINDOW_MS = 48 * 60 * 60 * 1000;

function priceLabel(item: DropItem) {
  const prices = item.variants.map((v) => v.price ?? item.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `from ${formatPrice(min)}`;
}

function href(drop: Drop, index: number, asOf?: string) {
  const path = dropItemPath(drop.number, index);
  return asOf ? `${path}?asOf=${encodeURIComponent(asOf)}` : path;
}

export async function DailyDrop({ now, asOf }: { now: number; asOf?: string }) {
  const drop = await getActiveDrop(now);
  if (drop) return <LiveDrop drop={drop} now={now} asOf={asOf} />;
  const ended = await getEndedDrop(now);
  if (!ended) return null;
  const age = now - Date.parse(ended.ends_at);
  if (!asOf && age > RETIRED_WINDOW_MS) return null;
  return <RetiredDrop drop={ended} asOf={asOf} />;
}

function LiveDrop({ drop, now, asOf }: { drop: Drop; now: number; asOf?: string }) {
  const phase = dropPhase(drop, shopClock(now));
  return (
    <section className="shop-hero drop" aria-labelledby="drop-h" data-drop={dropLabel(drop.number)} data-state="live">
      <div className="shop-hero-copy">
        <p className="drop-kicker">
          <span className="shop-limited">Daily Drop {dropLabel(drop.number)}</span>
          {drop.sample ? <span className="drop-sample-flag">Sample · not for sale on the live shop</span> : null}
        </p>
        <h2 id="drop-h" className="shop-hero-title">{drop.title}</h2>
        <p className="lede">{drop.description}</p>
        <DropCountdown endsAt={drop.ends_at} />
      </div>
      <div className="shop-grid shop-hero-grid">
        {drop.items.map((it, i) => (
          <Link key={i} href={href(drop, i, asOf)} className="shop-card">
            {it.mockups[0] ? <DropImage src={it.mockups[0]} alt={it.name} width={800} height={800} sizes="(max-width: 760px) 100vw, 33vw" priority={i === 0} /> : null}
            <div className="shop-card-body">
              <p className="shop-mono">{dropLabel(drop.number)} · {it.type}</p>
              <h2>{it.name}</h2>
              <div className="shop-row">
                <span className="shop-tag">{it.tagline || (phase === "live" ? "In the drop" : "Preview only")}</span>
                <span className="shop-price">{priceLabel(it)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RetiredDrop({ drop, asOf }: { drop: Drop; asOf?: string }) {
  return (
    <section className="shop-hero drop drop-retired" aria-labelledby="drop-h" data-drop={dropLabel(drop.number)} data-state="retired">
      <div className="shop-hero-copy">
        <p><span className="shop-limited">Daily Drop {dropLabel(drop.number)} · retired</span></p>
        <h2 id="drop-h" className="shop-hero-title">{drop.title}</h2>
        <p className="lede">This drop has ended. Retired drops are not for sale.</p>
      </div>
      <div className="shop-grid shop-hero-grid">
        {drop.items.map((it, i) => (
          <Link key={i} href={href(drop, i, asOf)} className="shop-card">
            {it.mockups[0] ? <DropImage src={it.mockups[0]} alt={`${it.name} mockup`} width={800} height={800} sizes="(max-width: 760px) 100vw, 33vw" /> : null}
            <div className="shop-card-body">
              <p className="shop-mono">Ended</p>
              <h2>{it.name}</h2>
              <div className="shop-row">
                <span className="shop-tag">Not for sale</span>
                <span className="shop-price">{priceLabel(it)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
