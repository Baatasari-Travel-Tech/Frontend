import { VARIANT_SOURCES, VARIANT_WIDTHS } from "./image-variants"

/**
 * Custom `next/image` loader.
 *
 * There is no host-side optimizer here — see the note in next.config.ts. What
 * we do have is a set of pre-encoded widths written by scripts/build-assets.mjs
 * and committed alongside their sources. This maps a width Next asks for onto
 * the nearest file that actually exists.
 *
 * Before this, `images.unoptimized` was set, which does more than skip the
 * optimizer: it stops Next emitting a `srcset` at all. Every `sizes` prop in
 * the codebase was therefore inert, and a phone downloaded the 1200px file to
 * paint it at ~460 CSS px — 533 KiB of waste on the homepage alone.
 *
 * Anything without variants (remote S3 event covers, the brand mark, the
 * art-directed heroes) is returned untouched, which is exactly the previous
 * behaviour for those.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  if (!VARIANT_SOURCES.has(src)) return src

  // Smallest emitted width that still covers the request, so we never upscale
  // in the browser. Past the largest, the largest is all there is.
  const chosen = VARIANT_WIDTHS.find((w) => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1]
  return src.replace(/\.webp$/, `-${chosen}.webp`)
}
