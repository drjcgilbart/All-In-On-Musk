"use client";

import { useState } from "react";

export function LetterVideo({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const safe = /^[\w-]{11}$/.test(id) ? id : "";
  if (!safe) return null;
  if (playing) {
    return (
      <div className="watch-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${safe}?rel=0&playsinline=1&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button type="button" className="watch-frame" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      <img src={`https://i.ytimg.com/vi/${safe}/hqdefault.jpg`} alt="" />
      <span className="jv-play" aria-hidden="true" />
    </button>
  );
}
