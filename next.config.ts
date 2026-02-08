import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack (Next.js 16 default)
  turbopack: {},
  
  // Serverless functions config
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, x-api-key' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
