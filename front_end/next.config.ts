import type { NextConfig } from "next";

const backendInternalUrl = process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  skipTrailingSlashRedirect: true,
  async rewrites() {
    if (!backendInternalUrl) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${backendInternalUrl}/api/:path*`,
      },
      {
        source: "/static/uploads/:path*",
        destination: `${backendInternalUrl}/static/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
