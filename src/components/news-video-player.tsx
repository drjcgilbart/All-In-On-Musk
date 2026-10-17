"use client";

import { useState } from "react";
import type { RssVideo } from "@/lib/channelRss";

/** Same look as the old Journal Videos section: latest upload large and playable, the rest in a drop-down. */
function Section({ list, isShort }: { list: RssVideo[]; isShort: boolean }) {
  const [current, setCurrent] = useState(list[0]);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rest = list.filter((v) => v.id !== current.id);
  const youtubeId = /^[\w-]{11}$/.test(current.id) ? current.id : "";
  const label = isShort ? "Short" : "Video";
  return (
    <div className="jv-block nvp-block" id={isShort ? "news-shorts" : "news-long"}>
      <div className="jv-head">
        <h3>{isShort ? "Shorts" : "Videos"}</h3>
        <span>{list.length} {list.length === 1 ? "upload" : "uploads"}</span>
      </div>
      <div className={isShort ? "journal-player is-short" : "journal-player"}>
        {youtubeId && playing ? (
          <div className="watch-frame">
            <iframe
              key={youtubeId}
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1&autoplay=1`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : youtubeId ? (
          <button type="button" className="watch-frame nvp-poster" onClick={() => setPlaying(true)} aria-label={`Play ${current.title}`}>
            <img src={isShort ? `https://i.ytimg.com/vi/${youtubeId}/oar2.jpg` : current.thumbnailUrl} alt="" onError={(e) => { (e.target as HTMLImageElement).src = current.thumbnailUrl; }} />
            <span className="jv-play" aria-hidden="true" />
          </button>
        ) : (
          <a className="watch-frame nvp-poster" href={current.href}>
            {current.thumbnailUrl ? <img src={current.thumbnailUrl} alt="" /> : null}
            <span className="jv-play" aria-hidden="true" />
          </a>
        )}
        <div className="journal-player-copy">
          <p className="jv-latest">{current.id === list[0].id ? `Latest ${label}` : `Now playing`}</p>
          <p className="idx"><span className="chip">{label}</span>{current.dateLabel}</p>
          <h3>{current.title}</h3>
          <p>
            {current.href.startsWith("/") ? <a href={current.href}>Open the video page</a> : <a href={current.href} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>}
          </p>
        </div>
      </div>
      {rest.length > 0 ? (
        <details className="jv-more nvp-more" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
          <summary>{isShort ? "Other shorts" : "Other videos"} ({rest.length})</summary>
          <ul className="nvp-list">
            {rest.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrent(v);
                    setPlaying(true);
                    setOpen(false);
                    document.getElementById(isShort ? "news-shorts" : "news-long")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <img src={v.thumbnailUrl} alt="" loading="lazy" className={isShort ? "is-short" : ""} />
                  <span>
                    <span className="idx">{v.dateLabel}</span>
                    <span className="nvp-title">{v.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function NewsVideoPlayer({ videos }: { videos: RssVideo[] }) {
  const long = videos.filter((v) => v.kind !== "short");
  const shorts = videos.filter((v) => v.kind === "short");
  return (
    <div className="nvp">
      {long.length ? <Section list={long} isShort={false} /> : null}
      {shorts.length ? <Section list={shorts} isShort /> : null}
    </div>
  );
}
