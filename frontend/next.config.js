/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  

  
  // Disable development tools in production
  ...(process.env.NODE_ENV === 'production' && {
    // Disable React DevTools in production
    webpack: (config, { dev, isServer }) => {
      if (!dev && !isServer) {
        config.resolve.alias = {
          ...config.resolve.alias,
          'react-devtools': false,
        };
      }
      return config;
    },
    
    // Disable source maps in production
    productionBrowserSourceMaps: false,
    
    // Optimize bundle
    experimental: {
      optimizeCss: true,
      optimizePackageImports: ['@solana/web3.js', '@solana/spl-token'],
    },
  }),
  
  // Environment-specific settings
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Disable unnecessary features
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Optimize images
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Reduce bundle size
  experimental: {
    modularizeImports: {
      '@solana/web3.js': {
        transform: '@solana/web3.js/{{member}}',
      },
    },
  },
}

module.exports = nextConfig