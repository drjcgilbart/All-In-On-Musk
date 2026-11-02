import Image from "next/image";
import { getActiveDrop, dropLabel } from "@/lib/drops";
import { formatPrice } from "@/lib/shop/catalog";
import { DropCountdown } from "./drop-countdown";

export async function DailyDrop() {
  const drop = await getActiveDrop();
  if (!drop) return null;
  return (
    <section className="shop-hero drop" aria-labelledby="drop-h">
      <div className="shop-hero-copy">
        <p><span className="shop-limited">Daily Drop {dropLabel(drop.number)}</span></p>
        <h2 id="drop-h" className="shop-hero-title">{drop.title}</h2>
        <p className="lede">{drop.description}</p>
        <DropCountdown endsAt={drop.ends_at} />
      </div>
      <div className="shop-grid shop-hero-grid">
        {drop.items.map((it, i) => (
          <div key={i} className="shop-card">
            {it.mockups[0] ? <Image src={it.mockups[0]} alt={it.name} width={600} height={600} unoptimized /> : null}
            <div className="shop-card-body">
              <h2>{it.name}</h2>
              <div className="shop-row">
                <span className="shop-price">{formatPrice(it.price)}</span>
                <button type="button" className="shop-btn" disabled title={drop.placeholder ? "Preview only" : "Coming soon"}>
                  {drop.placeholder ? "Preview only" : "Coming soon"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
