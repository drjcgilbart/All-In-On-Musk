import type { Metadata } from "next";
import Link from "next/link";
import { Chip } from "@/components/chip";
import { NewsVideos } from "@/components/news-videos";
import { NewsList } from "@/components/news-list";
import { Tape } from "@/components/tape";
import { machineArt } from "@/content/art";
import { machines } from "@/content/machines";
import { getLiveNews, latestByTag } from "@/lib/liveNews";
import { bench, milestones, watchlist } from "@/content/records";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: site.seoTitle },
  description: site.description,
  alternates: { canonical: "/" },
};

const DAY = 86_400_000;

export const revalidate = 21600;

export default async function HomePage() {
  const news = await getLiveNews(10);
  const latest = await latestByTag(["Tesla", "SpaceX", "Neuralink", "Boring", "xAI"]);
  const tagFor: Record<string, string> = { tesla: "Tesla", spacex: "SpaceX", neuralink: "Neuralink", boring: "Boring", xai: "xAI", terafab: "Tesla" };
  const recent = news.filter((item) => Date.now() - Date.parse(item.iso) < DAY).slice(0, 5);
  const headlines = recent.length > 0 ? recent : news.slice(0, 5);

  return (
    <>
      <Tape />
      <p className="kicker">The stack</p>
      <h1 className="hero-title">Inside the Musconomy</h1>
      <p className="lede">Pick a company. The official site is the second link.</p>

      <section className="section" id="stack" aria-labelledby="stack-title">
        <h2 id="stack-title" className="sr">
          Machines
        </h2>
        <div className="stack">
          {machines.map((machine) => (
            <article className="machine-card" key={machine.slug}>
              <a className="card-hit" href={`/machines/${machine.slug}`}>
                <img className="card-shot" src={machineArt[machine.slug].src} alt={machineArt[machine.slug].alt} />
                <span className="idx">{machine.index}</span>
                <h2>{machine.name}</h2>
                <p className="line">{machine.line}</p>
                <p>{machine.text}</p>
              </a>
              {latest[tagFor[machine.slug]] ? (
                <p className="mono">
                  <a href={latest[tagFor[machine.slug]]!.href} target="_blank" rel="noopener noreferrer">
                    {latest[tagFor[machine.slug]]!.time} · {latest[tagFor[machine.slug]]!.title}
                  </a>
                </p>
              ) : null}
              <a className="ext" href={machine.href}>
                {machine.site}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="today-title">
        <h2 id="today-title">{recent.length > 0 ? "Today in the Musconomy" : "Latest on the desk"}</h2>
        {recent.length === 0 ? (
          <p className="note">Nothing sourced in the last 24 hours. The starter desk is not a wire.</p>
        ) : null}
        <NewsList items={headlines} showFilters={false} />
      </section>

      <section className="section" aria-labelledby="bench-title">
        <h2 id="bench-title">On the bench</h2>
        <div className="stack">
          {bench.map((item) => (
            <a className="plain-card bench-card" key={item.name} href={item.href}>
              <h3>{item.name}</h3>
              <Chip chip={item.chip} />
            </a>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="watch-title">
        <h2 id="watch-title">Watchlist</h2>
        <div className="stack">
          {watchlist.map((item) => (
            <article className="plain-card watch-card" key={item.name}>
              <h3>{item.name}</h3>
              <p>
                <Chip chip={item.chip} />
                {item.note}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="projects-title">
        <h2 id="projects-title">Projects</h2>
        <div className="stack">
          <a className="plain-card span-6" href="/projects">
            <p className="kicker">Lab</p>
            <h3>Florida fleet</h3>
            <p>Working models for a Tesla fleet. Experimental. Wrong on purpose until proven.</p>
          </a>
          <a className="plain-card span-6" href="/projects/robotaxi">
            <p className="kicker">Workbook</p>
            <h3>Fleet model v1.1</h3>
            <p>Year 1 on the sheet does not clear. Averages hide the shift.</p>
          </a>
        </div>
      </section>

      <section className="section" aria-labelledby="merch-title">
        <h2 id="merch-title">Merch</h2>
        <div className="stack">
          <Link className="plain-card span-6 merch-card" href="/shop">
            <p className="kicker">Shop</p>
            <h3>Desk merch</h3>
            <p>Tees, a dad hat and a mission patch. Printed to order. Unofficial fan merch.</p>
          </Link>
        </div>
      </section>

      <NewsVideos limit={3} moreHref="/news" />

      <section className="section" aria-labelledby="record-title">
        <h2 id="record-title">The record</h2>
        <p className="note">Dated and sourced. Race in the nav is Tesla World Racer, not this list.</p>
        <ol className="mark-list">
          {milestones.map((item) => (
            <li key={item.date + item.chip}>
              <p className="mono">
                <Chip chip={item.chip} />
                {item.date}
              </p>
              <a href={item.href} target="_blank" rel="noopener noreferrer">{item.text}</a>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <a className="plain-card span-6" href="/launches">
          <p className="kicker">Last flight</p>
          <h3>Flight 14</h3>
          <p>Ship 41 on Booster 21. Orbit, 28 Sep 2026. The next window is not published here.</p>
        </a>
      </section>
    </>
  );
}
