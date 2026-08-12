import type { NextConfig } from "next";

/**
 * Fail the build when a required public variable is missing.
 *
 * Every NEXT_PUBLIC_* value is inlined into the bundle at BUILD time. Miss one
 * and nothing complains: the build succeeds, the site deploys, pages render —
 * and then `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/...` resolves to a
 * path on our own origin, so every API call 404s against ourselves.
 *
 * That failure has now happened twice, and it is genuinely hard to read from
 * the symptoms: sign-in breaks, the session never loads, and the maintenance
 * gate silently stops working because the middleware reads the same variable
 * and fails open. One missing string, four unrelated-looking bugs.
 *
 * A build that stops is a far cheaper way to learn this than a deployed site
 * that looks fine.
 *
 * Only enforced for production builds, so `next dev` and lint still run in a
 * bare checkout.
 *
 * Only NEXT_PUBLIC_API_URL is listed. The avatar and event-cover base URLs are
 * also NEXT_PUBLIC_, but lib/avatar.ts and lib/event-cover.ts both fall back to
 * the correct S3 bucket when unset — which is how they have always run, Vercel
 * included. Demanding them here would fail builds over variables that do not
 * need to exist.
 */
const REQUIRED_PUBLIC_ENV = ["NEXT_PUBLIC_API_URL"] as const;

if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_PUBLIC_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required build variables: ${missing.join(", ")}.\n\n` +
        "These are inlined into the bundle at BUILD time.\n\n" +
        "On Cloudflare there are two separate places, and only one of them works:\n" +
        "  Settings > Build          -> build variables   <- PUT IT HERE\n" +
        "  Settings > Variables and Secrets -> runtime    <- has no effect on this\n\n" +
        "The build section is the same screen that holds the build and deploy\n" +
        "commands. See DEPLOY-CLOUDFLARE.md step 4.",
    );
  }
}

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
    // No host-side optimizer.
    //
    // This used to rely on Vercel's, which is not available on every runtime —
    // it needs sharp, a native binary. Rather than trade one host lock-in for a
    // paid transformation service, the bytes are made right at their source:
    // everything in public/ is pre-encoded to WebP by scripts/build-assets.mjs,
    // and event covers already arrive as 1000x1500 WebP because the backend
    // resizes them on upload (organizer.service.ts).
    //
    // What is genuinely lost is per-device widths — a phone gets the same file
    // as a laptop. The fix for that is a second, smaller variant written at
    // upload time, which belongs in the backend next to the resize that is
    // already there, not in a host-specific optimizer.
    unoptimized: true,
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
  async redirects() {
    return [
      {
        // The page used to live at /terms&conditions. A literal "&" in a path
        // cannot appear in a sitemap without entity-escaping, which Next's
        // sitemap serializer does not do — the raw character made the whole
        // sitemap invalid XML, and Google discards an invalid sitemap outright
        // rather than skipping the one bad entry. Permanent so the old URL
        // (linked from older pages, and possibly registered with the payment
        // gateway) keeps resolving and passes its ranking on.
        source: "/terms&conditions",
        destination: "/terms-and-conditions",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Two years, and covering subdomains — the platform default omitted
          // includeSubDomains, which left api. and campus-connect. open to a
          // first-visit downgrade. Verified beforehand that every subdomain
          // already redirects HTTP to HTTPS, so nothing is cut off.
          //
          // The `preload` token is deliberately absent: it only does anything
          // once the domain is submitted at hstspreload.org, and getting back
          // off that list takes months. That is a decision to make on purpose,
          // not a side effect of a header tweak.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Cuts this origin off from any window that opened it. Google sign-in
          // is a full-page redirect here, not a popup, so `same-origin` would
          // also be safe — allow-popups is chosen so that adding a popup-based
          // flow later fails visibly rather than silently breaking sign-in.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
