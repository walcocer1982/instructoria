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
  }
}

module.exports = nextConfig
