/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['fluent-ffmpeg', 'archiver', 'winston'],
  },
};

module.exports = nextConfig;