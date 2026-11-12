import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  outputFileTracingIncludes: {
    "/": ["./content/letter/**/*"],
    "/news": ["./content/letter/**/*"],
    "/letter": ["./content/letter/**/*"],
    "/letter/*": ["./content/letter/**/*"],
  },
  async redirects() {
    return [
      { source: "/journal", destination: "/news", permanent: true },
      { source: "/journal/:slug*", destination: "/news", permanent: true },
      { source: "/race", destination: "/race/index.html", permanent: false },
      { source: "/race/", destination: "/race/index.html", permanent: false },
    ];
  },
};

export default nextConfig;
