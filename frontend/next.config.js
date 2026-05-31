/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // In local development, proxy /api/v1/* to the Express backend.
  // On Vercel, routing is handled at the CDN level by vercel.json —
  // the rewrite is NOT needed there and would cause a double-hop.
  ...(process.env.VERCEL !== "1" && {
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/:path*`,
        },
      ];
    },
  }),
};

module.exports = nextConfig;

