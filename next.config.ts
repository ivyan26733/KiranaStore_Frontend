import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.8'],
  // Proxy all /api/* requests to the Express backend.
  // This runs server-side, so BACKEND_URL is never exposed to the browser.
  // Mobile hits http://192.168.1.8:3000/api/... → Next.js rewrites to localhost:5000
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
