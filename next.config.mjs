/** @type {import('next').NextConfig} */
// Trigger build to apply BACKEND_API_URL env variable on Vercel
const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: [
    '192.168.1.20', '192.168.1.20:3001',
    '192.168.1.8', '192.168.1.8:3001',
    '172.20.10.4', '172.20.10.4:3001',
    '172.100.1.3', '172.100.1.3:3001',
    'localhost:3001'
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow any image hostname for CMS uploaded images
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';
    console.log("Next.js build rewrites: mapping /api to:", backendUrl);
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
