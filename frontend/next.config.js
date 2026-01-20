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
};

module.exports = nextConfig;
