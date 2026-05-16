import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@0gfoundation/0g-storage-ts-sdk', 'ethers'],
  async redirects() {
    return [
      { source: '/pitch', destination: '/pitch/index.html', permanent: false },
    ];
  },
};

export default nextConfig;
