/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      enabled: true
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'instructoriaimages.blob.core.windows.net',
        port: '',
        pathname: '/educational-images/**'
      }
    ]
  },
  // Skip collecting page data during build for API routes
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  }
}

module.exports = nextConfig
