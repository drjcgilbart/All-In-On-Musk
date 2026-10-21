import type { Metadata } from "next";
import { slopcoreVideos } from "@/content/slopcore-videos";
import { FleetModelAnalytics } from "../projects/florida-fleet-model/ga";
import "./slopcore.css";

export const metadata: Metadata = {
  title: "SI Slopcore Videos",
  description: "SI Slopcore Videos: a new monthly video series from All In On Musk.",
  alternates: { canonical: "/si-slopcore-videos" },
};

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
        <p className="slop-kicker">Monthly series</p>
        <h1 className="page-title">SI Slopcore <span>Videos</span></h1>
        <p className="slop-sub">A new monthly video series from All In On Musk.</p>
      </header>
      {videos.length === 0 ? (
        <section className="slop-empty" aria-label="Coming soon">
          <p className="slop-empty-tag">New monthly series</p>
          <h2>First video coming soon<span className="slop-cursor" aria-hidden="true" /></h2>
          <p>SI Slopcore is a new monthly video series. The first episode lands here soon, then a new one every month.</p>
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
