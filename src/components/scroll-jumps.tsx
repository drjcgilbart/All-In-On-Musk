"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const HIDE_AFTER_MS = 3000;

export function ScrollJumps() {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const shownRef = useRef(false);
  const hovering = useRef(false);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    const armHide = () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (hovering.current) return;
      hideTimer.current = window.setTimeout(() => {
        shownRef.current = false;
        setShown(false);
      }, HIDE_AFTER_MS);
    };

    const reveal = () => {
      if (!shownRef.current) {
        shownRef.current = true;
        setShown(true);
      }
      armHide();
    };

    window.addEventListener("scroll", reveal, { passive: true });
    window.addEventListener("wheel", reveal, { passive: true });
    window.addEventListener("touchmove", reveal, { passive: true });
    return () => {
      window.removeEventListener("scroll", reveal);
      window.removeEventListener("wheel", reveal);
      window.removeEventListener("touchmove", reveal);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  function hold(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    hovering.current = true;
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
  }

  function release(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    hovering.current = false;
    if (!shownRef.current) return;
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      shownRef.current = false;
      setShown(false);
    }, HIDE_AFTER_MS);
  }

  return (
    <div className={shown ? "scroll-jumps show" : "scroll-jumps"} onPointerEnter={hold} onPointerLeave={release}>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Go To Top
      </button>
      <button type="button" onClick={() => router.back()}>
        Back
      </button>
      <button type="button" onClick={() => router.push("/")}>
        Home
      </button>
    </div>
  );
}
