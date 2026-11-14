import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Load monorepo root .env in case apps/dashboard/.env is missing or incomplete
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ShipLane/shared"],
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
