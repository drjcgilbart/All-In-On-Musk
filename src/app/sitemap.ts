import type { MetadataRoute } from "next";
import { machines } from "@/content/machines";
import { site } from "@/content/site";
import { PRODUCTS } from "@/lib/shop/catalog";

const paths = [
  "",
  "/machines",
  "/markets",
  "/news",
  "/journal",
  "/pictures",
  "/watch",
  "/watch/grok-bot-best-model",
  "/merger",
  "/projects",
  "/projects/robotaxi",
  "/projects/florida-fleet-model",
  "/projects/sunshine-cyber-fleet",
  "/about",
  "/login",
  "/launches",
  "/energy",
  "/glossary",
  "/x",
  "/race/index.html",
  "/shop",
  "/shop/returns",
  "/shop/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...paths.map((path) => ({
      url: `${site.url}${path}`,
      lastModified: site.updatedIso,
      changeFrequency: path === "/markets" || path === "/news" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
    ...machines.map((machine) => ({
      url: `${site.url}/machines/${machine.slug}`,
      lastModified: site.updatedIso,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...PRODUCTS.map((product) => ({
      url: `${site.url}/shop/${product.slug}`,
      lastModified: site.updatedIso,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
