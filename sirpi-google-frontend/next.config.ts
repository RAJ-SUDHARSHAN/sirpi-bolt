import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["*"],
  experimental: {
    turbo: false, // disables turbopack and reverts to webpack
  },
};

export default nextConfig;
