/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone build to significantly reduce container size and RAM usage
  output: 'standalone',
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'dayjs', 'clsx'],
  },
};

module.exports = nextConfig;