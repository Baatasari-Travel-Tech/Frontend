import { NextResponse, type NextRequest } from "next/server"

// --- Maintenance gate -------------------------------------------------------
// When the admin turns maintenance mode ON (site-config), every public route is
// rewritten to /maintenance. Admin routes are excluded (see `matcher`) so the
// switch can always be toggled back OFF.

const TTL_MS = 15_000 // re-check the flag at most every 15s per edge instance
let cache: { value: boolean; at: number } | null = null

async function isMaintenanceOn(): Promise<boolean> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.value
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/site-config`, { cache: "no-store" })
    if (!res.ok) throw new Error(`site-config ${res.status}`)
    const json = (await res.json()) as { data?: { maintenanceMode?: boolean } }
    const value = Boolean(json?.data?.maintenanceMode)
    cache = { value, at: now }
    return value
  } catch {
    // Fail OPEN: never take the whole site down just because the config fetch
    // hiccupped. Reuse the last known value if we have one, else assume live.
    return cache?.value ?? false
  }
}

export async function middleware(req: NextRequest) {
  if (await isMaintenanceOn()) {
    const url = req.nextUrl.clone()
    url.pathname = "/maintenance"
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Run on every route EXCEPT: admin (so maintenance can be switched off),
  // the maintenance page itself, Next internals, and static assets.
  matcher: [
    "/((?!admin|maintenance|_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|woff|woff2|ttf)).*)",
  ],
}
