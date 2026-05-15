import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@0gfoundation/0g-storage-ts-sdk', 'ethers'],
};

export default nextConfig;
