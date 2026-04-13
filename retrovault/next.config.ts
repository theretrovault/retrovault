import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.158", "localhost", "127.0.0.1", "192.168.1.2"],
  // Enable standalone output for Docker builds
  // This creates a self-contained build in .next/standalone
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
};

export default nextConfig;
