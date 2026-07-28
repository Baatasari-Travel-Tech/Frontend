import Image from "next/image"

export const metadata = {
  title: "Under Maintenance · Baatasari",
  description: "Baatasari is currently undergoing scheduled maintenance.",
}

type MaintenanceInfo = {
  message: string | null
  to: string | null
}

const DEFAULT_MESSAGE =
  "Baatasari is taking a short break for some scheduled upgrades. We're working to bring everything back online as quickly as possible. Thanks for your patience."

// Best-effort only — if this fails, the default copy below still renders
// correctly on its own. This page is excluded from the middleware's
// maintenance rewrite, so fetching here never recurses into itself.
async function getMaintenanceInfo(): Promise<MaintenanceInfo> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/site-config`, { cache: "no-store" })
    if (!res.ok) throw new Error(String(res.status))
    const json = (await res.json()) as {
      data?: { maintenanceMessage?: string | null; maintenanceTo?: string | null }
    }
    return {
      message: json?.data?.maintenanceMessage ?? null,
      to: json?.data?.maintenanceTo ?? null,
    }
  } catch {
    return { message: null, to: null }
  }
}

// Static fallback page shown across the whole site while the admin has
// maintenance mode ON. The middleware rewrites every public route here, so
// this must stand entirely on its own even if the data fetch below fails.
export default async function MaintenancePage() {
  const { message, to } = await getMaintenanceInfo()
  const backAt = to ? new Date(to) : null
  const backAtValid = backAt && !Number.isNaN(backAt.getTime()) && backAt.getTime() > Date.now()

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c1D37] px-6 text-center text-white">
      {/* soft glow accents */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#2b4570] opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#2b4570] opacity-30 blur-3xl" />

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <Image
          src="/logo.png"
          alt="Baatasari"
          width={72}
          height={72}
          className="mb-8 h-16 w-16 rounded-2xl bg-white/95 p-2 shadow-lg"
          priority
        />

        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-white/80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          We&apos;ll be right back
        </span>

        <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
          Under Maintenance
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          {message?.trim() ? message : DEFAULT_MESSAGE}
        </p>

        {backAtValid ? (
          <p className="mt-2 text-sm text-white/50">
            Expected back{" "}
            {backAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        ) : null}

        <a
          href="mailto:contact-us@baatasari.com"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0c1D37] transition hover:bg-white/90"
        >
          Need help? Contact us
        </a>

        <p className="mt-10 text-xs text-white/40">
          © Baatasari · Discover, Connect, Experience
        </p>
      </div>
    </main>
  )
}
