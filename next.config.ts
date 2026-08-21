import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb', // Increase from default 1mb to 10mb for file uploads
    },
  },
};

export default nextConfig;
