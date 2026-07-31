import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"])

/**
 * Lists top-level image files in /public — used by the testing canvas
 * builder's image picker so it doesn't need a hardcoded, stale list.
 * These are already publicly servable as static files; this just enumerates
 * filenames, nothing sensitive.
 */
export async function GET() {
  const publicDir = path.join(process.cwd(), "public")
  let entries: string[] = []
  try {
    entries = fs
      .readdirSync(publicDir, { withFileTypes: true })
      .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b))
  } catch {
    entries = []
  }
  return NextResponse.json({ images: entries.map((name) => `/${name}`) })
}
