// next.config.mjs
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};

// ✅ Explicit, safe runtime caching:
const runtimeCaching = [
  // HTML navigations
  {
    urlPattern: ({ request }) => request.mode === "navigate",
    handler: "NetworkFirst",
    options: {
      cacheName: "pages",
      // NOTE: networkTimeoutSeconds ONLY with NetworkFirst
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 3600 },
    },
  },

  // Static assets (JS/CSS/workers)
  {
    urlPattern: ({ request }) => ["style", "script", "worker"].includes(request.destination),
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "assets",
      expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 },
    },
  },

  // Images
  {
    urlPattern: ({ request }) => request.destination === "image",
    handler: "CacheFirst",
    options: {
      cacheName: "images",
      expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 },
    },
  },

  // 🔒 Never cache auth/register/swap APIs
  { urlPattern: /\/api\/(register|auth|swap)/i, method: "POST", handler: "NetworkOnly" },
  { urlPattern: /\/api\/(register|auth|swap)/i, method: "GET", handler: "NetworkOnly" },
];

export default withPWA({
  dest: "public",
  // SW only in prod; feel free to enable in preview too if you want
  disable: process.env.NODE_ENV !== "production",
  register: true,
  skipWaiting: true,
  runtimeCaching,
})(baseConfig);
