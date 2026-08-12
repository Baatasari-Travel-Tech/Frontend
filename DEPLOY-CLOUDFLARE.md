# Deploying this branch to Cloudflare Workers

This branch (`cloudflare-migration`) runs the frontend on Cloudflare Workers via
the OpenNext adapter. `main` stays on Vercel and is unaffected.

## Read this first

`middleware.ts` runs on `runtime: "experimental-edge"`. That is not a
preference — it is the only combination Next 16 and the adapter will both
accept:

- Next 16 renamed `middleware.ts` to `proxy.ts` and made the proxy **Node-only**.
  It rejects runtime config: _"Route segment config is not allowed in Proxy
  file."_
- `@opennextjs/cloudflare` refuses Node middleware: _"Node.js middleware is not
  currently supported."_

The maintenance gate, the 503 response and every `X-Robots-Tag` ride on that
file. All of it was verified working under the edge runtime before this branch
was pushed (see the checklist below), but "experimental" is Next's own word and
the risk is real.

**When `@opennextjs/cloudflare` supports a Node proxy, this reverts:** rename
`middleware.ts` back to `proxy.ts`, rename the exported function back to
`proxy`, and delete the `runtime` line. Nothing else changes.

## One-time setup

```bash
pnpm install
pnpm exec wrangler login
pnpm exec wrangler r2 bucket create baatasari-frontend-cache
```

The R2 bucket backs the incremental cache (see `open-next.config.ts`). Without
it, ISR silently stops working — most visibly, `sitemap.xml` would only pick up
newly published events on a redeploy instead of hourly.

## Environment variables — the one that will bite

All four are `NEXT_PUBLIC_`, which means Next **inlines them into the bundle at
build time**. Setting them as Worker runtime bindings does nothing at all. They
have to be present in the *build* environment.

The failure is silent: the build succeeds, and the deployed app then calls
`undefined/api/v1/...`.

| Variable | Needed |
|---|---|
| `NEXT_PUBLIC_API_URL` | Yes — everything breaks without it |
| `NEXT_PUBLIC_AVATAR_BASE_URL` | Yes |
| `NEXT_PUBLIC_EVENT_COVER_BASE_URL` | Yes |
| `NEXT_PUBLIC_AUTH_DEBUG` | Optional, leave unset in production |

## Deploy

```bash
pnpm cf:build      # next build, then the adapter bundles it into .open-next/
pnpm cf:preview    # runs it locally in workerd — worth doing before deploying
pnpm cf:deploy
```

**On Windows**, `pnpm cf:build` fails with `EPERM: symlink` unless Developer Mode
is on (Settings → Privacy & security → For developers). Cloudflare's own build
runs on Linux and is unaffected, so this only matters for building locally.

## Verify before moving DNS

Deploy to the `workers.dev` subdomain first and leave Vercel serving. Every item
below works on Vercel today, so any of them failing here is a stop signal.

- [ ] Maintenance on → `/` returns **503** with `Retry-After`, and the holding page still renders
- [ ] Policy and contact pages return **200** while maintenance is on
- [ ] `X-Robots-Tag: noindex, nofollow` on `/login`, `/organizer/dashboard`, and the admin console
- [ ] **No** `X-Robots-Tag` on `/` or `/events`
- [ ] `/sitemap.xml` lists events, and refreshes without a redeploy (this is the R2 cache working)
- [ ] `/robots.txt` names the `www` host
- [ ] `/terms&conditions` still 308s to `/terms-and-conditions`
- [ ] HSTS, COOP and `X-Frame-Options` present on a normal page
- [ ] Homepage HTML is ~60 KB of server-rendered markup, not an empty shell
- [ ] An event page carries its `Event` JSON-LD
- [ ] OG images resolve and stay near 100 KB
- [ ] Google sign-in round-trips through `/auth/callback`

Then move DNS, and keep Vercel deployable for a week.

## Known differences from Vercel

**No per-device image widths.** `images.unoptimized` is set, because the host
optimizer needs `sharp` and that does not run on Workers. Every raster in
`public/` is pre-encoded to WebP by `scripts/build-assets.mjs`, and event covers
already arrive as 1000×1500 WebP from the backend — so the bytes are reasonable,
but a phone gets the same file as a laptop. The fix belongs in the backend,
beside the resize that already happens on upload.

**More origin requests from the maintenance gate.** It caches the site-config
answer for 15s in module scope. On Workers that cache is per-isolate, and
isolates are many and short-lived. If the chatter is noticeable, move it to the
Workers Cache API so it is shared.

**`@vercel/analytics` still ships.** It is inert off Vercel. Replace it or drop
it once you are settled.
