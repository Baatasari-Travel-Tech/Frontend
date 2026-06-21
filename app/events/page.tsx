"use client"

import { Suspense, useMemo } from "react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { EventGrid } from "@/components/events/event-grid"
import { EventsSearchHero } from "@/components/events/events-search-hero"
import { FooterSocialLinks } from "@/components/events/footer-social-edit"
import { toEventCardData, getEventPhase } from "@/lib/event-helpers"
import { eventMatchesCategoryGroup } from "@/lib/event-categories"
import { apiRequest } from "@/lib/api/client"
import type { EventSummary } from "@/types/api"
import type { EventData, EventStatus } from "@/lib/events-data"

const PHASE_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, recent: 2 }

// ──────────────────────────────────────────────────────────────────────────
// ⚠️ TEMP PREVIEW — DELETE THIS BLOCK. 20 mock cards to eyeball the grid.
// Also restore the <EventGrid events=...> prop below back to just `sortedCards`.
// ──────────────────────────────────────────────────────────────────────────
const TEMP_PREVIEW_CARDS: EventData[] = Array.from({ length: 20 }, (_, i) => {
  const images = ["/p2.png", "/plan.png", "/last.png", "/an2.png", "/as.png", "/av.png", "/event.jpeg", "/restar.jpeg", "/campus.png", "/e3.png"]
  const cats = ["Concert", "Comedy", "Workshop", "Food Fest", "Theatre", "Sports Meet", "Art Expo", "Tech Meetup"]
  const titles = ["Sunset Soundscapes", "Stand-Up Saturday", "Pottery Workshop", "Street Food Carnival", "Midnight Theatre", "City Marathon", "Modern Art Expo", "Indie Dev Meetup", "Acoustic Evenings", "Comedy Roast Night"]
  const statuses: EventStatus[] = ["live", "upcoming", "upcoming", "upcoming", "past"]
  const days = ["FRI", "SAT", "SUN"]
  const months = ["JAN", "FEB", "MAR", "APR"]
  const numericPrice = i % 5 === 0 ? 0 : ((i * 173) % 1800) + 150
  return {
    id: `preview-${i + 1}`,
    title: `${titles[i % titles.length]} ${i + 1}`,
    price: numericPrice ? `₹${numericPrice}` : "Free",
    numericPrice,
    category: cats[i % cats.length],
    image: images[i % images.length],
    date: `${(i % 27) + 1} ${months[i % months.length]} 2026`,
    location: "Visakhapatnam",
    time: `${(i % 8) + 4}:00 PM`,
    day: days[i % days.length],
    ageRange: i % 3 === 0 ? "18+" : "All ages",
    status: statuses[i % statuses.length],
  }
})

// Partial, case-insensitive search across the fields a person would type —
// no need to fill every field; any matching token is enough.
function matchesQuery(event: EventSummary, query: string): boolean {
  if (!query.trim()) return true
  const needle = query.trim().toLowerCase()
  return [event.title, event.venue, event.category, event.tagline].some(
    (value) => typeof value === "string" && value.toLowerCase().includes(needle),
  )
}

function matchesCategory(event: EventSummary, category: string): boolean {
  if (!category || category.toLowerCase() === "all") return true
  return eventMatchesCategoryGroup(event.category, category)
}

function matchesWhen(event: EventSummary, when: string): boolean {
  if (!when || when === "anytime") return true
  const date = new Date(event.date)
  if (Number.isNaN(date.getTime())) return false
  const now = new Date()
  if (when === "today") return date.toDateString() === now.toDateString()
  if (when === "month")
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  if (when === "weekend") {
    const day = date.getDay()
    const withinWeek = date.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 && date.getTime() >= now.setHours(0, 0, 0, 0)
    return (day === 0 || day === 6) && withinWeek
  }
  return true
}

function matchesBudget(event: EventSummary, budget: string): boolean {
  if (!budget || budget === "any") return true
  const price = event.startingPrice ?? 0
  if (budget === "free") return price === 0
  if (budget === "pocket") return price > 0 && price <= 500
  if (budget === "premium") return price > 500
  return true
}

// "Where" filter — matches the typed city/venue against the event's venue text.
function matchesLocation(event: EventSummary, where: string): boolean {
  if (!where.trim()) return true
  const needle = where.trim().toLowerCase()
  return typeof event.venue === "string" && event.venue.toLowerCase().includes(needle)
}

function EventsPageContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? ""
  const when = searchParams.get("when") ?? ""
  const budget = searchParams.get("budget") ?? ""
  const where = searchParams.get("where") ?? ""

  const eventsQuery = useQuery({
    queryKey: ["public-events"],
    queryFn: () =>
      apiRequest<{ data: { events: EventSummary[] } }>("/events").then((r) => r.data.events),
    staleTime: 60_000,
  })

  const data = eventsQuery.data

  const sortedCards = useMemo(() => {
    const filtered = (data ?? []).filter(
      (event) =>
        matchesQuery(event, query) &&
        matchesCategory(event, category) &&
        matchesWhen(event, when) &&
        matchesBudget(event, budget) &&
        matchesLocation(event, where),
    )

    // Live/ongoing first, then upcoming (soonest first), then recently
    // completed (most recent first); events older than 2 days are dropped.
    return filtered
      .map((event) => ({ event, ...getEventPhase(event) }))
      .filter((item) => item.phase !== "hidden")
      .sort((a, b) => {
        const order = (PHASE_ORDER[a.phase] ?? 9) - (PHASE_ORDER[b.phase] ?? 9)
        if (order !== 0) return order
        return a.phase === "recent" ? b.sort - a.sort : a.sort - b.sort
      })
      .map((item) => toEventCardData(item.event))
  }, [data, query, category, when, budget, where])

  return (
    <main className="min-h-screen bg-background">
      <div>
        {/* TEMP PREVIEW: error state disabled (was `eventsQuery.isError`) so the
            mock grid shows even when /events fails. Revert to `eventsQuery.isError`. */}
        {false ? (
          <section className="flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Unable to load events</h2>
            <p className="mt-3 text-gray-500">Please try again in a moment.</p>
          </section>
        ) : (
          <>
            <EventsSearchHero />
            {/* TEMP PREVIEW: real events + 20 mock cards. Revert to `sortedCards`. */}
            {TEMP_PREVIEW_CARDS.length > 0 ? (
              <EventGrid events={[...sortedCards, ...TEMP_PREVIEW_CARDS]} title="All Events" />
            ) : (
              <section className="flex flex-col items-center justify-center py-24 text-center">
                <h2 className="text-2xl font-semibold text-(--brand-blue)">No events available</h2>
                <p className="mt-3 text-gray-500">Check back later or pitch an event you want to attend.</p>
              </section>
            )}
          </>
        )}
      </div>

      <footer className="border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div className="md:col-span-1">
              <Image
                src="/FLogo.png"
                alt="Baatasari"
                width={132}
                height={48}
                className="h-10 w-auto"
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
                <a className="transition hover:text-white" href="/refund-policy">
                  Refund &amp; Cancellation
                </a>
                <a className="transition hover:text-white" href="/grievance">
                  Grievance Redressal
                </a>
              </div>
            </div>

            <FooterSocialLinks />
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

export default function EventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPageContent />
    </Suspense>
  )
}
