/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingRoot: undefined,
  },
  env: {
    PORT: String(process.env.PORT || 8080),
  },
}

module.exports = nextConfig 