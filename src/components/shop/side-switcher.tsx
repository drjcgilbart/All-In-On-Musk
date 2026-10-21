"use client";

import Image from "next/image";
import { useState } from "react";

export function SideSwitcher({ name, sides, initial = 0 }: { name: string; sides: { label: string; image: string }[]; initial?: number }) {
  const [i, setI] = useState(initial);
  const cur = sides[i];
  return (
    <div className="shop-sides">
      <Image className="shop-pimg" src={cur.image} alt={`${name} mockup, ${cur.label.toLowerCase()}`} width={1000} height={1000} sizes="(max-width: 760px) 100vw, 50vw" priority />
      <div className="shop-side-thumbs" role="group" aria-label="Choose side">
        {sides.map((s, n) => (
          <button key={s.label} type="button" className="shop-side-thumb" aria-pressed={n === i} onClick={() => setI(n)}>
            <Image src={s.image} alt="" width={120} height={120} />
            <span className="shop-mono">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
