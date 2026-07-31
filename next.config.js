/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: ['192.168.178.25'],
}

module.exports = nextConfig