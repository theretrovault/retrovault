import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add your local network IPs here for dev access from other devices on your LAN
  // e.g. allowedDevOrigins: ["192.168.1.100", "localhost", "127.0.0.1"],
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  // Enable standalone output for Docker builds
  // This creates a self-contained build in .next/standalone
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
};

export default nextConfig;

// Docker standalone output configured via DOCKER_BUILD env var
