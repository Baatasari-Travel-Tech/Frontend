// Derives two kinds of asset that Next's image optimizer cannot help with,
// and writes them into public/ alongside their sources.
//
//   1. Social share cards. openGraph.images URLs are fetched RAW by Facebook,
//      WhatsApp and X — they never pass through /_next/image. Pointing them at
//      the 1.9 MB source PNG meant WhatsApp frequently rendered no preview at
//      all, since it drops images it considers too heavy.
//   2. Hero backgrounds for the <picture> element in components/about/hero.tsx.
//      Art direction needs real <source media> entries, and a <source> cannot
//      point at the optimizer, so these two are pre-encoded.
//
// Run with `pnpm assets`. Outputs are committed — this is a one-off derivation,
// not a build step, so a deploy never depends on sharp being installable.

import sharp from "sharp"
import { stat } from "node:fs/promises"
import path from "node:path"

const PUBLIC = path.resolve(import.meta.dirname, "..", "public")

// 1200x630 is the size every platform crops to. Producing it here rather than
// letting them crop a 3:2 source means we choose what survives the crop.
const OG = [
  { from: "hero-bg.png", to: "og-home.jpg" },
  { from: "events-hero.png", to: "og-events.jpg" },
]

const HEROES = [
  { from: "hero-bg.png", to: "hero-bg.webp", width: 1920 },
  { from: "hero-bg-mobile.png", to: "hero-bg-mobile.webp", width: 900 },
]

// The brand mark is an 870x870 source. A favicon is drawn at 16-32px and an
// Apple touch icon at 180 — pointing either straight at the source would ship
// a six-figure byte count to render a few dozen pixels, and neither is served
// through the image optimizer.
const ICONS = [
  { from: "nlogo.png", to: "icon-32.png", size: 32 },
  { from: "nlogo.png", to: "apple-touch-icon.png", size: 180 },
]

const kib = async (file) => Math.round((await stat(path.join(PUBLIC, file))).size / 1024)

const run = async () => {
  for (const { from, to } of OG) {
    await sharp(path.join(PUBLIC, from))
      .resize(1200, 630, { fit: "cover", position: "attention" })
      // JPEG, not WebP: a handful of crawlers still fall back to "no preview"
      // on WebP, and a share card is exactly where compatibility beats bytes.
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(PUBLIC, to))
    console.log(`og    ${from} (${await kib(from)} KiB) -> ${to} (${await kib(to)} KiB)`)
  }

  for (const { from, to, width } of HEROES) {
    await sharp(path.join(PUBLIC, from))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(PUBLIC, to))
    console.log(`hero  ${from} (${await kib(from)} KiB) -> ${to} (${await kib(to)} KiB)`)
  }

  for (const { from, to, size } of ICONS) {
    await sharp(path.join(PUBLIC, from))
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(PUBLIC, to))
    console.log(`icon  ${from} (${await kib(from)} KiB) -> ${to} (${await kib(to)} KiB)`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
