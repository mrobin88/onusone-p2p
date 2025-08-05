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
    appDir: false
  },
  // Add rewrites for GitHub Pages SPA support
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/_next/static/chunks/pages/:path*.js',
      },
    ]
  }
}

module.exports = nextConfig