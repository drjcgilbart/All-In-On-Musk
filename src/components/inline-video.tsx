"use client";

import { useState } from "react";

/** Poster (thumbnail + play cue) that is the one click target; on click it becomes an in-page YouTube embed. */
export function InlineVideo({ youtubeId, title, thumbnailUrl, posterUrl, isShort = false, className = "watch-frame nvp-poster" }: {
  youtubeId: string; title: string; thumbnailUrl: string; posterUrl?: string; isShort?: boolean; className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const frameClass = `${className}${isShort ? " is-short" : ""}`;
  if (playing) {
    return (
      <div className={`${frameClass} is-playing`}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" className={frameClass} onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      <img
        src={posterUrl ?? thumbnailUrl}
        alt=""
        loading="lazy"
        onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== thumbnailUrl) img.src = thumbnailUrl; }}
      />
      <span className="jv-play" aria-hidden="true" />
    </button>
  );
}
