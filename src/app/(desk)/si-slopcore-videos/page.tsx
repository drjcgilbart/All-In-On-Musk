import type { Metadata } from "next";
import { slopcoreVideos } from "@/content/slopcore-videos";
import { FleetModelAnalytics } from "../projects/florida-fleet-model/ga";
import "./slopcore.css";

export const metadata: Metadata = {
  title: "SI Slopcore Videos",
  description: "SI Slopcore Videos: a monthly music video series from All In On Musk, performed by Nova Red.",
  alternates: { canonical: "/si-slopcore-videos" },
};

function NovaImg({ slug, alt, sizes, priority }: { slug: string; alt: string; sizes: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/art/nova-red/${slug}-720.webp`}
      srcSet={`/art/nova-red/${slug}-360.webp 360w, /art/nova-red/${slug}-720.webp 720w`}
      sizes={sizes}
      width={720}
      height={1280}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function longDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default function SlopcorePage() {
  const videos = [...slopcoreVideos].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <FleetModelAnalytics />
      <div className="slop">
      <header className="slop-head">
        <p className="slop-kicker">Monthly music video series</p>
        <h1 className="page-title">SI Slopcore <span>Videos</span></h1>
        <p className="slop-sub">Original SI Slopcore music videos from All In On Musk, performed by Nova Red, our original AI character. A new track every month.</p>
        <div className="slop-eq" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ animationDelay: `${(i * 137) % 900}ms` }} />)}</div>
      </header>
      <section className="slop-nova" aria-labelledby="meet-nova">
        <figure className="slop-hero">
          <NovaImg slug="hero" alt="Nova Red, original AI character of SI Slopcore, in a black cropped top inside a neon ring" sizes="(max-width: 700px) 80vw, 320px" priority />
          <figcaption id="meet-nova">Meet Nova Red - original AI character</figcaption>
        </figure>
      </section>
      {videos.length === 0 ? (
        <section className="slop-empty" aria-label="Coming soon">
          <div className="slop-vinyl" aria-hidden="true"><span /></div>
          <div>
            <p className="slop-empty-tag">Now loading: Ep 01</p>
            <h2>First video coming soon<span className="slop-cursor" aria-hidden="true" /></h2>
            <p>Nova Red is warming up. The first SI Slopcore music video drops here soon, then a new one every month.</p>
            <ol className="slop-tracks" aria-label="Track list">
              <li><span>01</span> Coming soon</li>
            </ol>
          </div>
        </section>
      ) : (
        <ol className="slop-list">
          {videos.map((v, i) => (
            <li key={v.youtubeId} className="slop-item">
              <div className="slop-frame">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtubeId)}?rel=0`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              <div className="slop-meta">
                <span className="slop-ep">Ep {String(videos.length - i).padStart(2, "0")}</span>
                <time className="slop-date" dateTime={v.date}>{longDate(v.date)}</time>
              </div>
              <h2 className="slop-title">{v.title}</h2>
              <p className="slop-blurb">{v.blurb}</p>
            </li>
          ))}
        </ol>
      )}
      </div>
    </>
  );
}
