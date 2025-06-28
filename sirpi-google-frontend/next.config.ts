import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: false, // disables turbopack and reverts to webpack
  },
};

export default nextConfig;