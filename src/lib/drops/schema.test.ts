import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  decodeFilesValue,
  describeDropSku,
  dropPhase,
  filesMetadataValue,
  printfulLineFromSnapshot,
  resolveDropPurchase,
  validateDrops,
  type ShopClock,
} from "./schema.ts";

const live: ShopClock = { now: Date.parse("2026-11-12T18:00:00.000Z"), production: false, allowSamplePurchase: true };
const production: ShopClock = { ...live, production: true, allowSamplePurchase: false };
const liveKey: ShopClock = { ...live, allowSamplePurchase: false };

const sample = JSON.parse(readFileSync(new URL("../../data/drops.json", import.meta.url), "utf8"));

test("the committed sample drop is valid and priced from the record", () => {
  const parsed = validateDrops(sample);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const tee = resolveDropPurchase(parsed.drops, "drop-0-0-0", live);
  assert.equal(tee.ok, true);
  if (!tee.ok) return;
  assert.equal(tee.item.priceCents, 2800);
  assert.equal(tee.item.printfulVariantId, 4016);
  assert.equal(tee.item.printfulProductId, 71);
  assert.equal(tee.item.taxCode, "txcd_30011000");
  assert.equal(tee.item.files[0].path, "/drops/000/tee-print.svg");
  const xl = resolveDropPurchase(parsed.drops, "drop-0-0-4", live);
  assert.equal(xl.ok && xl.item.priceCents, 3000);
  const mug = resolveDropPurchase(parsed.drops, "drop-0-1-0", live);
  assert.equal(mug.ok && mug.item.printfulVariantId, 1320);
  assert.equal(mug.ok && mug.item.priceCents, 1800);
  const sticker = resolveDropPurchase(parsed.drops, "drop-0-2-0", live);
  assert.equal(sticker.ok && sticker.item.printfulVariantId, 10163);
});

test("sample drop is refused on production and with a live Stripe key", () => {
  const parsed = validateDrops(sample);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(dropPhase(parsed.drops[0], production), "hidden");
  const prod = resolveDropPurchase(parsed.drops, "drop-0-0-1", production);
  assert.equal(prod.ok, false);
  if (!prod.ok) assert.equal(prod.error, "That drop item isn't available.");
  const blocked = resolveDropPurchase(parsed.drops, "drop-0-0-1", liveKey);
  assert.equal(blocked.ok, false);
  assert.equal(describeDropSku(parsed.drops, "drop-0-0-1", production).name, undefined);
});

test("a retired drop cannot be purchased, and one that has not started cannot either", () => {
  const parsed = validateDrops(sample);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const ended = resolveDropPurchase(parsed.drops, "drop-0-0-0", { ...live, now: Date.parse("2027-01-01T15:00:00.000Z") });
  assert.equal(ended.ok, false);
  if (!ended.ok) assert.equal(ended.error, "That drop has ended.");
  const early = resolveDropPurchase(parsed.drops, "drop-0-0-0", { ...live, now: Date.parse("2026-11-01T15:00:00.000Z") });
  assert.equal(early.ok, false);
  if (!early.ok) assert.equal(early.error, "That drop hasn't started.");
  const quote = describeDropSku(parsed.drops, "drop-0-2-0", { ...live, now: Date.parse("2027-01-01T15:00:00.000Z") });
  assert.equal(quote.available, false);
  assert.equal(quote.name, "Sample Drop Sticker");
});

test("strict record checks reject bad drops and accept an empty override", () => {
  assert.equal(validateDrops({ drops: [] }).ok, true);
  assert.equal(validateDrops([]).ok, true);
  const bad = [
    [{ drops: [{ ...sample.drops[0], price: 1 }] }, "unexpected field"],
    [{ drops: [{ ...sample.drops[0], number: -1 }] }, "number"],
    [{ drops: [{ ...sample.drops[0], starts_at: "tomorrow" }] }, "starts_at"],
    [{ drops: [{ ...sample.drops[0], items: [{ ...sample.drops[0].items[0], print_files: [{ type: "default", path: "/drops/../secret.png" }] }] }] }, "path"],
    [{ drops: [{ ...sample.drops[0], items: [{ ...sample.drops[0].items[0], print_files: [{ type: "default", url: "http://example.com/a.png" }] }] }] }, "https"],
    [{ drops: [sample.drops[0], sample.drops[0]] }, "duplicated"],
  ] as const;
  for (const [doc, needle] of bad) {
    const result = validateDrops(doc);
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, new RegExp(needle));
  }
});

test("checkout snapshot becomes a Printful line at the charged price", () => {
  const packed = filesMetadataValue([{ type: "default", url: "https://cdn.example.com/tee.png" }]);
  assert.equal(packed.mode, "inline");
  if (packed.mode !== "inline") return;
  const files = decodeFilesValue(packed.files);
  assert.deepEqual(files, [{ type: "default", url: "https://cdn.example.com/tee.png" }]);
  assert.equal(decodeFilesValue("[]"), null);
  assert.equal(decodeFilesValue([{ type: "default", url: "http://nope/a.png" }]), null);
  const line = printfulLineFromSnapshot({
    sku: "drop-1-0-0",
    quantity: 2,
    unitAmountCents: 2800,
    name: "Orbit Tee",
    label: "M",
    printfulVariantId: 4017,
    files: files!,
  });
  assert.deepEqual(line, {
    variant_id: 4017,
    quantity: 2,
    external_id: "drop-1-0-0",
    name: "Orbit Tee (M)",
    retail_price: "28.00",
    files: [{ type: "default", url: "https://cdn.example.com/tee.png" }],
  });
});
