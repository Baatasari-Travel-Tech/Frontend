import { defineCloudflareConfig } from "@opennextjs/cloudflare"
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache"

/**
 * How this app runs on Cloudflare Workers.
 *
 * The incremental cache is not optional here. On Vercel, ISR is handled by the
 * platform; on Workers there is nowhere to keep a revalidated page unless one
 * is configured. Without it these all silently lose their caching and refetch
 * on every request:
 *
 *   app/sitemap.ts          revalidate = 3600   <- newly published events would
 *                                                  only appear on redeploy
 *   app/events/[id]         revalidate = 60
 *   app/checkout            revalidate = 30
 *   app/recruitment/[slug]  revalidate = 30
 *   lib/event-helpers       revalidate = 60
 *
 * R2 rather than KV: these are page and fetch payloads rather than small
 * key-value pairs, R2 has no per-value size ceiling to trip over, and its
 * storage is cheap relative to how rarely this is written.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
})
