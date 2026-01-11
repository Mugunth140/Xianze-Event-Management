/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output configuration for Docker
  output: 'standalone',

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Strict mode for better development
  reactStrictMode: true,

  // Rewrites to proxy API requests to backend (solves CORS for browser requests)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
