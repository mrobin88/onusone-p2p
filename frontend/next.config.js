/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/onusone-p2p/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/onusone-p2p' : '',
  // Ensure client-side routing works on GitHub Pages
  experimental: {
    // Remove appDir since it's not needed
  }
  // Remove rewrites since they don't work with static export
}

module.exports = nextConfig