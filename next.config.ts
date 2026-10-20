import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backline is almost entirely live, per-request data (sessions, show state),
  // so we use the classic dynamic rendering model instead of Cache Components.
  cacheComponents: false,
  // Standalone output is for the Docker image (HK server). It needs symlinks,
  // which Windows dev machines often can't create, so it's opt-in.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  serverExternalPackages: ["@electric-sql/pglite"],
  poweredByHeader: false,
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
