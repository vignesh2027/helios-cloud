import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env['HELIOS_API_URL'] ?? 'http://localhost:8080'}/api/v1/:path*`,
      },
    ];
  },
};

export default config;
