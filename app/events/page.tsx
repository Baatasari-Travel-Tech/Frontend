import Image from "next/image"
import SuggestionsForm from "@/components/suggestions-form"
import { EventList } from "@/components/events/event-list"
import { SuggestedEventsSection } from "@/components/events/suggested-events-section"
import { FooterSocialLinks } from "@/components/events/footer-social-edit"
import { toEventCardData, fetchPublicEvents } from "@/lib/event-helpers"
import { fetchPublicSiteConfig } from "@/lib/api/admin"

export default async function EventsPage() {
  const { events, error } = await fetchPublicEvents()
  const siteConfig = await fetchPublicSiteConfig()
  const sortedEvents = events
    .map(toEventCardData)
    .sort((a, b) => (b.bookedCount ?? 0) - (a.bookedCount ?? 0))
  const rows = sortedEvents.length > 0 ? [{ title: "Events", events: sortedEvents }] : []
  const hasAnyEvents = rows.length > 0

  return (
    <main className="min-h-screen bg-(--white)">
      <div className="pt-16">
        {error ? (
          <section className="flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Unable to load events</h2>
            <p className="mt-3 text-gray-500">Please try again in a moment.</p>
          </section>
        ) : (
          <>
            {hasAnyEvents ? (
              <EventList rows={rows} showHero />
            ) : (
              <section className="flex flex-col items-center justify-center py-24 text-center">
                <p className="mb-4 text-5xl">🎪</p>
                <h2 className="text-2xl font-semibold text-(--brand-blue)">No events available</h2>
                <p className="mt-3 text-gray-500">Check back later or pitch an event you want to attend.</p>
              </section>
            )}
            <SuggestionsForm />
            <SuggestedEventsSection />
          </>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="page-x w-full py-10">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="md:col-span-1">
              <Image src="/FLogo.png" alt="Baatasari" width={100} height={40} unoptimized />
            </div>

            <div className="hidden md:block" />
            <div className="hidden md:block" />
            <div className="hidden md:block" />

            <div className="max-w-sm text-sm text-slate-300">
              Discover, connect, experience. Official platform for curated events, venues, and experiences.
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
              <div className="grid gap-2 text-slate-300">
                <a className="transition hover:text-white" href="/about">
                  About
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
              <div className="grid gap-2 text-slate-300">
                <a className="transition hover:text-white" href="/contact-us">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
              <div className="grid gap-2 text-slate-300">
                <a className="transition hover:text-white" href="/terms&conditions">
                  Terms &amp; Conditions
                </a>
                <a className="transition hover:text-white" href="/privacy-policy">
                  Privacy Policy
                </a>
              </div>
            </div>

            <FooterSocialLinks config={siteConfig} />
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-700 pt-4 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
            <p>Copyright {new Date().getFullYear()} Baatasari. All rights reserved.</p>
            <p>Built for personalized experiences.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
