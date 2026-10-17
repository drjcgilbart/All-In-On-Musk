import type { Metadata } from "next";
import { MarketsBoard } from "@/components/markets-board";
import { NewsList } from "@/components/news-list";
import { spacexMarks } from "@/content/records";
import { getLiveNews } from "@/lib/liveNews";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Delayed index, Tesla, and SpaceX prints. SPCX trades on Nasdaq. Unofficial. Not a brokerage.",
  alternates: { canonical: "/markets" },
};

export default async function MarketsPage() {
  const wire = (await getLiveNews(45)).filter((n) => n.tags.some((t) => ["Tesla", "SpaceX", "Starlink", "xAI"].includes(t))).slice(0, 6);
  return (
    <>
      <p className="kicker">Markets</p>
      <h1 className="page-title">Prints, not advice.</h1>
      <p className="lede">
        Indices, Tesla, and SpaceX come from Yahoo’s public chart endpoint. SpaceX trades on Nasdaq as SPCX. No key is stored. The server holds a print for about 30 seconds, and the page asks again about every 30 seconds while it is open. Session charts start from 1-minute bars. If the fetch fails, the last cached print stays up and the line reads FEED STALE. An empty cell means there was nothing to cache. Timestamps are America/New_York. This is unofficial, delayed or real-time depending on the vendor, and not a brokerage.
      </p>
      <MarketsBoard />
      <section className="section" aria-labelledby="wire-title">
        <h2 id="wire-title">On the wire</h2>
        <p className="note">Pulled every morning. Headlines are ours, the story is at the link.</p>
        <p className="note">Neuralink and The Boring Company are private. There is no live price, so none is shown. Private-round figures appear only as dated reports.</p>
        <NewsList items={wire} showFilters={false} />
      </section>
      <section className="panel">
        <p className="kicker">Before the tape</p>
        <h2>How it got to SPCX</h2>
        <p>
          The live print is the Nasdaq chart above. These lines are older reports, plus the first session. They are not today’s last sale.
        </p>
        <ol className="mark-list">
          {spacexMarks.map((mark) => (
            <li key={mark.date + mark.label}>
              <p className="mono">
                {mark.date} · {mark.label} · {mark.value}
              </p>
              <p>{mark.note}</p>
              <a href={mark.href} target="_blank" rel="noopener noreferrer">{mark.source}</a>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
