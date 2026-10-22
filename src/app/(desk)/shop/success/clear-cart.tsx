"use client";
import { useEffect } from "react";
import { clearCartStorage, getCartId, saveOrder, useCart, type LocalOrder } from "@/components/shop/cart";

/** Rendered only after the server verified the Stripe session is paid. Empties the cart and saves the order locally. */
export function ClearCart({ order, cartId }: { order: LocalOrder; cartId?: string }) {
  const { ready } = useCart();
  useEffect(() => {
    if (!ready) return;
    saveOrder(order);
    // Clear when this is the cart that was paid (or the paid session predates cart ids).
    if (!cartId || cartId === getCartId()) clearCartStorage();
  }, [ready, order, cartId]);
  return null;
}
