// Single source of truth for products, prices and Printful mapping.
// Prices are in cents. The server ONLY trusts prices from this file.
// Printful variant ids come from the public catalog API (GET https://api.printful.com/products/{id}),
// checked 2026-10-15. Re-verify before launch: Printful occasionally retires variants.

export type Variant = {
  sku: string; // our id, sent by the client
  label: string; // e.g. "M" or "One size"
  printfulVariantId: number;
  priceCents?: number; // overrides the product price for this variant (e.g. poster sizes)
  files?: PrintFile[]; // overrides the product print files for this variant (e.g. one file per poster size)
};

export type PrintFile = { type: string; path: string }; // path under /public

export type ProductType = "tees" | "hoodies" | "hats" | "stickers" | "patches" | "posters" | "water-bottles" | "tumblers" | "pins";

// Shop-by-type order and labels (used by /shop?type=...)
export const PRODUCT_TYPES: { id: ProductType; label: string }[] = [
  { id: "tees", label: "Tees" },
  { id: "hoodies", label: "Hoodies" },
  { id: "hats", label: "Hats" },
  { id: "stickers", label: "Stickers" },
  { id: "patches", label: "Patches" },
  { id: "posters", label: "Posters" },
  { id: "water-bottles", label: "Water bottles" },
  { id: "tumblers", label: "Tumblers" },
  { id: "pins", label: "Pins" },
];

export type Product = {
  slug: string;
  type: ProductType;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  image: string;
  // Two-sided printed items only: thumbnails under the main image switch between sides (first = default).
  sides?: { label: string; image: string }[];
  printfulProduct: string; // human note
  variants: Variant[];
  files: PrintFile[];
  taxCode: string; // Stripe product tax code
  // Printful item options. Embroidery REQUIRES thread colours (Printful rejects the order without them).
  // Allowed: #FFFFFF #000000 #96A1A8 #A67843 #FFCC00 #E25C27 #CC3366 #CC3333 #660000 #333366 #005397 #3399FF #6B5294 #01784E #7BA35A
  options?: { id: string; value: string | string[] }[];
  // Self-fulfilled items (e.g. bulk-made enamel pins) never go to Printful; the webhook emails the owner to mail them.
  selfFulfilled?: boolean;
  limited?: boolean; // Limited edition: badge on cards and product pages, featured at the top of /shop
  preorder?: string; // shown on the card and product page, e.g. "Pre-order: ships in about 3 weeks"
};

export const PIN_PREORDER = "Pre-order: ships in about 3 weeks";
export const PATCH_PREORDER = "Pre-order: ships in about 2–3 weeks";
export const STICKER_PREORDER = "Pre-order: ships in about 1–2 weeks";

export const CURRENCY = "usd";

export const PRODUCTS: Product[] = [
  // "Send It: Canyon Jump 2026" limited edition drop (2026-10-22). Printful catalog variant ids checked 2026-10-22.
  {
    slug: "canyon-jump-tee",
    type: "tees",
    name: "Send It: Canyon Jump 2026 Tee",
    tagline: "Cold-gas thrusters, warm hearts",
    description:
      "A new roadster on cold-gas thrusters clears the whole fleet over a red-rock canyon. Printed big on a soft black Bella+Canvas tee for everyone who has ever yelled 'send it' at a livestream. Limited edition.",
    priceCents: 3000,
    image: "/shop/28-tee-canyon-jump.webp",
    printfulProduct: "Bella+Canvas 3001 Unisex Staple T-Shirt, Black (catalog product 71)",
    variants: [
      { sku: "tee-cj26-S", label: "S", printfulVariantId: 4016 },
      { sku: "tee-cj26-M", label: "M", printfulVariantId: 4017 },
      { sku: "tee-cj26-L", label: "L", printfulVariantId: 4018 },
      { sku: "tee-cj26-XL", label: "XL", printfulVariantId: 4019 },
      { sku: "tee-cj26-2XL", label: "2XL", printfulVariantId: 4020, priceCents: 3200 },
      { sku: "tee-cj26-3XL", label: "3XL", printfulVariantId: 5295, priceCents: 3400 },
    ],
    // DTG front ("default" = front on product 71). 4500x5400 transparent PNG, 12x15 in @300dpi.
    files: [{ type: "default", path: "/shop/print/tee-canyon-jump.png" }],
    taxCode: "txcd_30011000", // clothing
    limited: true,
  },
  {
    slug: "canyon-jump-sticker",
    type: "stickers",
    name: "Send It: Canyon Jump 2026 Sticker",
    tagline: "Stick the landing",
    description:
      "A kiss-cut vinyl sticker of the Canyon Jump: one roadster, a lot of thrust, and the whole fleet watching from the rim. Glossy, durable, laptop-ready. Limited edition. About 3 × 4 in glossy kiss-cut vinyl on a 4 × 4 in backing sheet, with rounded corners and a white border.",
    priceCents: 1000,
    image: "/shop/29-sticker-canyon-jump-v2.webp",
    printfulProduct: "Kiss-Cut Stickers, 4x4 in (catalog product 358); 3x4 in art, scaled to fit",
    variants: [{ sku: "stk-cj26-4in", label: "4 in", printfulVariantId: 10164 }],
    files: [{ type: "default", path: "/shop/print/sticker-canyon-jump.png" }],
    taxCode: "txcd_99999999",
    limited: true,
  },
  {
    slug: "canyon-jump-poster",
    type: "posters",
    name: "Send It: Canyon Jump 2026 Poster",
    tagline: "Full send, framed",
    description:
      "The Canyon Jump on enhanced matte paper: a red-rock sunset, a roadster riding cold-gas thrusters, and the fleet lined up below. Two sizes. Limited edition.",
    priceCents: 2500,
    image: "/shop/30-poster-canyon-jump.webp",
    printfulProduct: "Enhanced Matte Paper Poster (in), 18x24 / 12x16 (catalog product 1)",
    variants: [
      { sku: "poster-cj26-1824", label: "18x24 in", printfulVariantId: 1, priceCents: 2500, files: [{ type: "default", path: "/shop/print/poster-canyon-jump-18x24.jpg" }] },
      { sku: "poster-cj26-1216", label: "12x16 in", printfulVariantId: 1349, priceCents: 2200, files: [{ type: "default", path: "/shop/print/poster-canyon-jump-12x16.jpg" }] },
    ],
    files: [{ type: "default", path: "/shop/print/poster-canyon-jump-18x24.jpg" }],
    taxCode: "txcd_99999999",
    limited: true,
  },
  {
    slug: "excellent-data-tee",
    type: "tees",
    name: "Excellent Data Was Collected",
    tagline: "All systems fine-ish",
    description:
      "For every launch that ended in a very fast unscheduled disassembly. Soft, black, and debrief-ready. Wear it to any meeting where the plan changed mid-flight.",
    priceCents: 2800,
    image: "/shop/01-tee-excellent-data-was-collected.png",
    printfulProduct: "Gildan 64000 Unisex Softstyle T-Shirt, Black (catalog product 12)",
    variants: [
      { sku: "tee-edc-S", label: "S", printfulVariantId: 474 },
      { sku: "tee-edc-M", label: "M", printfulVariantId: 505 },
      { sku: "tee-edc-L", label: "L", printfulVariantId: 536 },
      { sku: "tee-edc-XL", label: "XL", printfulVariantId: 567 },
      { sku: "tee-edc-2XL", label: "2XL", printfulVariantId: 598, priceCents: 3000 },
      { sku: "tee-edc-3XL", label: "3XL", printfulVariantId: 629, priceCents: 3200 },
    ],
    // DTG front print. TODO: confirm print-area size/position in Printful's mockup generator.
    files: [{ type: "default", path: "/shop/print/tee-main.png" }],
    taxCode: "txcd_30011000", // clothing
  },
  {
    slug: "funding-secured-woven-patch",
    type: "patches",
    name: "Funding Secured",
    tagline: "for snacks",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield for the analyst who models a trillion-dollar TAM before breakfast and still cannot expense the coffee. Terms not final. Snacks are.",
    priceCents: 699,
    image: "/shop/patches/woven-desk-funding-secured.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-desk", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "chopsticks-certified-patch",
    type: "patches",
    name: "Chopsticks Certified",
    tagline: "Caught it on the first try",
    description:
      "An embroidered patch for anyone who has watched a skyscraper get caught by a pair of giant chopsticks and said 'yeah, normal Tuesday.' Sew it on. Show off.",
    priceCents: 1200,
    image: "/shop/04-patch-chopsticks-certified.png",
    printfulProduct: "Embroidered Patch, Black, Circular 3in (catalog product 516)",
    variants: [{ sku: "patch-chop-3in", label: "3 in round", printfulVariantId: 12981 }],
    // TODO: confirm shape (circular 3in = 12981; square 3in = 15560) matches the artwork.
    files: [{ type: "embroidery_patch_front", path: "/shop/print/patch-main.png" }],
    options: [{ id: "thread_colors_patch_front", value: ["#FFFFFF", "#000000", "#CC3366", "#3399FF", "#333366"] }],
    taxCode: "txcd_99999999", // general tangible goods
  },
  {
    slug: "best-part-is-no-part-tee",
    type: "tees",
    name: "The Best Part Is No Part Tee",
    tagline: "Delete, simplify, launch",
    description:
      "For the engineer who measures progress in parts removed. Soft, black, and stripped down to what actually flies. Wear it to any design review where the answer was 'take it out.'",
    priceCents: 2800,
    image: "/shop/05-tee-best-part-is-no-part-aiom.png",
    printfulProduct: "Gildan 64000 Unisex Softstyle T-Shirt, Black (catalog product 12)",
    variants: [
      { sku: "tee-bpnp-S", label: "S", printfulVariantId: 474 },
      { sku: "tee-bpnp-M", label: "M", printfulVariantId: 505 },
      { sku: "tee-bpnp-L", label: "L", printfulVariantId: 536 },
      { sku: "tee-bpnp-XL", label: "XL", printfulVariantId: 567 },
      { sku: "tee-bpnp-2XL", label: "2XL", printfulVariantId: 598, priceCents: 3000 },
      { sku: "tee-bpnp-3XL", label: "3XL", printfulVariantId: 629, priceCents: 3200 },
    ],
    files: [{ type: "default", path: "/shop/print/tee-best-part-aiom.png" }],
    taxCode: "txcd_30011000", // clothing
  },
  {
    slug: "best-part-is-no-part-sticker",
    type: "stickers",
    name: "The Best Part Is No Part Sticker",
    tagline: "Fewer parts, fewer problems",
    description:
      "A 4 in round kiss-cut vinyl sticker for laptops, toolboxes and anything that could lose a few parts. Durable, glossy, and requirement-free.",
    priceCents: 1000,
    image: "/shop/06-sticker-best-part-is-no-part-aiom.png",
    printfulProduct: "Kiss-Cut Stickers, 4x4 in (catalog product 358)",
    variants: [{ sku: "stk-bpnp-4in", label: "4 in", printfulVariantId: 10164 }],
    files: [{ type: "default", path: "/shop/print/sticker-best-part-aiom.png" }],
    taxCode: "txcd_99999999", // general tangible goods
  },
  {
    slug: "scrubbed-for-weather-patch",
    type: "patches",
    name: "Scrubbed for Weather Again Patch",
    tagline: "T-minus tomorrow",
    description:
      "An embroidered patch for everyone who set an alarm for 5 a.m., drove to the beach, and watched a rain cloud win. Again. Sew it on and try again tomorrow.",
    priceCents: 1200,
    image: "/shop/07-patch-scrubbed-for-weather-again.png",
    printfulProduct: "Embroidered Patch, Black, Circular 3in (catalog product 516)",
    variants: [{ sku: "patch-scrub-3in", label: "3 in round", printfulVariantId: 12981 }],
    files: [{ type: "embroidery_patch_front", path: "/shop/print/patch-scrubbed.png" }],
    options: [{ id: "thread_colors_patch_front", value: ["#FFFFFF", "#000000", "#CC3366", "#3399FF", "#333366"] }],
    taxCode: "txcd_99999999", // general tangible goods
  },
  {
    slug: "scrubbed-for-weather-sticker",
    type: "stickers",
    name: "Scrubbed for Weather Again Sticker",
    tagline: "Launch window: closed",
    description:
      "A 4 in round kiss-cut vinyl sticker for the launch-day regulars who know the forecast by heart. Weatherproof, unlike the countdown.",
    priceCents: 1000,
    image: "/shop/08-sticker-scrubbed-for-weather-again.png",
    printfulProduct: "Kiss-Cut Stickers, 4x4 in (catalog product 358)",
    variants: [{ sku: "stk-scrub-4in", label: "4 in", printfulVariantId: 10164 }],
    files: [{ type: "default", path: "/shop/print/sticker-scrubbed.png" }],
    taxCode: "txcd_99999999", // general tangible goods
  },
  {
    slug: "chopsticks-certified-sticker",
    type: "stickers",
    name: "Chopsticks Certified Sticker",
    tagline: "Caught it on the first try",
    description:
      "A 4 in round kiss-cut vinyl sticker for anyone who watched a tower catch a booster and called it a normal Tuesday. Glossy, durable, catch-certified.",
    priceCents: 1000,
    image: "/shop/09-sticker-chopsticks-certified.png",
    printfulProduct: "Kiss-Cut Stickers, 4x4 in (catalog product 358)",
    variants: [
      { sku: "stk-chop-4in", label: "4 in", printfulVariantId: 10164 },
    ],
    files: [{ type: "default", path: "/shop/print/sticker-chopsticks.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "funding-secured-sticker",
    type: "stickers",
    name: "Funding Secured Sticker",
    tagline: "for snacks",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield edition for the analyst who models a trillion-dollar TAM before breakfast and still cannot expense the coffee. Terms not final. Snacks are.",
    priceCents: 104,
    image: "/shop/stickers/funding-secured-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-desk", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "full-send-sticker",
    type: "stickers",
    name: "Full Send Sticker",
    tagline: "Zero hesitation",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield rocket edition: one tilted rocket, zero hesitation. Stick it on and commit.",
    priceCents: 104,
    image: "/shop/stickers/full-send-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-rocket", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "pad-is-open-sticker",
    type: "stickers",
    name: "Pad Is Open Sticker",
    tagline: "Tower up, pad clear",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield launch-pad edition: tower up, pad clear, snacks staged.",
    priceCents: 104,
    image: "/shop/stickers/pad-is-open-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-pad", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "best-part-is-no-part-crest-sticker",
    type: "stickers",
    name: "Best Part Is No Part Sticker",
    tagline: "Delete, then fly",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield gear edition, for anyone whose best design review was a deletion.",
    priceCents: 104,
    image: "/shop/stickers/best-part-is-no-part-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-gear", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "stable-orbit-sticker",
    type: "stickers",
    name: "Stable Orbit Sticker",
    tagline: "Nominal vibes",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield orbit edition: nominal trajectory, nominal vibes.",
    priceCents: 104,
    image: "/shop/stickers/stable-orbit-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-orbit", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "hold-hold-hold-sticker",
    type: "stickers",
    name: "Hold Hold Hold Sticker",
    tagline: "T-10 and holding",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield countdown edition, for everyone who has heard T-10 and then a hold.",
    priceCents: 104,
    image: "/shop/stickers/hold-hold-hold-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-countdown", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "go-for-launch-sticker",
    type: "stickers",
    name: "Go for Launch Sticker",
    tagline: "Clear-sky nights that go",
    description:
      "A die-cut matte vinyl crest sticker (~2.57″ × 3.00″ shield, cut to outline). Weatherproof Desk-shield stars edition, for the clear-sky nights that actually go.",
    priceCents: 104,
    image: "/shop/stickers/go-for-launch-sticker.png",
    printfulProduct: "None. Die-cut matte vinyl crest sticker ~2.57×3.00 in (cut to outline); ordered from CustomStickers.com and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "stk-die-stars", label: "~3 in die-cut", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: STICKER_PREORDER,
  },
  {
    slug: "full-send-woven-patch",
    type: "patches",
    name: "Full Send",
    tagline: "Zero hesitation",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, rocket edition: one tilted rocket, zero hesitation. Sew it on and commit.",
    priceCents: 699,
    image: "/shop/patches/woven-rocket-full-send.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-rocket", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "pad-is-open-woven-patch",
    type: "patches",
    name: "Pad Is Open",
    tagline: "Tower up, pad clear",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, launch-pad edition: tower up, pad clear, snacks staged.",
    priceCents: 699,
    image: "/shop/patches/woven-launch-pad-pad-is-open.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-pad", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "best-part-is-no-part-woven-patch",
    type: "patches",
    name: "Best Part Is No Part",
    tagline: "Delete, then fly",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, gear edition, for anyone whose best design review was a deletion.",
    priceCents: 699,
    image: "/shop/patches/woven-gear-best-part-is-no-part.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-gear", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "stable-orbit-woven-patch",
    type: "patches",
    name: "Stable Orbit",
    tagline: "Nominal vibes",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, orbit edition: nominal trajectory, nominal vibes.",
    priceCents: 699,
    image: "/shop/patches/woven-orbit-stable-orbit.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-orbit", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "hold-hold-hold-woven-patch",
    type: "patches",
    name: "Hold Hold Hold",
    tagline: "T-10 and holding",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, countdown edition, for everyone who has heard T-10 and then a hold.",
    priceCents: 699,
    image: "/shop/patches/woven-countdown-hold-hold-hold.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-countdown", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "go-for-launch-woven-patch",
    type: "patches",
    name: "Go for Launch",
    tagline: "Clear-sky nights that go",
    description:
      "A woven damask sew-on crest patch (~2.57×3.00 in) with a merrowed border. The Desk shield, stars edition, for the clear-sky nights that actually go.",
    priceCents: 699,
    image: "/shop/patches/woven-stars-go-for-launch.png",
    printfulProduct: "None. Woven damask sew-on crest patch ~2.57×3.00 in, merrowed border; ordered from Panda Patches and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "patch-wvn-stars", label: "~3 in shield", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PATCH_PREORDER,
  },
  {
    slug: "hold-hold-hold-hoodie",
    type: "hoodies",
    name: "Hold Hold Hold Hoodie",
    tagline: "We are go for snacks",
    description:
      "A heavy blend black hoodie with a Stable Orbit shield on the chest and HOLD HOLD HOLD across the back. For every countdown that stopped at T-10.",
    priceCents: 5000,
    image: "/shop/20-hoodie-1-hold-hold-hold.png",
    sides: [
      { label: "Front", image: "/shop/20-hoodie-1-hold-hold-hold-front.png" },
      { label: "Back", image: "/shop/20-hoodie-1-hold-hold-hold.png" },
    ],
    printfulProduct: "Gildan 18500 Unisex Heavy Blend Hoodie, Black (catalog product 146)",
    variants: [
      { sku: "hd1-S", label: "S", printfulVariantId: 5530 },
      { sku: "hd1-M", label: "M", printfulVariantId: 5531 },
      { sku: "hd1-L", label: "L", printfulVariantId: 5532 },
      { sku: "hd1-XL", label: "XL", printfulVariantId: 5533 },
      { sku: "hd1-2XL", label: "2XL", printfulVariantId: 5534 },
      { sku: "hd1-3XL", label: "3XL", printfulVariantId: 5535 },
    ],
    files: [{ type: "front", path: "/shop/print/hoodie-1-front.png" }, { type: "back", path: "/shop/print/hoodie-1-back.png" }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "best-part-hoodie",
    type: "hoodies",
    name: "The Best Part Is No Part Hoodie",
    tagline: "Delete, simplify, stay warm",
    description:
      "The Best Part Is No Part on a heavy blend black hoodie. Fewer parts, more warmth.",
    priceCents: 4500,
    image: "/shop/21-hoodie-2-best-part.png",
    printfulProduct: "Gildan 18500 Unisex Heavy Blend Hoodie, Black (catalog product 146)",
    variants: [
      { sku: "hd2-S", label: "S", printfulVariantId: 5530 },
      { sku: "hd2-M", label: "M", printfulVariantId: 5531 },
      { sku: "hd2-L", label: "L", printfulVariantId: 5532 },
      { sku: "hd2-XL", label: "XL", printfulVariantId: 5533 },
      { sku: "hd2-2XL", label: "2XL", printfulVariantId: 5534 },
      { sku: "hd2-3XL", label: "3XL", printfulVariantId: 5535 },
    ],
    files: [{ type: "front", path: "/shop/print/hoodie-2-front.png" }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "launch-desk-rules-poster",
    type: "posters",
    name: "Launch Desk Rules Poster",
    tagline: "Five rules, zero exceptions",
    description:
      "An 18x24 in matte poster of the five Launch Desk rules, from The Best Part Is No Part to Funding Secured (for snacks).",
    priceCents: 2500,
    image: "/shop/22-poster-1-launch-desk-rules.png",
    printfulProduct: "Enhanced Matte Paper Poster (in), 18x24 (catalog product 1)",
    variants: [
      { sku: "launch-desk--1824", label: "18x24 in", printfulVariantId: 1 },
    ],
    files: [{ type: "default", path: "/shop/print/poster-1-launch-desk-rules.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "countdown-poster",
    type: "posters",
    name: "Countdown Poster",
    tagline: "T-10 to T-00",
    description:
      "An 18x24 in matte poster of a countdown that actually reaches zero. Rare. Frame-worthy.",
    priceCents: 2500,
    image: "/shop/23-poster-2-countdown.png",
    printfulProduct: "Enhanced Matte Paper Poster (in), 18x24 (catalog product 1)",
    variants: [
      { sku: "countdown-po-1824", label: "18x24 in", printfulVariantId: 1 },
    ],
    files: [{ type: "default", path: "/shop/print/poster-2-countdown.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "hydrate-or-scrub-bottle",
    type: "water-bottles",
    name: "Hydrate or Scrub Bottle",
    tagline: "Weather is a go",
    description:
      "A 17 oz black stainless steel water bottle for launch-day beach mornings. Hydrate, or the cloud wins.",
    priceCents: 3600,
    image: "/shop/24-bottle-1-hydrate-or-scrub.png",
    printfulProduct: "Stainless Steel Water Bottle, Black 17 oz (catalog product 382)",
    variants: [
      { sku: "hydrate-or-17oz", label: "17 oz", printfulVariantId: 16030 },
    ],
    files: [{ type: "default", path: "/shop/print/bottle-1-hydrate-or-scrub.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "full-send-shield-bottle",
    type: "water-bottles",
    name: "Full Send Shield Bottle",
    tagline: "All In On Musk Desk hydration",
    description:
      "A 17 oz black stainless steel water bottle with the Desk shield. Full send, fully hydrated.",
    priceCents: 3600,
    image: "/shop/25-bottle-2-shield-full-send.png",
    printfulProduct: "Stainless Steel Water Bottle, Black 17 oz (catalog product 382)",
    variants: [
      { sku: "full-send--17oz", label: "17 oz", printfulVariantId: 16030 },
    ],
    files: [{ type: "default", path: "/shop/print/bottle-2-shield-full-send.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "fuel-load-tumbler",
    type: "tumblers",
    name: "Fuel Load Tumbler",
    tagline: "In progress",
    description:
      "A 20 oz black stainless steel tumbler. Propellant loading, one coffee at a time.",
    priceCents: 3400,
    image: "/shop/26-tumbler-1-fuel-load.png",
    printfulProduct: "Stainless Steel Tumbler, Black 20 oz (catalog product 585)",
    variants: [
      { sku: "fuel-load--20oz", label: "20 oz", printfulVariantId: 15004 },
    ],
    files: [{ type: "default", path: "/shop/print/tumbler-1-fuel-load.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "t-minus-coffee-tumbler",
    type: "tumblers",
    name: "T-Minus Coffee Tumbler",
    tagline: "Hold for caffeine",
    description:
      "A 20 oz black stainless steel tumbler for the morning countdown. No launch before coffee.",
    priceCents: 3400,
    image: "/shop/27-tumbler-2-t-minus-coffee.png",
    printfulProduct: "Stainless Steel Tumbler, Black 20 oz (catalog product 585)",
    variants: [
      { sku: "t-minus-co-20oz", label: "20 oz", printfulVariantId: 15004 },
    ],
    files: [{ type: "default", path: "/shop/print/tumbler-2-t-minus-coffee.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "excellent-data-pin",
    type: "pins",
    name: "Excellent Data Pin",
    tagline: "Flight OK-ish",
    description: "A 1 inch hard enamel pin with polished nickel lines. A rocket, a few sparkles and the official debrief: excellent data was collected.",
    priceCents: 1200,
    image: "/shop/pins/pin-1-excellent-data.png",
    printfulProduct: "None. Hard enamel pin, made in bulk and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "pin-edc-1in", label: "1 in", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PIN_PREORDER,
  },
  {
    slug: "full-send-shield-pin",
    type: "pins",
    name: "Full Send Shield Pin",
    tagline: "All In On Musk Desk issue",
    description: "A 1 inch hard enamel pin in the Desk shield. Rocket up, horizon down, full send.",
    priceCents: 1200,
    image: "/shop/pins/pin-2-full-send-shield.png",
    printfulProduct: "None. Hard enamel pin, made in bulk and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "pin-fss-1in", label: "1 in", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PIN_PREORDER,
  },
  {
    slug: "hold-hold-hold-pin",
    type: "pins",
    name: "Hold Hold Hold Pin",
    tagline: "T-00:10 and holding",
    description: "A 1 inch hard enamel launch-control pin for everyone who has watched a countdown stop at ten seconds. Again.",
    priceCents: 1200,
    image: "/shop/pins/pin-3-hold-hold-hold.png",
    printfulProduct: "None. Hard enamel pin, made in bulk and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "pin-hhh-1in", label: "1 in", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PIN_PREORDER,
  },
  {
    slug: "t-minus-coffee-pin",
    type: "pins",
    name: "T-Minus Coffee Pin",
    tagline: "Fuel load in progress",
    description: "A 1 inch hard enamel pin for the morning countdown. No launch before coffee.",
    priceCents: 1200,
    image: "/shop/pins/pin-4-t-minus-coffee.png",
    printfulProduct: "None. Hard enamel pin, made in bulk and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "pin-tmc-1in", label: "1 in", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PIN_PREORDER,
  },
  {
    slug: "aim-logo-pin",
    type: "pins",
    name: "AIM Logo Pin",
    tagline: "The channel badge",
    description: "The All In On Musk channel badge as a 1 inch hard enamel pin: A, rocket, M, over a Mars horizon.",
    priceCents: 1200,
    image: "/shop/pins/pin-5-aim-logo.png",
    printfulProduct: "None. Hard enamel pin, made in bulk and mailed by All In On Musk (self-fulfilled)",
    variants: [{ sku: "pin-aim-1in", label: "1 in", printfulVariantId: 0 }],
    files: [],
    taxCode: "txcd_99999999",
    selfFulfilled: true,
    preorder: PIN_PREORDER,
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function findVariant(sku: string): { product: Product; variant: Variant } | undefined {
  for (const product of PRODUCTS) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function variantPriceCents(product: Product, variant: Variant) {
  return variant.priceCents ?? product.priceCents;
}

export function variantFiles(product: Product, variant: Variant) {
  return variant.files ?? product.files;
}

/** Lowest variant price, for cards ("from $22"). */
export function minPriceCents(product: Product) {
  return Math.min(...product.variants.map((v) => variantPriceCents(product, v)));
}

export function hasPriceRange(product: Product) {
  return new Set(product.variants.map((v) => variantPriceCents(product, v))).size > 1;
}

export const LIMITED_LABEL = "Limited edition";

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
