"use client";
import { useEffect } from "react";

/** Fires one anonymous count per /shop page load. No cookies or identifiers. */
export function ShopVisitPing() {
  useEffect(() => {
    fetch("/api/shop-visit", { method: "POST", keepalive: true, credentials: "omit" }).catch(() => {});
  }, []);
  return null;
}
