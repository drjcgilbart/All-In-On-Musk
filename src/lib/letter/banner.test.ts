import assert from "node:assert/strict";
import test from "node:test";
import { letterBannerCatalog } from "./banner";

test("the og jpeg is the banner for each issue that has one", () => {
  const catalog = letterBannerCatalog();
  assert.equal(catalog.currentDate, "2026-11-23");
  assert.equal(catalog.byDate["2026-11-23"]?.src, "/letter/og/2026-11-23.jpg");
  assert.equal(catalog.byDate["2026-11-22"]?.src, "/letter/og/2026-11-22.jpg");
  assert.equal(catalog.byDate["2026-11-21"]?.src, "/letter/og/2026-11-21.jpg");
  assert.match(catalog.byDate["2026-11-23"]?.alt ?? "", /Optimus/);
  assert.equal(catalog.byDate["2026-11-17"], undefined);
  assert.equal(catalog.byDate["2026-11-23"]?.width, 1200);
  assert.equal(catalog.byDate["2026-11-23"]?.height, 675);
});
