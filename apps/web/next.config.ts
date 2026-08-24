import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@school/ui', '@school/types', '@school/utils', '@school/validation'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
