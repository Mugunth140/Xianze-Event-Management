/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for nginx serving
  output: 'export',

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
};

module.exports = nextConfig;
