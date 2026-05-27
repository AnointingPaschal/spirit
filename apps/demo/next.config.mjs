/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@spirit-protocol/core', '@spirit-protocol/react'],
  experimental: {
    serverComponentsExternalPackages: ['pg'],
  },
};

export default nextConfig;
