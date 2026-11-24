"use client";

import { useState } from "react";

/** maxres is the same poster as hqdefault, sharper. Cover-crop either one to drop the 16:9 side bars. */
function shortPosterSources(id: string) {
  return [`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`];
}

function ShortPoster({ id }: { id: string }) {
  const sources = shortPosterSources(id);
  const [index, setIndex] = useState(0);
  const src = sources[Math.min(index, sources.length - 1)];
  function next() {
    setIndex((current) => (current + 1 < sources.length ? current + 1 : current));
  }
  return (
    <img
      src={src}
      alt=""
      onError={next}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth > 0 && event.currentTarget.naturalWidth < 200) next();
      }}
    />
  );
}

export function LetterVideo({ id, title, short = false }: { id: string; title: string; short?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const safe = /^[\w-]{11}$/.test(id) ? id : "";
  if (!safe) return null;
  const frame = short ? "watch-frame is-short" : "watch-frame";
  if (playing) {
    return (
      <div className={frame}>
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
    <button type="button" className={frame} onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
      {short ? <ShortPoster id={safe} /> : <img src={`https://i.ytimg.com/vi/${safe}/hqdefault.jpg`} alt="" />}
      <span className="jv-play" aria-hidden="true" />
    </button>
  );
}
