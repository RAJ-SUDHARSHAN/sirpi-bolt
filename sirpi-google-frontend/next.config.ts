import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["*"],
  experimental: {
    turbo: false, // disables turbopack
  },
};

export default nextConfig;
