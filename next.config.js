/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  typescript: {
    // Skip typechecking during Docker build to save ~50% RAM/CPU
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip linting during Docker build to save build resources
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;