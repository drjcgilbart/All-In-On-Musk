"use client";

import { useState } from "react";

/** Prefer the custom maxres poster. Drop to hq when YouTube has no large file. */
export function ReleaseImage({ src, fallback, alt }: { src: string; fallback?: string; alt: string }) {
  const [current, setCurrent] = useState(src);
  return (
    <img
      className="release-shot"
      src={current}
      alt={alt}
      onError={() => {
        if (fallback && current !== fallback) setCurrent(fallback);
      }}
      onLoad={(event) => {
        const width = event.currentTarget.naturalWidth;
        if (fallback && current !== fallback && width > 0 && width <= 120) setCurrent(fallback);
      }}
    />
  );
}
