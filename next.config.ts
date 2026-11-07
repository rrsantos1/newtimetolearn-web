import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const apiOrigin = apiUrl ? new URL(apiUrl) : null;
const apiPath = apiOrigin?.pathname.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.backblazeb2.com",
        pathname: "/file/**",
      },
      ...(apiOrigin
        ? [{
            protocol: apiOrigin.protocol.slice(0, -1) as "http" | "https",
            hostname: apiOrigin.hostname,
            port: apiOrigin.port,
            pathname: `${apiPath}/**`,
          }]
        : []),
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  reactStrictMode: true,
};

export default nextConfig;
