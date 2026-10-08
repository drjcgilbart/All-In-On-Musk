"use client";

import { useEffect, useRef, useState } from "react";

type Props = { videoId: string; title: string };

export function WatchPlayer({ videoId, title }: Props) {
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const fallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  return (
    <>
      <div className="watch-frame">
        {playing ? (
          <iframe
            ref={frameRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title={title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            aria-label={`Play video: ${title}`}
            onClick={() => setPlaying(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
          >
            <img
              src={thumb}
              alt=""
              onError={() => setThumb(fallback)}
              onLoad={(event) => {
                // YouTube serves a 120x90 placeholder when a maxres thumbnail is missing.
                if (event.currentTarget.naturalWidth <= 120 && thumb !== fallback) setThumb(fallback);
              }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
            <span
              className="nav-btn"
              aria-hidden="true"
              style={{ position: "absolute", right: "0.9rem", bottom: "0.9rem", borderColor: "var(--desk-line-hot)", background: "rgba(5, 7, 10, 0.82)", color: "#2ee6d6" }}
            >
              ▶ Play video
            </span>
          </button>
        )}
      </div>
      <noscript>
        <p className="note">
          <a href={`https://www.youtube.com/watch?v=${videoId}`}>Watch this video on YouTube</a>
        </p>
      </noscript>
    </>
  );
}
