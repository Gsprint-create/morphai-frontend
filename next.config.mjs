/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: { serverActions: { allowedOrigins: ["*"] } },
};
export default config;
