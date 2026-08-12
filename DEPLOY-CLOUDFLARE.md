# Deploying the frontend to Cloudflare

You are moving this site off Vercel and onto Cloudflare Workers. Cloudflare will
build it from GitHub the same way Vercel does — you push, it builds, it deploys.

`main` stays on Vercel and keeps working throughout. Nothing here touches it.
Only the `cloudflare-migration` branch is involved, and Vercel stays live until
you deliberately move the domain in step 7.

Read time about five minutes. Doing it, maybe half an hour, most of which is
waiting for builds.

---

## Glossary — the three words this doc keeps using

**Worker** — Cloudflare's equivalent of a Vercel serverless function. Your whole
Next.js app runs inside one.

**R2** — Cloudflare's file storage. Their version of S3. You need one bucket,
explained in step 1.

**wrangler** — Cloudflare's command-line tool, their equivalent of the `vercel`
CLI. **You do not need it for this guide.** Everything below is done in the
Cloudflare website. It is only mentioned in the optional section at the end.

---

## Before you start

- A Cloudflare account — you already have one, your DNS is there.
- The GitHub repo `Baatasari-Travel-Tech/Frontend`, branch `cloudflare-migration`
  (already pushed).
- The values of your four `NEXT_PUBLIC_*` environment variables. Copy them out
  of your Vercel project settings now, before you start — you will need them in
  step 4 and it is annoying to go hunting mid-flow.

---

## Step 1 — Create the storage bucket

**In the Cloudflare dashboard:** find **R2** in the left sidebar → **Create
bucket** → name it exactly:

```
baatasari-frontend-cache
```

Leave every other setting alone. Create it.

> Cloudflare may ask you to enable R2 on your account first, which can mean
> adding a card even though what you are about to store is a few megabytes and
> sits inside the free tier.

**Why this exists.** Your `sitemap.xml` is set to regenerate every hour, and
your event pages cache for 60 seconds. Vercel does that invisibly. Cloudflare
needs somewhere to *put* the regenerated page, and this bucket is that place.

**If you skip it:** the build still succeeds and the site still works, so nothing
looks wrong — but the sitemap freezes at whatever it was the moment you
deployed, and newly published events never reach Google. That is the exact
problem this week was spent fixing, so do not skip it.

The name matters. It is written into `wrangler.jsonc`, so a different name will
not connect.

**✅ Done when:** the bucket appears in your R2 list.

---

## Step 2 — Connect the repository

**In the dashboard:** go to **Workers & Pages** (newer accounts may label this
**Compute**) → **Create** → choose the option to **import / connect a Git
repository** (*not* "Pages" — see the note at the bottom of this file).

- Authorise GitHub if it asks.
- Pick repository **`Baatasari-Travel-Tech/Frontend`**.
- Set the production branch to **`cloudflare-migration`**.

Do **not** deploy yet if it offers to. Set the build settings in step 3 first.

**✅ Done when:** Cloudflare shows the repo connected, with
`cloudflare-migration` as the branch.

---

## Step 3 — Build settings

| Field | Value |
|---|---|
| Build command | `pnpm cf:build` |
| Deploy command | `pnpm cf:deploy` |
| Root directory | leave empty |

That is all. `pnpm cf:build` runs the normal Next build and then bundles the
output into a Worker; `pnpm cf:deploy` ships it.

---

## Step 4 — Environment variables (the step that silently breaks things)

Add these as **build** variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | your API origin, e.g. `https://api.baatasari.com` |
| `NEXT_PUBLIC_AVATAR_BASE_URL` | copy from Vercel |
| `NEXT_PUBLIC_EVENT_COVER_BASE_URL` | copy from Vercel |

Leave `NEXT_PUBLIC_AUTH_DEBUG` unset.

**Read this bit.** Anything named `NEXT_PUBLIC_` is baked into the JavaScript
**when the site is built**, not read when it runs. So they must be set as
*build* variables. If Cloudflare offers you a choice between build variables and
runtime secrets or bindings, these are **build**.

Get this wrong and there is no error anywhere. The build passes, the site
deploys, the pages render — and then every API call goes to
`undefined/api/v1/...` and nothing loads. If you see that, this step is why.

---

## Step 5 — Deploy

Trigger the first deployment and watch the build log.

**✅ Done when:** the build finishes and you get a URL ending in `.workers.dev`.

**If the build fails**, jump to Troubleshooting at the bottom — the three
likely failures are all listed there with what they mean.

---

## Step 6 — Verify, before touching DNS

Open the `.workers.dev` URL. Vercel is still serving your real domain, so
nothing is at risk yet — this is the whole point of doing it in this order.

Every item below works on Vercel today. Any of them failing here is a real
signal, not a quirk.

**Pages load**

- [ ] Homepage loads and looks right
- [ ] `/events` lists events
- [ ] An event page opens, with its image
- [ ] Google sign-in completes and lands you back signed in

**Maintenance mode** — flip it on from the admin app, check, flip it back

- [ ] Homepage shows the holding page
- [ ] `/contact-us` and the policy pages still load normally
- [ ] Login and Get started are gone from the header while it is on

**The SEO work** — easiest in the browser devtools Network tab, clicking the
first request and reading the response headers

- [ ] `/robots.txt` loads and mentions `www.baatasari.com`
- [ ] `/sitemap.xml` loads and lists your events
- [ ] `/login` sends a header `X-Robots-Tag: noindex, nofollow`
- [ ] The homepage sends **no** `X-Robots-Tag`
- [ ] Any page sends `Strict-Transport-Security`
- [ ] Visiting `/terms&conditions` lands you on `/terms-and-conditions`

**The one worth waiting for**

- [ ] Publish a test event, wait an hour, confirm it appears in `/sitemap.xml`
      without redeploying. This is the only way to know step 1 actually worked.

---

## Step 7 — Point the domain

Only when step 6 is clean.

In your Worker's settings, add the custom domain `www.baatasari.com`. Cloudflare
already runs your DNS, so it wires the record itself.

Do **not** do this during a maintenance window, and give it a day or two after
any Search Console recovery.

---

## Step 8 — Leave Vercel alone for a week

Do not delete the Vercel project. If something surfaces that step 6 missed,
moving the domain back is minutes rather than a rebuild. Delete it once a week
has passed quietly.

---

## Troubleshooting

**`EPERM: symlink`** — you are running `pnpm cf:build` on Windows. Turn on
Developer Mode (Settings → Privacy & security → For developers), or just let
Cloudflare build it, which is what this guide does. Cloudflare builds on Linux
and never hits this.

**`Node.js middleware is not currently supported`** — the `runtime` line in
`middleware.ts` was removed or changed. See the note below.

**Site loads but nothing fetches; console shows `undefined/api/v1/...`** —
step 4. The variables are missing, or were added as runtime values instead of
build values.

**Sitemap never updates** — step 1. Either the bucket does not exist, or its
name does not match `wrangler.jsonc`.

**`command not found: wrangler` locally** — run `pnpm install`. This branch has
dependencies `main` does not, so switching between the two needs a reinstall
each time.

---

## The one thing to keep an eye on

`middleware.ts` runs on `runtime: "experimental-edge"`. That word is Next's own,
and it is not decoration — your maintenance gate, the 503 response and every
`X-Robots-Tag` header ride on it.

It is set that way because it is the only combination the two tools will both
accept today. Next 16 renamed `middleware.ts` to `proxy.ts` and made the proxy
Node-only, refusing any runtime setting. The Cloudflare adapter refuses Node
middleware. This is the gap between those two positions.

**When `@opennextjs/cloudflare` supports a Node proxy, undo it:** rename
`middleware.ts` back to `proxy.ts`, rename the exported `middleware` function
back to `proxy`, delete the `runtime` line. Nothing else changes. Worth checking
their changelog every couple of months.

---

## Known differences from Vercel

**Images are one size for everyone.** Vercel's optimizer resized images per
device; it needs `sharp`, which cannot run on Workers. Instead every image in
`public/` is pre-compressed to WebP by `scripts/build-assets.mjs`, and event
covers already arrive as 1000×1500 WebP from your backend. Total page weight is
about the same — but a phone now downloads the same file as a laptop. The proper
fix is a second, smaller cover variant written at upload time, in the backend,
right beside the resize that already happens there.

**The maintenance check talks to your API more.** It caches the answer for 15
seconds in memory, but Cloudflare runs many short-lived copies of your Worker, so
that cache is not shared the way it was. Harmless unless you notice the traffic.

**`@vercel/analytics` still ships and does nothing.** Replace or remove it once
you are settled.

---

## Optional: deploying from your own machine

Not needed if you followed the steps above. If you ever want it:

```bash
pnpm install                    # this branch has extra dependencies
pnpm exec wrangler login        # opens a browser, links the CLI to your account
pnpm cf:build                   # needs Windows Developer Mode on
pnpm cf:preview                 # runs the Worker locally before deploying
pnpm cf:deploy
```

`pnpm exec` just means "run the copy in `node_modules`" rather than installing
the tool globally.

---

## Why Workers and not Pages

Cloudflare Pages was the obvious destination, but `@cloudflare/next-on-pages` is
marked deprecated on npm and its own deprecation message points at the OpenNext
adapter — which targets Workers. So "moving to Cloudflare Pages" is really
"moving to Cloudflare Workers". Same company, different product, and the docs you
want are the Workers ones.
