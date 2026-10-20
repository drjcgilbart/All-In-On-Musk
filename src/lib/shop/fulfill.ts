import type Stripe from "stripe";
import { DedupeStore } from "./idempotency";
import { createPrintfulOrder, printfulLines, sessionToPrintfulOrder } from "./printful";
import { pinOrderFromSession, sendPinOrderMail } from "./notify";
import { autoConfirm } from "./config";
import { logError, logInfo } from "./log";

type Deps = {
  store: DedupeStore;
  retrieveSession: (id: string) => Promise<Stripe.Checkout.Session>;
  createOrder?: typeof createPrintfulOrder;
  sendPinMail?: typeof sendPinOrderMail;
};

/** Handle a verified Stripe event. Returns a short status string. Idempotent by session id. */
export async function handleStripeEvent(event: Stripe.Event, deps: Deps): Promise<string> {
  if (event.type !== "checkout.session.completed") return "ignored";
  const partial = event.data.object as Stripe.Checkout.Session;
  if (partial.payment_status !== "paid") return "unpaid";
  if (deps.store.claim) {
    if (!(await deps.store.claim(partial.id))) return "duplicate"; // atomic (Redis SET NX)
  } else {
    if (await deps.store.has(partial.id)) return "duplicate";
    await deps.store.add(partial.id); // claim first so concurrent retries don't double-order
  }
  try {
    const session = await deps.retrieveSession(partial.id);
    // 1) Self-fulfilled pins: email the owner first. If this throws, nothing has been created yet, so a Stripe retry is safe.
    const pins = pinOrderFromSession(session);
    if (pins) {
      const via = await (deps.sendPinMail ?? sendPinOrderMail)(pins);
      logInfo("stripe-webhook", "pin order emailed", { session: partial.id, via, lines: pins.items.length });
    }
    // 2) Everything else goes to Printful exactly as before.
    if (!printfulLines(session).length) return "self-fulfilled";
    const order = sessionToPrintfulOrder(session);
    const result = await (deps.createOrder ?? createPrintfulOrder)(order, autoConfirm());
    logInfo("stripe-webhook", "printful order created", { session: partial.id, printfulId: result?.id, status: result?.status });
    return pins ? "created+self-fulfilled" : "created";
  } catch (err) {
    await deps.store.remove(partial.id); // let Stripe retry
    logError("stripe-webhook", err, { session: partial.id });
    throw err;
  }
}
