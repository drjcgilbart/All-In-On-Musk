// Single source of truth for products, prices and Printful mapping.
// Prices are in cents. The server ONLY trusts prices from this file.
// Printful variant ids come from the public catalog API (GET https://api.printful.com/products/{id}),
// checked 2026-10-15. Re-verify before launch: Printful occasionally retires variants.

export type Variant = {
  sku: string; // our id, sent by the client
  label: string; // e.g. "M" or "One size"
  printfulVariantId: number;
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
  preorder?: string; // shown on the card and product page, e.g. "Pre-order: ships in about 3 weeks"
};

export const PIN_PREORDER = "Pre-order: ships in about 3 weeks";

export const CURRENCY = "usd";

export const PRODUCTS: Product[] = [
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
      { sku: "tee-edc-2XL", label: "2XL", printfulVariantId: 598 },
      { sku: "tee-edc-3XL", label: "3XL", printfulVariantId: 629 },
    ],
    // DTG front print. TODO: confirm print-area size/position in Printful's mockup generator.
    files: [{ type: "default", path: "/shop/print/tee-main.png" }],
    taxCode: "txcd_30011000", // clothing
  },
  {
    slug: "all-in-on-musk-desk-hat",
    type: "hats",
    name: "All In On Musk Desk",
    tagline: "Funding secured (for snacks)",
    description:
      "An embroidered dad hat for the analyst who models a trillion-dollar TAM before breakfast and still can't expense the coffee. Terms not final. Snacks are.",
    priceCents: 3000,
    image: "/shop/03-hat-musconomy-desk-funding-secured.png",
    sides: [
      { label: "Front", image: "/shop/03-hat-musconomy-desk-funding-secured.png" },
      { label: "Back", image: "/shop/back/03-hat-desk-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [{ sku: "hat-desk-OS", label: "One size", printfulVariantId: 7854 }],
    // TODO: embroidery files need a digitized/flat-colour version; Printful may charge digitization.
    files: [
      { type: "embroidery_front", path: "/shop/print/hat.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#FFFFFF", "#3399FF", "#CC3366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000", // clothing
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
      { sku: "tee-bpnp-2XL", label: "2XL", printfulVariantId: 598 },
      { sku: "tee-bpnp-3XL", label: "3XL", printfulVariantId: 629 },
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
    priceCents: 500,
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
    priceCents: 500,
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
    priceCents: 500,
    image: "/shop/09-sticker-chopsticks-certified.png",
    printfulProduct: "Kiss-Cut Stickers, 4x4 in (catalog product 358)",
    variants: [
      { sku: "stk-chop-4in", label: "4 in", printfulVariantId: 10164 },
    ],
    files: [{ type: "default", path: "/shop/print/sticker-chopsticks.png" }],
    taxCode: "txcd_99999999",
  },
  {
    slug: "shield-hat-rocket",
    type: "hats",
    name: "Full Send Shield Hat",
    tagline: "All In On Musk Desk, rocket edition",
    description:
      "An embroidered black dad hat with the Desk shield, the rocket edition: one tilted rocket, zero hesitation.",
    priceCents: 3000,
    image: "/shop/10-hat-shield-01-rocket.png",
    sides: [
      { label: "Front", image: "/shop/10-hat-shield-01-rocket.png" },
      { label: "Back", image: "/shop/back/10-hat-shield-01-rocket-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh01-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-01-rocket.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "shield-hat-launch-pad",
    type: "hats",
    name: "Pad Is Open Shield Hat",
    tagline: "All In On Musk Desk, pad edition",
    description:
      "An embroidered black dad hat with the Desk shield, the launch pad edition: tower up, pad clear, snacks staged.",
    priceCents: 3000,
    image: "/shop/11-hat-shield-02-launch-pad.png",
    sides: [
      { label: "Front", image: "/shop/11-hat-shield-02-launch-pad.png" },
      { label: "Back", image: "/shop/back/11-hat-shield-02-launch-pad-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh02-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-02-launch-pad.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "shield-hat-gear",
    type: "hats",
    name: "Delete the Part Shield Hat",
    tagline: "All In On Musk Desk, gear edition",
    description:
      "An embroidered black dad hat with the Desk shield, the gear edition, for anyone whose best design review was a deletion.",
    priceCents: 3000,
    image: "/shop/12-hat-shield-03-gear.png",
    sides: [
      { label: "Front", image: "/shop/12-hat-shield-03-gear.png" },
      { label: "Back", image: "/shop/back/12-hat-shield-03-gear-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh03-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-03-gear.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "shield-hat-orbit",
    type: "hats",
    name: "Stable Orbit Shield Hat",
    tagline: "All In On Musk Desk, orbit edition",
    description:
      "An embroidered black dad hat with the Desk shield, the orbit edition: nominal trajectory, nominal vibes.",
    priceCents: 3000,
    image: "/shop/13-hat-shield-04-orbit.png",
    sides: [
      { label: "Front", image: "/shop/13-hat-shield-04-orbit.png" },
      { label: "Back", image: "/shop/back/13-hat-shield-04-orbit-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh04-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-04-orbit.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "shield-hat-countdown",
    type: "hats",
    name: "Hold Hold Hold Shield Hat",
    tagline: "All In On Musk Desk, countdown edition",
    description:
      "An embroidered black dad hat with the Desk shield, the countdown edition, for everyone who has heard T-10 and then a hold.",
    priceCents: 3000,
    image: "/shop/14-hat-shield-05-countdown.png",
    sides: [
      { label: "Front", image: "/shop/14-hat-shield-05-countdown.png" },
      { label: "Back", image: "/shop/back/14-hat-shield-05-countdown-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh05-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-05-countdown.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
  },
  {
    slug: "shield-hat-stars",
    type: "hats",
    name: "Go for Launch Shield Hat",
    tagline: "All In On Musk Desk, stars edition",
    description:
      "An embroidered black dad hat with the Desk shield, the stars edition, for the clear-sky nights that actually go.",
    priceCents: 3000,
    image: "/shop/15-hat-shield-06-stars.png",
    sides: [
      { label: "Front", image: "/shop/15-hat-shield-06-stars.png" },
      { label: "Back", image: "/shop/back/15-hat-shield-06-stars-back.png" },
    ],
    printfulProduct: "Yupoong 6245CM Classic Dad Hat, Black (catalog product 206)",
    variants: [
      { sku: "hat-sh06-OS", label: "One size", printfulVariantId: 7854 },
    ],
    files: [
      { type: "embroidery_front", path: "/shop/print/hat-shield-06-stars.png" },
      { type: "embroidery_back", path: "/shop/print/hat-back-aim.png" },
    ],
    options: [{ id: "thread_colors", value: ["#000000", "#FFFFFF", "#3399FF", "#CC3366", "#333366"] }, { id: "thread_colors_back", value: ["#000000", "#FFFFFF", "#CC3333", "#E25C27"] }],
    taxCode: "txcd_30011000",
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

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
