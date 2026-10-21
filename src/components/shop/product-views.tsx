"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductViews({ name, front, back, labels }: { name: string; front: string; back?: string; labels: [string, string] }) {
  const [side, setSide] = useState<0 | 1>(0);
  if (!back) {
    return <Image className="shop-pimg" src={front} alt={`${name} mockup`} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" priority />;
  }
  return (
    <div className="shop-views">
      <div className="shop-viewtoggle" role="group" aria-label="Product view">
        {labels.map((label, i) => (
          <button key={label} type="button" className="shop-mono" aria-pressed={side === i} onClick={() => setSide(i as 0 | 1)}>
            {label}
          </button>
        ))}
      </div>
      <Image className="shop-pimg" src={side ? back : front} alt={`${name} mockup, ${labels[side].toLowerCase()}`} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" priority />
    </div>
  );
}
