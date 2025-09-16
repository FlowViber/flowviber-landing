/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        pg: false,
        'pg-pool': false,
        'pg-connection-string': false,
      }
      // Exclude PostgreSQL modules from client bundle
      config.externals = config.externals || []
      config.externals.push('pg', 'pg-pool', 'pg-connection-string')
    }
    return config
  },
  serverExternalPackages: ['pg', 'pg-pool', 'pg-connection-string'],
  // Allow cross-origin requests for Replit environment
  experimental: {
    allowedDevOrigins: ["*.replit.dev", "127.0.0.1", "localhost"]
  }
}

export default nextConfig