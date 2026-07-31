/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
}

module.exports = {
  allowedDevOrigins: ['192.168.178.25'],
}
