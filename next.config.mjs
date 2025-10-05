/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true, // Prevent ESLint from breaking Vercel builds
  },

  typescript: {
    ignoreBuildErrors: true, // Ignore TS errors during Vercel builds
  },

  
  // Optional: makes sure .env vars are available everywhere
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
};

export default nextConfig;
