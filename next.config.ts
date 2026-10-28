import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Header-only change: drops the `X-Powered-By: Next.js` response header.
  // No effect on rendering, routing, or tool behavior. Compression is left
  // at Next's default (on) — it is not repeated here to avoid config noise.
  poweredByHeader: false,
  serverExternalPackages: ["mongodb"],
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
