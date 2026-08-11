import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_CONSOLE_PREFIX, bypassesMaintenance, isPrivatePath } from "@/lib/seo"

// --- Maintenance gate -------------------------------------------------------
// When the admin turns maintenance mode ON (site-config), every public route is
// rewritten to /maintenance. The admin console is excluded so the switch can
// always be toggled back OFF.

const TTL_MS = 15_000 // re-check the flag at most every 15s per edge instance
let cache: { value: boolean; at: number } | null = null

async function isMaintenanceOn(): Promise<boolean> {
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.value
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/site-config`, { cache: "no-store" })
    if (!res.ok) throw new Error(`site-config ${res.status}`)
    const json = (await res.json()) as { data?: { maintenanceActive?: boolean } }
    const value = Boolean(json?.data?.maintenanceActive)
    cache = { value, at: now }
    return value
  } catch {
    // Fail OPEN: never take the whole site down just because the config fetch
    // hiccupped. Reuse the last known value if we have one, else assume live.
    return cache?.value ?? false
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // The admin console lives at an obscured path, NOT at /admin. The matcher's
  // old `(?!admin|…)` lookahead therefore never excluded it, so turning
  // maintenance on rewrote the console to /maintenance too and locked the
  // switch in the ON position. Checked here, against the real prefix.
  const isAdminConsole = pathname.startsWith(ADMIN_CONSOLE_PREFIX)

  // The policy/contact pages stay up (see MAINTENANCE_ALLOWED), as does the
  // maintenance page itself and the console that switches it back off.
  const exempt =
    isAdminConsole || pathname === "/maintenance" || bypassesMaintenance(pathname)

  const rewriteToMaintenance = !exempt && (await isMaintenanceOn())

  const res = rewriteToMaintenance
    ? NextResponse.rewrite(new URL("/maintenance", req.url))
    : NextResponse.next()

  // While maintenance is on, every public URL serves the holding page. Without
  // this the crawler would happily replace real listings in its index with
  // "we'll be back shortly" — the URL is public, only the body is temporary.
  if (rewriteToMaintenance) {
    res.headers.set("X-Robots-Tag", "noindex")
    return res
  }

  // The real exclusion for everything that must stay out of search. robots.txt
  // Disallow is only a crawl hint — a linked-to URL can be indexed without ever
  // being fetched, so the noindex has to travel with the response. This is also
  // the only mechanism available to the client-rendered pages (consoles,
  // checkout, invoices), which cannot export Next metadata at all.
  if (isAdminConsole || isPrivatePath(pathname)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow")
  }

  return res
}

export const config = {
  // Everything except Next internals and static assets. Route-level decisions
  // are made in the handler above, where they can be read.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml|woff|woff2|ttf)).*)",
  ],
}
