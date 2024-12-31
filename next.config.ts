import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [ 
      "oaidalleapiprodscus.blob.core.windows.net"

    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
