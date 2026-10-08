import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  async redirects() {
    return [
      { source: "/race", destination: "/race/index.html", permanent: false },
      { source: "/race/", destination: "/race/index.html", permanent: false },
    ];
  },
};

export default nextConfig;
