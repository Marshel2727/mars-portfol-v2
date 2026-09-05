import type { NextConfig } from "next";

const backendInternalUrl = (process.env.BACKEND_INTERNAL_URL || (process.env.NODE_ENV === "development" ? "http://127.0.0.1:5000" : "")).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ] }];
  },
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
