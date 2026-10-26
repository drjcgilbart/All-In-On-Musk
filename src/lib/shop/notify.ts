import type Stripe from "stripe";
import { ADMIN_EMAIL } from "@/lib/membership/mail";
import { externalIdFor, selfFulfilledLines } from "./printful";
import { siteUrl } from "./config";

export type PinOrderMail = {
  orderNumber: string;
  sessionId: string;
  customerName: string;
  email?: string;
  phone?: string;
  address: string[];
  items: { name: string; label: string; quantity: number; sku: string }[];
};

type Ship = { name?: string | null; address?: Stripe.Address | null } | null | undefined;

/** Build the owner notification for the self-fulfilled part of a paid session (pins + woven patches). Returns null if there are none. */
export function pinOrderFromSession(session: Stripe.Checkout.Session): PinOrderMail | null {
  const items = selfFulfilledLines(session);
  if (!items.length) return null;
  const loose = session as unknown as { collected_information?: { shipping_details?: Ship }; shipping_details?: Ship };
  const details = loose.collected_information?.shipping_details ?? loose.shipping_details;
  const a = details?.address;
  if (!a?.line1 || !a?.country) throw new Error("Session has no shipping address");
  const name = details?.name || session.customer_details?.name || "Customer";
  const cityLine = [a.city, a.state, a.postal_code].filter(Boolean).join(", ").replace(/, (\S+)$/, " $1");
  return {
    orderNumber: externalIdFor(session.id),
    sessionId: session.id,
    customerName: name,
    email: session.customer_details?.email || undefined,
    phone: session.customer_details?.phone || undefined,
    address: [name, a.line1, a.line2 || "", cityLine, a.country].filter(Boolean),
    items,
  };
}

function esc(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function pinOrderLetter(o: PinOrderMail) {
  const subject = `Self-fulfill order ${o.orderNumber} to mail: ${o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}`;
  const lines = [
    "A paid order includes self-fulfilled items you mail yourself (not sent to Printful).",
    "Enamel pins: pull from stock. Woven sew-on crest patches: order from Panda Patches, then mail.",
    "",
    `Order number: ${o.orderNumber}`,
    `Stripe checkout session: ${o.sessionId}`,
    `Customer: ${o.customerName}`,
    `Email: ${o.email || "(none)"}`,
    `Phone: ${o.phone || "(none)"}`,
    "",
    "Ship to:",
    ...o.address.map((l) => `  ${l}`),
    "",
    "Items to mail:",
    ...o.items.map((i) => `  ${i.quantity} x ${i.name} (${i.label})`),
    "",
    "Pre-order: pins about 3 weeks; woven crest patches about 2–3 weeks.",
  ];
  const text = lines.join("\n");
  const html = `<pre style="font-family:monospace">${esc(text)}</pre>`;
  return { subject, text, html };
}

/** Send via the site's existing mail path: Resend (RESEND_API_KEY, MEMBERSHIP_FROM), else FormSubmit to the admin inbox. */
export async function sendPinOrderMail(o: PinOrderMail, fetchImpl: typeof fetch = fetch): Promise<string> {
  const { subject, text, html } = pinOrderLetter(o);
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const from = process.env.MEMBERSHIP_FROM?.trim() || "All In On Musk <onboarding@resend.dev>";
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [ADMIN_EMAIL], ...(o.email ? { reply_to: o.email } : {}), subject, text, html }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`Mail provider ${res.status}: ${(await res.text().catch(() => "")).slice(0, 180)}`);
    return "resend";
  }
  const origin = siteUrl();
  const res = await fetchImpl(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Origin: origin, Referer: `${origin}/shop` },
    body: JSON.stringify({ message: text, _subject: subject, ...(o.email ? { _replyto: o.email } : {}), _template: "box", _captcha: "false" }),
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  if (!(res.ok && (data.success === true || data.success === "true"))) throw new Error(data.message || `Form mail ${res.status}`);
  return "formsubmit";
}

/** Admin-only fallback when no mail provider is configured: the same FormSubmit path the self-fulfill notices use. */
export async function sendAdminFormMail(subject: string, text: string, replyTo?: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  const origin = siteUrl();
  const res = await fetchImpl(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Origin: origin, Referer: `${origin}/shop` },
    body: JSON.stringify({ message: text, _subject: subject, ...(replyTo ? { _replyto: replyTo } : {}), _template: "box", _captcha: "false" }),
    signal: AbortSignal.timeout(12000),
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean | string; message?: string };
  if (!(res.ok && (data.success === true || data.success === "true"))) throw new Error(data.message || `Form mail ${res.status}`);
  return "formsubmit";
}
