/** @type {import('next').NextConfig} */

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const config = {
  output: isStaticExport ? 'export' : 'standalone',
  basePath: isStaticExport ? '/helios-cloud' : '',
  assetPrefix: isStaticExport ? '/helios-cloud/' : '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isStaticExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/v1/:path*',
              destination: `${process.env.HELIOS_API_URL ?? 'http://localhost:8080'}/api/v1/:path*`,
            },
          ];
        },
      }),
};

export default config;
