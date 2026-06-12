/** @type {import('next').NextConfig} */
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
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
