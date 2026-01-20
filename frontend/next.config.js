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

  // Environment variables for client
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000',
  },
};

module.exports = nextConfig;
