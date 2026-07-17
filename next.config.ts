import type { NextConfig } from "next";
import { lanAddresses } from "./lib/network";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", ...lanAddresses().map(({ ip }) => ip)],
  serverExternalPackages: ["@qvac/sdk"],
};

export default nextConfig;
