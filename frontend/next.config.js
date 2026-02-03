/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds
  ...(process.env.NODE_ENV === 'production' && { output: 'export' }),

  // Required for static export with images
  images: {
    unoptimized: true,
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for better development
  reactStrictMode: true,

  // Trailing slashes for static hosting compatibility
  trailingSlash: true,

  // Ignore ESLint errors during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignore TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },

  // Environment variables for client
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'),
  },

  // Webpack configuration for pdfjs-dist compatibility
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Disable webpack parsing for pdfjs-dist worker
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    return config;
  },
};

module.exports = nextConfig;
