"use client";

import { useEffect, useRef, useState } from "react";
import type { ChannelVideo } from "@/lib/youtubeChannel";

type YTPlayer = {
  loadVideoById: (id: string) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, options: object) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function JournalVideos({
  videos,
  stale,
  unavailable,
}: {
  videos: ChannelVideo[];
  stale: boolean;
  unavailable: boolean;
}) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const playing = videos.find((video) => video.id === playingId) || null;

  useEffect(() => {
    if (!playing) return;
    const frame = frameRef.current;
    if (!frame) return;
    const videoId = playing.id;
    let cancel = false;
    let player: YTPlayer | null = null;
    const mount = document.createElement("div");
    frame.replaceChildren(mount);
    document.getElementById("journal-player")?.scrollIntoView({ behavior: "smooth", block: "start" });

    loadYouTubeApi().then(() => {
      if (cancel || !window.YT?.Player || !mount.isConnected) return;
      player = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
      });
      if (cancel) player.destroy();
    });

    return () => {
      cancel = true;
      try {
        player?.destroy();
      } catch {
        /* The iframe is removed with the frame. */
      }
      frame.replaceChildren();
    };
  }, [playing]);

  function choose(video: ChannelVideo) {
    setPlayingId(video.id);
  }

  if (unavailable && videos.length === 0) {
    return <p className="note">The latest uploads will show here after the channel feed is connected.</p>;
  }

  const longForm = videos.filter((video) => video.kind !== "short");
  const shorts = videos.filter((video) => video.kind === "short");
  const meta = (video: ChannelVideo) => (
    <p className="idx">
      <span className="chip">{video.kind === "short" ? "Short" : "Video"}</span>
      {video.dateLabel}
      {video.duration ? ` \u00b7 ${video.duration}` : ""}
    </p>
  );
  const cls = (video: ChannelVideo, extra: string) =>
    `plain-card journal-card ${extra}${video.id === playing?.id ? " on" : ""}`;

  function block(list: ChannelVideo[], label: string, isShort: boolean) {
    if (list.length === 0) return null;
    const [first, ...rest] = list;
    return (
      <div className="jv-block" id={isShort ? "journal-shorts" : "journal-long"}>
        <div className="jv-head">
          <h3>{label}</h3>
          <span>{list.length} {list.length === 1 ? "upload" : "uploads"}</span>
        </div>
        <button
          type="button"
          className={cls(first, `jv-feature${isShort ? " is-short" : ""}`)}
          onClick={() => choose(first)}
          aria-pressed={first.id === playing?.id}
        >
          <div className="jv-thumb">
            {first.thumbnailUrl ? <img src={first.thumbnailUrl} alt="" /> : null}
            <span className="jv-play" aria-hidden="true" />
          </div>
          <div>
            <p className="jv-latest">Latest {isShort ? "Short" : "Video"}</p>
            {meta(first)}
            <h2>{first.title}</h2>
          </div>
        </button>
        {rest.length > 0 ? (
          <details className="jv-more">
            <summary>
              {isShort ? "Other shorts" : "Other videos"} ({rest.length})
            </summary>
          <div className={isShort ? "jv-grid is-short" : "jv-grid"}>
            {rest.map((video) => (
              <button
                key={video.id}
                type="button"
                className={cls(video, "jv-small")}
                onClick={() => choose(video)}
                aria-pressed={video.id === playing?.id}
              >
                <div className="jv-thumb">{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" /> : null}</div>
                {meta(video)}
                <h2>{video.title}</h2>
              </button>
            ))}
          </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {stale ? <p className="note">Showing the last list. A refresh did not come through.</p> : null}
      {playing ? (
        <div id="journal-player" className={playing.kind === "short" ? "journal-player is-short" : "journal-player"}>
          <div ref={frameRef} className="watch-frame" />
          <div className="journal-player-copy">
            {meta(playing)}
            <h3>{playing.title}</h3>
            <p>Plays on this page.</p>
          </div>
        </div>
      ) : null}
      {videos.length === 0 ? <p className="note">No uploads in this list yet.</p> : null}
      {block(longForm, "Videos", false)}
      {block(shorts, "Shorts", true)}
    </div>
  );
}
