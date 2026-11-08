import type { NextConfig } from "next";

// next dev behind an HTTPS tunnel, for the Telegram login (TWA-02): the tunnel host may load the
// dev server, and /api/* goes to the functions emulator, so one tunnel URL serves both.
const devApiProxy = process.env.NODE_ENV === "development" ? process.env.DEV_API_PROXY : undefined;
const devTunnelHost = process.env.NODE_ENV === "development" ? process.env.DEV_TUNNEL_HOST : undefined;

const nextConfig: NextConfig = {
    images: {
    // The app is deployed as static files (no server function), so /_next/image does not exist:
    // images load directly from their source.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  ...(devTunnelHost ? { allowedDevOrigins: [devTunnelHost] } : {}),
  ...(devApiProxy ? {
    async rewrites() {
      return [{ source: "/api/:path*", destination: `${devApiProxy}/api/:path*` }];
    },
  } : {}),
};

export default nextConfig;
