import { PRODUCTS, variantFiles, type Product, type Variant } from "./catalog";
import { siteUrl } from "./config";

/** Human-readable placement for each Printful file type we use. */
const PLACEMENT: Record<string, string> = {
  default: "Main print area (front print for tees, the whole sticker or poster)",
  front: "Front print (DTG)",
  back: "Back print (DTG)",
  embroidery_front: "Front embroidery (hat front panel, max 4\" x 1.75\")",
  embroidery_back: "Back embroidery (above the strap, max 2\" x 1\", 600 x 300 px @ 300 DPI)",
  embroidery_patch_front: "Embroidered patch (3\" circle)",
};

/** Printful thread names for the hex codes Printful accepts. */
export const THREAD_NAMES: Record<string, string> = {
  "#FFFFFF": "1801 White", "#000000": "1800 Black", "#96A1A8": "1718 Grey", "#A67843": "1672 Old Gold",
  "#FFCC00": "1951 Gold", "#E25C27": "1987 Orange", "#CC3366": "1910 Flamingo", "#CC3333": "1839 Red",
  "#660000": "1784 Maroon", "#333366": "1966 Navy", "#005397": "1842 Royal", "#3399FF": "1695 Aqua/Teal",
  "#6B5294": "1832 Purple", "#01784E": "1751 Kelly Green", "#7BA35A": "1848 Kiwi Green",
};

export type ProductionPlan = {
  slug: string;
  name: string;
  vendor: "printful" | "self";
  vendorProduct: string;
  files: { type: string; placement: string; url: string }[];
  colors: { option: string; threads: string[] }[];
  color: string; // garment/blank colour from the catalog note, or "n/a"
  flags: string[];
};

function threadsFor(p: Product, fileType: string) {
  const opt = fileType === "embroidery_back" ? "thread_colors_back" : fileType === "embroidery_patch_front" ? "thread_colors_patch_front" : "thread_colors";
  const o = p.options?.find((x) => x.id === opt);
  return o ? { option: opt, threads: (Array.isArray(o.value) ? o.value : [o.value]).map((h) => `${h} ${THREAD_NAMES[h] ?? "(unknown thread)"}`) } : null;
}

/** Blank colour from the human Printful note, e.g. "Gildan 64000 ..., Black (catalog product 12)" -> "Black". */
export function productColor(p: Product): string {
  const m = p.printfulProduct.match(/,\s*(Black|White|Navy|Grey|Gray|Heather[A-Za-z ]*|Red|Blue|Green)\b/i);
  return m ? m[1] : "n/a";
}

/** Production plan for a product; pass the ordered variant so per-size print files (e.g. poster sizes) are used. */
export function productionPlan(p: Product, v?: Variant): ProductionPlan {
  const files = v ? variantFiles(p, v) : p.files;
  const flags: string[] = [];
  const vendor = p.selfFulfilled ? "self" : "printful";
  if (vendor === "self") flags.push("Self-fulfilled: not sent to Printful. Mail enamel pins from stock, or order woven crest patches from Panda Patches, then ship to the customer.");
  if (!files.length) flags.push("No production/print file on record for this item.");
  for (const f of files) if (!PLACEMENT[f.type]) flags.push(`Unknown placement type "${f.type}".`);
  const colors: ProductionPlan["colors"] = [];
  for (const f of files) {
    if (f.type.startsWith("embroidery")) {
      const t = threadsFor(p, f.type);
      if (t) colors.push(t); else flags.push(`No thread colours on record for ${f.type}.`);
    }
  }
  return {
    slug: p.slug, name: p.name, vendor, vendorProduct: p.printfulProduct,
    color: productColor(p),
    files: files.map((f) => ({ type: f.type, placement: PLACEMENT[f.type] ?? f.type, url: siteUrl() + f.path })),
    colors, flags,
  };
}

export const PRODUCTION_MAP = () => PRODUCTS.map((p) => productionPlan(p));
