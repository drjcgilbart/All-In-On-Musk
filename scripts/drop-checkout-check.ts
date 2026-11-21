import { buildLineItems, PricingError } from "../src/lib/shop/pricing";
import { sessionToPrintfulOrder } from "../src/lib/shop/printful";
import type Stripe from "stripe";

delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.STRIPE_SECRET_KEY;
delete process.env.VERCEL_ENV;
delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
process.env.NEXT_PUBLIC_SITE_URL = "https://preview.example.com";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

async function main() {
const catalog = await buildLineItems([{ sku: "tee-cj26-M", qty: 1 }, { sku: "stk-cj26-4in", qty: 2 }]);
assert(catalog.lineItems.length === 2, "catalog lines");
assert(catalog.lineItems[0].price_data.unit_amount === 3000, "canyon tee price");
assert(catalog.lineItems[0].price_data.product_data.metadata.sku === "tee-cj26-M", "canyon sku");
assert(catalog.lineItems[1].price_data.unit_amount === 1000, "canyon sticker price");
assert(catalog.subtotal === 5000, "catalog subtotal");

const drop = await buildLineItems([
  { sku: "drop-0-0-1", qty: 1 },
  { sku: "drop-0-1-0", qty: 1 },
  { sku: "drop-0-2-0", qty: 1 },
  { sku: "tee-cj26-S", qty: 1 },
]);
assert(drop.lineItems.length === 4, "mixed cart");
function metaOf(li: (typeof drop.lineItems)[number]) {
  return li.price_data.product_data.metadata as Record<string, string>;
}
const tee = drop.lineItems.find((l) => metaOf(l).sku === "drop-0-0-1")!;
assert(tee.price_data.unit_amount === 2800, "drop tee price");
assert(metaOf(tee).pf_variant === "4017", "drop tee variant");
assert(metaOf(tee).pf_product === "71", "drop tee product");
assert(tee.price_data.product_data.tax_code === "txcd_30011000", "drop tee tax");
assert(metaOf(tee).files.includes("tee-print.svg"), "drop tee file");
const mug = drop.lineItems.find((l) => metaOf(l).sku === "drop-0-1-0")!;
assert(mug.price_data.unit_amount === 1800 && metaOf(mug).pf_variant === "1320", "mug");
const sticker = drop.lineItems.find((l) => metaOf(l).sku === "drop-0-2-0")!;
assert(metaOf(sticker).pf_variant === "10163", "sticker variant");
const canyon = drop.lineItems.find((l) => metaOf(l).sku === "tee-cj26-S")!;
assert(canyon.price_data.unit_amount === 3000 && metaOf(canyon).pf_variant === undefined, "catalog line untouched");

const session = {
  id: "cs_test_dropcheck",
  shipping_cost: { amount_total: 599 },
  customer_details: { name: "Ada Tester", email: "ada@example.com" },
  collected_information: { shipping_details: { name: "Ada Tester", address: { line1: "1 Main", city: "Austin", state: "TX", country: "US", postal_code: "78701" } } },
  line_items: {
    data: drop.lineItems.map((li) => ({
      quantity: li.quantity,
      amount_total: li.price_data.unit_amount * li.quantity,
      price: {
        unit_amount: li.price_data.unit_amount,
        product: {
          metadata: li.price_data.product_data.metadata,
          name: li.price_data.product_data.name,
        },
      },
    })),
  },
} as unknown as Stripe.Checkout.Session;

const order = await sessionToPrintfulOrder(session);
assert(order.items.length === 4, "printful items");
const pfTee = order.items.find((i) => i.external_id === "drop-0-0-1")!;
assert(pfTee.variant_id === 4017, "printful tee variant");
assert(pfTee.retail_price === "28.00", "printful tee retail");
assert(pfTee.files[0].url.startsWith("https://preview.example.com/drops/000/tee-print.svg"), "printful tee url");
const pfCanyon = order.items.find((i) => i.external_id === "tee-cj26-S")!;
assert(pfCanyon.variant_id === 4016, "canyon still maps from catalog");
assert(pfCanyon.files[0].url.includes("/shop/print/tee-canyon-jump.png"), "canyon print file");

process.env.VERCEL_ENV = "production";
let refused = false;
try {
  await buildLineItems([{ sku: "drop-0-0-0", qty: 1 }]);
} catch (err) {
  refused = err instanceof PricingError && err.message === "That drop item isn't available.";
}
assert(refused, "production refuses the sample");

const still = await buildLineItems([{ sku: "stk-cj26-4in", qty: 1 }]);
assert(still.lineItems[0].price_data.unit_amount === 1000, "catalog still sells on production");

console.log("drop checkout mapping ok");
}

main();
