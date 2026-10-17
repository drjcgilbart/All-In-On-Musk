"use client";
import { useEffect } from "react";
import { useCart } from "@/components/shop/cart";

export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
