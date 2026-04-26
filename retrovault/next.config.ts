import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add your local network IPs here for dev access from other devices on your LAN
  // e.g. allowedDevOrigins: ["192.168.1.100", "localhost", "127.0.0.1"],
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.158"],

  // Keep tesseract.js as an external package so Turbopack doesn't bundle it.
  // This is required because tesseract.js spawns Node worker threads and
  // resolves its own worker script using __dirname, which Turbopack rewrites
  // to a virtual /ROOT/ path that doesn't exist on disk.
  serverExternalPackages: ["tesseract.js", "tesseract.js-core", "sharp"],
};

export default nextConfig;
