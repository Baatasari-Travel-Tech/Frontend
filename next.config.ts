import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy barrel imports so only the used exports ship. These are
    // the largest contributors to the public JS bundle (icons + animation +
    // charts + date utils + carousel).
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "recharts",
      "date-fns",
      "embla-carousel-react",
    ],
  },
  images: {
    // Serve modern formats — AVIF/WebP are a fraction of the size of JPEG/PNG,
    // which directly improves mobile LCP on the cover/hero images.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Google account profile pictures (seeded as avatar on OAuth signup).
      // Google rotates between lh3, lh4, lh5, lh6, ... subdomains so we
      // wildcard the whole eTLD+1.
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
