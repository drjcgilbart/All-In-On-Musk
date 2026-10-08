import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/studio", "/api/studio", "/phone-view"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
