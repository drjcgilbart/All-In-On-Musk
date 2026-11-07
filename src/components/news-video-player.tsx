"use client";

import { useState } from "react";
import type { RssVideo } from "@/lib/channelRss";
import { InlineVideo } from "@/components/inline-video";

/** Same look as the old Journal Videos section: latest upload large; the poster plays in place, the rest in a drop-down. */
function Section({ list, isShort }: { list: RssVideo[]; isShort: boolean }) {
  const [current, setCurrent] = useState(list[0]);
  const [open, setOpen] = useState(false);
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
        {youtubeId ? (
          <InlineVideo
            key={current.id}
            youtubeId={youtubeId}
            title={current.title}
            thumbnailUrl={current.thumbnailUrl}
            posterUrl={isShort ? `https://i.ytimg.com/vi/${youtubeId}/oar2.jpg` : undefined}
            isShort={isShort}
          />
        ) : (
          <a className="watch-frame nvp-poster" href={current.href} aria-label={`Open ${current.title}`}>
            {current.thumbnailUrl ? <img src={current.thumbnailUrl} alt="" /> : null}
            <span className="jv-play" aria-hidden="true" />
          </a>
        )}
        <div className="journal-player-copy">
          <p className="jv-latest">{current.id === list[0].id ? `Latest ${label}` : `Now showing`}</p>
          <p className="idx"><span className="chip">{label}</span>{current.dateLabel}</p>
          <h3>{current.title}</h3>
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
