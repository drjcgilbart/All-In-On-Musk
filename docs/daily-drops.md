# Daily Drops

A daily drop is a numbered release that is for sale only between `starts_at` and `ends_at`. A real drop lasts 24 hours. After `ends_at` it is retired: it leaves the shop (after a short "this drop has ended" note) and checkout refuses it forever.

The shop reads drops at request time. Publishing or retiring one does not need a deploy.

## Where the record lives

1. Redis key `shop:drops` (Upstash). When this key is set, it is the whole list. It replaces the file. A valid `{"drops":[]}` means there is no drop.
2. `src/data/drops.json` is the fallback, used only when the key is missing, empty, or fails validation. The file in git holds Sample Drop `#000`, which is marked `sample: true`.

`sample: true` drops are hidden on the production deploy (`VERCEL_ENV=production`) and checkout refuses them there. They also cannot be checked out when `STRIPE_SECRET_KEY` is a live key. They exist so a preview has a drop to look at.

An invalid Redis value is ignored and logged (`scope: "drops"`). The shop then uses the file. Fix the record and write it again.

## Record

JSON object. Unknown fields are rejected. Money is integer cents. Timestamps are ISO-8601 with a timezone (`Z` or `±hh:mm`).

```json
{
  "drops": [
    {
      "number": 1,
      "title": "Orbit Tuesday",
      "description": "One day only.",
      "starts_at": "2026-11-12T09:00:00-05:00",
      "ends_at": "2026-11-13T09:00:00-05:00",
      "items": [
        {
          "type": "tee",
          "name": "Orbit Tuesday Tee",
          "tagline": "One day only",
          "description": "Printed on a black tee.",
          "price": 2800,
          "printful_product_id": 71,
          "variants": [
            { "id": 4016, "size": "S", "color": "Black" },
            { "id": 4020, "size": "2XL", "color": "Black", "price": 3000 }
          ],
          "print_files": [{ "type": "default", "path": "/drops/001/tee.png" }],
          "mockups": ["/drops/001/tee.png"]
        }
      ]
    }
  ]
}
```

A bare array of drops is also accepted.

| Field | Required | Notes |
| --- | --- | --- |
| `number` | yes | Integer 0–9999, unique in the document. Shown as `#001`. |
| `title`, `description` | yes | Shown on `/shop`. |
| `starts_at`, `ends_at` | yes | Sale window. `ends_at` is exclusive. Set `ends_at` to `starts_at` plus 24 hours. |
| `sample` | no | Preview-only. Hidden and unsellable on production and whenever the Stripe key is live. |
| `placeholder` | no | Shown during the window, never sold. Cannot be combined with `sample`. |
| `items` | yes | 1–8 items. `type` is `tee`, `mug`, or `sticker`. |
| `items[].price` | yes | Cents, 100–100000. This is the price checkout charges. |
| `items[].variants[].id` | yes | Printful catalog variant id. Must be a positive integer except on a placeholder. |
| `items[].variants[].price` | no | Cents override for that size (2XL / 3XL). |
| `items[].printful_product_id` | yes | Printful catalog product id. |
| `items[].print_files` | yes | One object per placement: `{ "type": "default", "path": "/drops/001/tee.png" }` or `{ "type": "default", "url": "https://…" }`. Path or url, not both. At least one file, except on a placeholder. |
| `items[].mockups` | yes | 1–4 site paths or https URLs. The first one is the shop image. |
| `items[].tax_code` | no | Stripe tax code. Defaults: tees `txcd_30011000`, mugs and stickers `txcd_99999999`. |

`print_files[].type` is the Printful placement (`default` for a front print, a sticker, or a mug). Use PNG or JPG files that match Printful's print area. The sample drop uses SVG stand-ins and is not for sale.

Item order and variant order are the SKU. Do not reorder them while the drop is live.

- SKU: `drop-{number}-{itemIndex}-{variantIndex}` (indexes start at 0). Example: `drop-1-0-1` is drop 1, first item, second variant.
- Page: `/shop/drop/{number}/{itemIndex}`

## Publish

Write the whole document to `shop:drops`. From a machine that has the Upstash REST credentials:

```js
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

await redis.set("shop:drops", document);
```

`document` is the object above (or the result of `JSON.parse`). The shop accepts either a parsed object or a JSON string. The shop picks it up on the next request. No deploy.

To go back to the committed file, delete the key: `DEL shop:drops`.

## Retire

Set that drop's `ends_at` to the current time (ISO, with `Z` or an offset) and `SET` the document again. Checkout starts refusing it immediately. The shop shows "This drop has ended" for 48 hours, then the section disappears.

Leave the product data in the document until you publish the next one. You can replace the document with only the new drop. Orders already paid still go to Printful: at checkout the variant id, price, and print-file URLs are copied onto the Stripe line item. Retiring or replacing the record does not change a payment that already happened.

If the JSON of those print-file URLs is longer than 450 characters, checkout stores it in Redis at `shop:drop-files:<id>` for 21 days (same Upstash credentials) and the paid order still fulfills from that copy.

## Sample Drop #000

`src/data/drops.json` is Sample Drop `#000` (tee, mug, sticker), `sample: true`, window 2026-11-11 09:00 ET through 2026-12-31 09:00 ET. That window is long so this preview stays visible. A real drop should last 24 hours.

Printful ids on the sample, checked against the public catalog:

- Tee: Bella+Canvas 3001, product `71`, variants `4016` `4017` `4018` `4019` `4020` `5295` (S–3XL, black). 2XL is $30, 3XL is $32.
- Mug: White Glossy Mug, product `19`, variant `1320` (11 oz).
- Sticker: Kiss-Cut Stickers, product `358`, variant `10163` (3×3 in).

On a non-production deploy with a test Stripe key, the sample can be added to the cart and checked out. On production, or anywhere the Stripe secret is a live key, it is not for sale. The sample is not a real release.

Off production, `?asOf=2027-01-01T12:00:00-05:00` on `/shop` shows the retired state. Checkout ignores `asOf` and uses the real clock.
