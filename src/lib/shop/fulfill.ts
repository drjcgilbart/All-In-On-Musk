import type Stripe from "stripe";
import { DedupeStore } from "./idempotency";
import { createPrintfulOrder, printfulLines, sessionToPrintfulOrder } from "./printful";
import { pinOrderFromSession, sendPinOrderMail } from "./notify";
import { autoConfirm } from "./config";
import { logError, logInfo } from "./log";
import { markCartCompleted, validCartId } from "./carts";
import { ADMIN_EMAIL, adminEmail, customerEmail, orderSummary, sendMail, type Mail, type PrintfulResult } from "./order-mail";

type Deps = {
  store: DedupeStore;
  retrieveSession: (id: string) => Promise<Stripe.Checkout.Session>;
  createOrder?: typeof createPrintfulOrder;
  sendPinMail?: typeof sendPinOrderMail;
  sendEmail?: typeof sendMail;
  sendAdminFallback?: (subject: string, text: string, replyTo?: string) => Promise<string>;
};

/** Claim a one-time key (separate from the order claim) so each email goes out at most once across Stripe retries. */
async function claimOnce(store: DedupeStore, key: string) {
  if (store.claim) return store.claim(key);
  if (await store.has(key)) return false;
  await store.add(key);
  return true;
}

/** Order emails. Best effort: never breaks order or Printful processing, but every failure is logged at error level
 *  and reported back in the webhook status (visible in Stripe's webhook delivery log and Vercel logs). Returns "" or a status suffix. */
async function sendOrderEmails(session: Stripe.Checkout.Session, printful: PrintfulResult, deps: Deps): Promise<string> {
  const send = deps.sendEmail ?? sendMail;
  let o;
  try { o = orderSummary(session); } catch (err) { logError("order-mail", err, { session: session.id, alert: "ADMIN NOTICE NOT SENT" }); return "+admin-mail-failed"; }
  const kind = printful?.error ? "failed" : "ok";
  const jobs: [string, string | undefined, () => Mail, string | undefined][] = [
    [`mail:admin:${kind}:${session.id}`, ADMIN_EMAIL, () => adminEmail(o, printful), o.email],
  ];
  if (kind === "ok" && o.email) jobs.push([`mail:customer:${session.id}`, o.email, () => customerEmail(o), ADMIN_EMAIL]);
  const failed: string[] = [];
  for (const [key, to, build, replyTo] of jobs) {
    if (!to) continue;
    const who = key.split(":")[1];
    try {
      if (!(await claimOnce(deps.store, key))) continue;
      const m = build();
      let via = await send(to, m, replyTo);
      if (!via && to === ADMIN_EMAIL && deps.sendAdminFallback) via = await deps.sendAdminFallback(m.subject, m.text, replyTo);
      if (!via) throw new Error("No mail provider configured (set RESEND_API_KEY and ORDER_MAIL_FROM)");
      logInfo("order-mail", "sent", { session: session.id, to: who, via });
    } catch (err) {
      await deps.store.remove(key).catch(() => {});
      failed.push(who);
      logError("order-mail", err, { session: session.id, to: who, alert: who === "admin" ? "ADMIN NOTICE NOT SENT" : "CUSTOMER CONFIRMATION NOT SENT" });
    }
  }
  return failed.map((w) => `+${w}-mail-failed`).join("");
}

/** Handle a verified Stripe event. Returns a short status string. Idempotent by session id. */
export async function handleStripeEvent(event: Stripe.Event, deps: Deps): Promise<string> {
  if (event.type !== "checkout.session.completed") return "ignored";
  const partial = event.data.object as Stripe.Checkout.Session;
  if (partial.payment_status !== "paid") return "unpaid";
  // Backup for the success page: mark the shopper's cart as paid so any tab/device still holding it drops it (never re-bills).
  const cartId = validCartId(partial.metadata?.cart_id);
  if (cartId) await markCartCompleted(deps.store, cartId).catch((err) => logError("stripe-webhook", err, { session: partial.id, step: "mark cart completed" }));
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
    if (!printfulLines(session).length) {
      return "self-fulfilled" + (await sendOrderEmails(session, null, deps));
    }
    const order = sessionToPrintfulOrder(session);
    let result;
    try {
      result = await (deps.createOrder ?? createPrintfulOrder)(order, autoConfirm());
    } catch (err) {
      await sendOrderEmails(session, { error: err instanceof Error ? err.message : String(err) }, deps);
      throw err;
    }
    logInfo("stripe-webhook", "printful order created", { session: partial.id, printfulId: result?.id, status: result?.status });
    const mail = await sendOrderEmails(session, { id: result?.id, status: result?.status }, deps);
    return (pins ? "created+self-fulfilled" : "created") + mail;
  } catch (err) {
    await deps.store.remove(partial.id); // let Stripe retry
    logError("stripe-webhook", err, { session: partial.id });
    throw err;
  }
}
