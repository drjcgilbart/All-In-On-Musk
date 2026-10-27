import type Stripe from "stripe";
import { ADMIN_EMAIL } from "@/lib/membership/mail";
import { findVariant, formatPrice } from "./catalog";
import { externalIdFor } from "./printful";
import { productionPlan } from "./production";
import { siteUrl } from "./config";

type Ship = { name?: string | null; address?: Stripe.Address | null } | null | undefined;
export type OrderLine = { sku: string; name: string; variant: string; quantity: number; amountCents: number };
export type OrderSummary = {
  orderNumber: string; sessionId: string; customerName: string; email?: string; phone?: string;
  address: string[]; lines: OrderLine[]; subtotalCents: number; shippingCents: number; taxCents: number; totalCents: number;
};
export type PrintfulResult = { id?: number; status?: string; error?: string } | null;

export function orderSummary(session: Stripe.Checkout.Session): OrderSummary {
  const loose = session as unknown as { collected_information?: { shipping_details?: Ship }; shipping_details?: Ship };
  const d = loose.collected_information?.shipping_details ?? loose.shipping_details;
  const a = d?.address;
  const name = d?.name || session.customer_details?.name || "Customer";
  const city = a ? [a.city, a.state].filter(Boolean).join(", ") + (a.postal_code ? ` ${a.postal_code}` : "") : "";
  const lines = (session.line_items?.data ?? []).map((li) => {
    const prod = li.price?.product as Stripe.Product | string | undefined;
    const sku = (typeof prod === "object" ? prod?.metadata?.sku : undefined) ?? "unknown";
    const f = findVariant(sku);
    return { sku, name: f?.product.name ?? li.description ?? sku, variant: f?.variant.label ?? "", quantity: li.quantity ?? 1, amountCents: li.amount_total ?? 0 };
  });
  return {
    orderNumber: externalIdFor(session.id), sessionId: session.id, customerName: name,
    email: session.customer_details?.email || undefined, phone: session.customer_details?.phone || undefined,
    address: a ? [name, a.line1 ?? "", a.line2 ?? "", city, a.country ?? ""].filter(Boolean) : [name],
    lines, subtotalCents: session.amount_subtotal ?? 0, shippingCents: session.shipping_cost?.amount_total ?? 0,
    taxCents: session.total_details?.amount_tax ?? 0, totalCents: session.amount_total ?? 0,
  };
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const $ = (c: number) => formatPrice(c);
const shell = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#05070a;font-family:Helvetica,Arial,sans-serif;color:#f4fbff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070a"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0a0e14;border:1px solid #1d4f4b">
<tr><td style="padding:22px 28px;border-bottom:2px solid #2ee6d6"><div style="font-size:20px;font-weight:700;letter-spacing:3px;color:#f4fbff">ALL IN ON MUSK</div>
<div style="font-family:Menlo,Consolas,monospace;font-size:12px;letter-spacing:2px;color:#2ee6d6;margin-top:4px">${esc(title)}</div></td></tr>
<tr><td style="padding:24px 28px;font-size:15px;line-height:1.5">${body}</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #1d4f4b;font-size:12px;color:#a8b3bd">Unofficial fan merch. Not affiliated with, endorsed by, or sponsored by Elon Musk or any of his companies.<br>Questions? Reply to this email or write to <a href="mailto:${ADMIN_EMAIL}" style="color:#2ee6d6">${ADMIN_EMAIL}</a>.</td></tr>
</table></td></tr></table></body></html>`;
const itemsTable = (o: OrderSummary) => `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;color:#f4fbff">
<tr style="color:#a8b3bd;text-align:left"><th align="left">Item</th><th align="left">Size / option</th><th align="right">Qty</th><th align="right">Amount</th></tr>
${o.lines.map((l) => `<tr style="border-top:1px solid #1d4f4b"><td>${esc(l.name)}</td><td>${esc(l.variant)}</td><td align="right">${l.quantity}</td><td align="right">${$(l.amountCents)}</td></tr>`).join("")}
<tr style="border-top:1px solid #1d4f4b"><td colspan="3">Shipping</td><td align="right">${$(o.shippingCents)}</td></tr>
${o.taxCents ? `<tr><td colspan="3">Tax</td><td align="right">${$(o.taxCents)}</td></tr>` : ""}
<tr><td colspan="3" style="font-weight:700">Total paid</td><td align="right" style="font-weight:700;color:#2ee6d6">${$(o.totalCents)}</td></tr></table>`;

export function customerEmail(o: OrderSummary) {
  const subject = `Your All In On Musk order ${o.orderNumber}`;
  const body = `<p style="margin-top:0">Thanks, ${esc(o.customerName.split(" ")[0] || "friend")}! We got your order and it's going into production.</p>
<p style="font-family:Menlo,Consolas,monospace;font-size:13px;color:#2ee6d6">ORDER ${esc(o.orderNumber)}</p>${itemsTable(o)}
<p style="margin-bottom:4px;color:#a8b3bd;font-size:13px">SHIPPING TO</p><p style="margin-top:0">${o.address.map(esc).join("<br>")}</p>
<p>Items are printed or stitched on demand and usually ship in about 3-7 business days (pre-order pins about 3 weeks; woven crest patches about 2–3 weeks; crest die-cut stickers about 1–2 weeks). You'll get tracking when it ships.</p>
<p><a href="${siteUrl()}/shop" style="color:#ff2bd6">Back to the shop</a></p>`;
  const text = [`Thanks! We got your All In On Musk order ${o.orderNumber}.`, "", ...o.lines.map((l) => `${l.quantity} x ${l.name} (${l.variant}) ${$(l.amountCents)}`),
    `Shipping ${$(o.shippingCents)}`, ...(o.taxCents ? [`Tax ${$(o.taxCents)}`] : []), `Total ${$(o.totalCents)}`, "", "Shipping to:", ...o.address, "", `Questions: ${ADMIN_EMAIL}`].join("\n");
  return { subject, html: shell("ORDER CONFIRMATION", body), text };
}

export type MailAttachment = { filename: string; path: string };
export type Mail = { subject: string; html: string; text: string; attachments?: MailAttachment[] };

const PRINTFUL_STORE = "All In On Musk (Printful store 18910102)";
const PRINTFUL_ORDERS = "https://www.printful.com/dashboard/default/orders";
const H = (t: string) => `<p style="margin:18px 0 4px;color:#a8b3bd;font-size:13px;letter-spacing:1px">${t}</p>`;
const A = (href: string, label = href) => `<a style="color:#2ee6d6" href="${esc(href)}">${esc(label)}</a>`;

export function adminEmail(o: OrderSummary, printful: PrintfulResult): Mail {
  const plans = o.lines.map((l) => {
    const f = findVariant(l.sku);
    return { l, plan: f ? productionPlan(f.product, f.variant) : null };
  });
  const flagged = plans.some((p) => !p.plan || p.plan.flags.length);
  const subject = `${printful?.error ? "[PRINTFUL FAILED] " : flagged ? "[ACTION] " : printful?.status === "draft" ? "[CONFIRM IN PRINTFUL] " : ""}New order ${o.orderNumber}: ${o.lines.map((l) => `${l.quantity}x ${l.name} (${l.variant})`).join(", ")}`;
  const pf = printful?.id ? `Printful order #${printful.id}, status: ${printful.status}` : printful?.error ? `Printful order NOT created: ${printful.error}` : "No Printful order (nothing in this order goes to Printful)";
  const attachments: MailAttachment[] = [];

  const steps = plans.map(({ l, plan }, idx) => {
    const head = `<b>${l.quantity} x ${esc(l.name)}</b> · size/option: <b>${esc(l.variant || "n/a")}</b>${plan ? ` · colour: <b>${esc(plan.color)}</b>` : ""} · sku ${esc(l.sku)}`;
    if (!plan) return `<li style="margin-bottom:16px">${head}<div style="color:#ff2bd6;margin-top:6px"><b>No producer and no production file on record for this item.</b> The sku is not in the catalog, so nothing was sent to a producer. Check the catalog (src/lib/shop/catalog.ts) and make this item by hand, or refund it in Stripe.</div></li>`;
    const flags = plan.flags.map((f) => `<div style="color:#ff2bd6">FLAG: ${esc(f)}</div>`).join("");
    for (const f of plan.files) attachments.push({ filename: `${String(idx + 1).padStart(2, "0")}-${plan.slug}-${f.type}${(f.url.match(/\.[a-z0-9]+$/i) ?? [".png"])[0]}`, path: f.url });
    const files = plan.files.length
      ? `<div style="margin-top:8px">Camera-ready files (attached when small enough; always linked here):</div><ul>${plan.files.map((f) => `<li>${esc(f.placement)} [${esc(f.type)}]: ${A(f.url)}</li>`).join("")}</ul>`
      : `<div style="color:#ff2bd6;margin-top:8px"><b>No production file on record for this item.</b></div>`;
    const colors = plan.colors.length ? `<div>Thread colours:</div><ul>${plan.colors.map((c) => `<li>${esc(c.option)}: ${c.threads.map(esc).join(", ")}</li>`).join("")}</ul>` : "";
    let how: string;
    if (plan.vendor === "printful") {
      const status = printful?.id ? `Printful order <b>#${printful.id}</b> exists, status <b>${esc(printful.status ?? "?")}</b>.` : printful?.error ? `<span style="color:#ff2bd6">The automatic Printful order FAILED: ${esc(printful.error)}</span>` : "No Printful order on record.";
      how = `<div style="margin-top:6px">Producer: <b>Printful</b>, store ${esc(PRINTFUL_STORE)}. Product: ${esc(plan.vendorProduct)}. ${status}</div>
<ol>
<li>Sign in to Printful and open ${A(PRINTFUL_ORDERS, "Dashboard > Orders")} (store: All In On Musk).</li>
<li>Search for <b>${esc(o.orderNumber)}</b>${printful?.id ? ` or order #${printful.id}` : ""} and click it.</li>
<li>Check the product, size <b>${esc(l.variant || "n/a")}</b>, colour <b>${esc(plan.color)}</b>, quantity ${l.quantity}, the ship-to address below, and that each placement shows the file listed here${plan.colors.length ? " with the thread colours listed" : ""}.</li>
<li>If the status is <b>Draft</b>: click <b>Confirm order</b> (Printful charges the card on file, then prints and ships straight to the customer and emails tracking). Nothing needs to be mailed by you.</li>
<li>If the order is missing or failed: click <b>New order</b>, pick ${esc(plan.vendorProduct)}, choose size ${esc(l.variant || "n/a")}, upload the files below to the same placements${plan.colors.length ? ", set the thread colours" : ""}, enter the ship-to address, set external ID ${esc(o.orderNumber)}, then <b>Confirm order</b>.</li>
</ol>`;
    } else {
      const panda = /Panda Patches|woven damask/i.test(plan.vendorProduct);
      const customStickers = /CustomStickers\.com|die-cut matte vinyl crest sticker/i.test(plan.vendorProduct);
      how = panda
        ? `<div style="margin-top:6px">Producer: <b>self (Panda Patches)</b>. ${esc(plan.vendorProduct)}.</div><ol><li>Order ${l.quantity} woven sew-on crest patch(es) from <b>Panda Patches</b> (damask, merrowed border, ~2.57×3.00 in) using the linked art / your Panda mockups — do <b>not</b> send this to Printful.</li><li>When the patches arrive, pack and mail to the ship-to address below (USPS First-Class or Ground Advantage).</li><li>Reply to the customer with tracking. Pre-order: promised to ship in about 2–3 weeks.</li></ol>`
        : customStickers
        ? `<div style="margin-top:6px">Producer: <b>self (CustomStickers.com)</b>. ${esc(plan.vendorProduct)}.</div><ol><li>Order ${l.quantity} die-cut crest sticker(s) from <b>CustomStickers.com</b> (~2.57×3.00 in shield, cut to outline, matte vinyl / weatherproof) using the shop art — do <b>not</b> send this to Printful or Panda Patches.</li><li>When the stickers arrive, pack and mail to the ship-to address below (USPS First-Class or Ground Advantage).</li><li>Reply to the customer with tracking. Pre-order: promised to ship in about 1–2 weeks.</li></ol>`
        : `<div style="margin-top:6px">Producer: <b>none</b>. ${esc(plan.vendorProduct)}.</div><ol><li>Pick ${l.quantity} from stock.</li><li>Pack and mail it to the ship-to address below (USPS First-Class or Ground Advantage).</li><li>Reply to the customer with tracking. Pre-order: promised to ship in about 3 weeks.</li></ol>`;
    }
    return `<li style="margin-bottom:18px">${head}${flags}${how}${files}${colors}</li>`;
  }).join("");

  const body = `<p style="margin-top:0;font-family:Menlo,Consolas,monospace;font-size:13px;color:#2ee6d6">ORDER ${esc(o.orderNumber)} · ${$(o.totalCents)} PAID</p>
${itemsTable(o)}
${H("CUSTOMER")}<p style="margin-top:0">${esc(o.customerName)}<br>${esc(o.email || "(no email)")}${o.phone ? `<br>${esc(o.phone)}` : ""}</p>
${H("SHIP TO")}<p style="margin-top:0">${o.address.map(esc).join("<br>")}</p>
${H("PRINTFUL")}<p style="margin-top:0">${esc(pf)}</p>
${H("HOW TO GET IT MADE AND SHIPPED")}<ol style="padding-left:18px">${steps}</ol>
<p style="color:#a8b3bd;font-size:12px">Order number ${esc(o.orderNumber)} · Stripe checkout session: ${esc(o.sessionId)}</p>`;
  const text = body.replace(/<(br|\/p|\/li|\/tr|\/div|\/ol|\/ul)[^>]*>/g, "\n").replace(/<\/t[dh]>/g, "  ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  return { subject, html: shell("NEW ORDER · PRODUCTION BRIEF", body), text, attachments };
}

/** Max total bytes we attach (Resend allows 40 MB after encoding). Bigger files stay as links in the body. */
export const ATTACH_LIMIT_BYTES = 18 * 1024 * 1024;

/** Keep attachments whose combined size (from a HEAD request) fits the limit; the rest are only linked. */
export async function pickAttachments(list: MailAttachment[] = [], fetchImpl: typeof fetch = fetch, limit = ATTACH_LIMIT_BYTES) {
  const out: MailAttachment[] = [];
  let total = 0;
  for (const a of list) {
    try {
      const r = await fetchImpl(a.path, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      const n = Number(r.headers.get("content-length") ?? NaN);
      if (r.ok && Number.isFinite(n) && total + n <= limit) { out.push(a); total += n; }
    } catch { /* link only */ }
  }
  return out;
}

/** Send through Resend. Returns null when no provider is configured (caller logs it; never throws for config). */
export async function sendMail(to: string, m: Mail, replyTo?: string, fetchImpl: typeof fetch = fetch) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_MAIL_FROM?.trim() || process.env.MEMBERSHIP_FROM?.trim();
  if (!key || !from) return null;
  const attachments = m.attachments?.length ? await pickAttachments(m.attachments, fetchImpl) : [];
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...(replyTo ? { reply_to: replyTo } : {}), subject: m.subject, html: m.html, text: m.text, ...(attachments.length ? { attachments } : {}) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Mail provider ${res.status}: ${(await res.text().catch(() => "")).slice(0, 180)}`);
  return "resend";
}
export { ADMIN_EMAIL };
