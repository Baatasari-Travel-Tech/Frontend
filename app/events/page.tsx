"use client"

import { useMemo } from "react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { EventGrid } from "@/components/events/event-grid"
import { EventsSearchHero } from "@/components/events/events-search-hero"
import { FooterSocialLinks } from "@/components/events/footer-social-edit"
import { toEventCardData, computeEventStatus } from "@/lib/event-helpers"
import { apiRequest } from "@/lib/api/client"
import { fetchPublicSiteConfig } from "@/lib/api/admin"
import type { EventSummary } from "@/types/api"

export default function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: ["public-events"],
    queryFn: () =>
      apiRequest<{ data: { events: EventSummary[] } }>("/events").then((r) => r.data.events),
    staleTime: 60_000,
  })

  const siteConfigQuery = useQuery({
    queryKey: ["public-site-config"],
    queryFn: () => fetchPublicSiteConfig(),
    staleTime: 5 * 60_000,
  })

  const data = eventsQuery.data

  const sortedCards = useMemo(() => {
    const cards = (data ?? []).map(toEventCardData)
    return cards.sort((a, b) => (b.bookedCount ?? 0) - (a.bookedCount ?? 0))
  }, [data])

  const liveCount = useMemo(
    () => (data ?? []).filter((e) => computeEventStatus(e) === "live").length,
    [data],
  )
  const liveGoingCount = useMemo(
    () =>
      (data ?? [])
        .filter((e) => computeEventStatus(e) === "live")
        .reduce((sum, e) => sum + (e.bookedCount ?? 0), 0),
    [data],
  )

  return (
    <main className="min-h-screen bg-background">
      <div>
        <EventsSearchHero liveCount={liveCount} liveGoingCount={liveGoingCount} />
        {sortedCards.length > 0 ? (
          <EventGrid events={sortedCards} title="All Events" />
        ) : (
          <section className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">No events available</h2>
            <p className="mt-3 text-gray-500">Check back later or pitch an event you want to attend.</p>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="md:col-span-1">
              <Image
                src="/FLogo.png"
                alt="Baatasari"
                width={100}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
              />
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

            {siteConfigQuery.data ? <FooterSocialLinks config={siteConfigQuery.data} /> : null}
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
