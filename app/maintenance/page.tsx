import Image from "next/image"

export const metadata = {
  title: "Under Maintenance · Baatasari",
  description: "Baatasari is currently undergoing scheduled maintenance.",
}

// Static fallback page shown across the whole site while the admin has
// maintenance mode ON. The middleware rewrites every public route here, so
// this must stand entirely on its own (no nav, no data fetching).
export default function MaintenancePage() {
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
          Baatasari is taking a short break for some scheduled upgrades.
          We&apos;re working to bring everything back online as quickly as
          possible. Thanks for your patience.
        </p>

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
