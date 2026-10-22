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
<p>Items are printed or stitched on demand and usually ship in about 3-7 business days (pre-order pins ship in about 3 weeks). You'll get tracking when it ships.</p>
<p><a href="${siteUrl()}/shop" style="color:#ff2bd6">Back to the shop</a></p>`;
  const text = [`Thanks! We got your All In On Musk order ${o.orderNumber}.`, "", ...o.lines.map((l) => `${l.quantity} x ${l.name} (${l.variant}) ${$(l.amountCents)}`),
    `Shipping ${$(o.shippingCents)}`, ...(o.taxCents ? [`Tax ${$(o.taxCents)}`] : []), `Total ${$(o.totalCents)}`, "", "Shipping to:", ...o.address, "", `Questions: ${ADMIN_EMAIL}`].join("\n");
  return { subject, html: shell("ORDER CONFIRMATION", body), text };
}

export function adminEmail(o: OrderSummary, printful: PrintfulResult) {
  const plans = o.lines.map((l) => ({ l, plan: (() => { const f = findVariant(l.sku); return f ? productionPlan(f.product) : null; })() }));
  const flagged = plans.some((p) => !p.plan || p.plan.flags.length);
  const subject = `${printful?.error ? "[PRINTFUL FAILED] " : flagged ? "[ACTION] " : ""}New order ${o.orderNumber}: ${o.lines.map((l) => `${l.quantity}x ${l.name} (${l.variant})`).join(", ")}`;
  const pf = printful?.id ? `Printful order #${printful.id}, status: ${printful.status}` : printful?.error ? `Printful order NOT created: ${printful.error}` : "No Printful order (nothing in this order goes to Printful)";
  const steps = plans.map(({ l, plan }) => {
    if (!plan) return `<li><b>${esc(l.name)}</b>: <span style="color:#ff2bd6">UNKNOWN SKU ${esc(l.sku)}. No product, vendor or files on record. Check the catalog.</span></li>`;
    const flags = plan.flags.map((f) => `<div style="color:#ff2bd6">FLAG: ${esc(f)}</div>`).join("");
    const files = plan.files.map((f) => `<li>${esc(f.placement)}: <a style="color:#2ee6d6" href="${f.url}">${esc(f.url)}</a></li>`).join("");
    const colors = plan.colors.map((c) => `<li>${esc(c.option)}: ${c.threads.map(esc).join(", ")}</li>`).join("");
    const how = plan.vendor === "printful"
      ? `<ol><li>Vendor on record: <b>Printful</b> (auto-fulfilled), product: ${esc(plan.vendorProduct)}.</li>
<li>Printful already received this order from the webhook with the files and colours below (${esc(pf)}).</li>
<li>Check it at <a style="color:#2ee6d6" href="https://www.printful.com/dashboard/default/orders">Printful &gt; Orders</a> and search for <b>${esc(o.orderNumber)}</b>. If it is a draft, review the mockup and confirm it; nothing needs to be sent.</li>
<li>If it is missing or failed, create it manually in Printful with the same product, size/option, files, placements and thread colours.</li></ol>`
      : `<ol><li>Vendor on record: <b>none</b> (${esc(plan.vendorProduct)}).</li><li>Pick ${l.quantity} from stock, pack and mail to the address above.</li><li>Pre-order: promised to ship in about 3 weeks.</li></ol>`;
    return `<li style="margin-bottom:14px"><b>${l.quantity} x ${esc(l.name)}</b> (${esc(l.variant)}), sku ${esc(l.sku)}${flags}${how}
${files ? `<div>Production files (full resolution, live approved art):</div><ul>${files}</ul>` : ""}${colors ? `<div>Thread colours:</div><ul>${colors}</ul>` : ""}</li>`;
  }).join("");
  const body = `<p style="margin-top:0;font-family:Menlo,Consolas,monospace;font-size:13px;color:#2ee6d6">ORDER ${esc(o.orderNumber)} · ${$(o.totalCents)} PAID</p>
${itemsTable(o)}
<p style="margin-bottom:4px;color:#a8b3bd;font-size:13px">CUSTOMER</p><p style="margin-top:0">${esc(o.customerName)}<br>${esc(o.email || "(no email)")}${o.phone ? `<br>${esc(o.phone)}` : ""}</p>
<p style="margin-bottom:4px;color:#a8b3bd;font-size:13px">SHIP TO</p><p style="margin-top:0">${o.address.map(esc).join("<br>")}</p>
<p style="margin-bottom:4px;color:#a8b3bd;font-size:13px">PRINTFUL</p><p style="margin-top:0">${esc(pf)}</p>
<p style="margin-bottom:4px;color:#a8b3bd;font-size:13px">PRODUCTION BRIEF</p><ol style="padding-left:18px">${steps}</ol>
<p style="color:#a8b3bd;font-size:12px">Stripe checkout session: ${esc(o.sessionId)}</p>`;
  return { subject, html: shell("NEW ORDER · PRODUCTION BRIEF", body), text: body.replace(/<(br|\/p|\/li|\/tr|\/div|\/ol|\/ul)[^>]*>/g, "\n").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim() };
}

/** Send through Resend. Returns null when no provider is configured (caller logs it; never throws for config). */
export async function sendMail(to: string, m: { subject: string; html: string; text: string }, replyTo?: string, fetchImpl: typeof fetch = fetch) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_MAIL_FROM?.trim() || process.env.MEMBERSHIP_FROM?.trim();
  if (!key || !from) return null;
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], ...(replyTo ? { reply_to: replyTo } : {}), subject: m.subject, html: m.html, text: m.text }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Mail provider ${res.status}: ${(await res.text().catch(() => "")).slice(0, 180)}`);
  return "resend";
}
export { ADMIN_EMAIL };
