/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: '',
  assetPrefix: './',
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

export default nextConfig;
