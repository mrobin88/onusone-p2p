/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '/onusone-p2p/' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/onusone-p2p' : '',
}

module.exports = nextConfig