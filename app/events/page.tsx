"use client"

import { Suspense, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { EventGrid, EventGridSkeleton } from "@/components/events/event-grid"
import { EventsSearchHero } from "@/components/events/events-search-hero"
import { FooterSocialLinks } from "@/components/events/footer-social-edit"
import { toEventCardData, getEventPhase } from "@/lib/event-helpers"
import { eventMatchesCategoryGroup } from "@/lib/event-categories"
import { apiRequest } from "@/lib/api/client"
import type { EventSummary } from "@/types/api"

const PHASE_ORDER: Record<string, number> = { ongoing: 0, upcoming: 1, recent: 2 }

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

const STATUS_FILTERS = [
  { key: "live", label: "Live" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Completed" },
] as const

type StatusFilterKey = (typeof STATUS_FILTERS)[number]["key"]

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
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("live")

  const sortedCards = useMemo(() => {
    const filtered = (data ?? []).filter(
      (event) =>
        matchesQuery(event, query) &&
        matchesCategory(event, category) &&
        matchesWhen(event, when) &&
        matchesBudget(event, budget) &&
        matchesLocation(event, where),
    )

    // Live/ongoing first, then upcoming (soonest first), then completed
    // (most recent first). We keep ALL completed events — old ones included —
    // so the Completed filter shows the full history, not just the last 2 days.
    return filtered
      .map((event) => ({ event, ...getEventPhase(event) }))
      .sort((a, b) => {
        const order = (PHASE_ORDER[a.phase] ?? 9) - (PHASE_ORDER[b.phase] ?? 9)
        if (order !== 0) return order
        const isPast = a.phase === "recent" || a.phase === "hidden"
        return isPast ? b.sort - a.sort : a.sort - b.sort
      })
      .map((item) => toEventCardData(item.event))
  }, [data, query, category, when, budget, where])

  const visibleCards = sortedCards.filter((c) => c.status === statusFilter)
  const gridTitle = `${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label ?? "Live"} Events`

  return (
    <main className="min-h-screen bg-background">
      <div>
        {eventsQuery.isError ? (
          <section className="flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Unable to load events</h2>
            <p className="mt-3 text-gray-500">Please try again in a moment.</p>
          </section>
        ) : (
          <>
            <EventsSearchHero />

            {/* Header row: title + count (left), status filters (right) */}
            <section className="mx-auto w-full max-w-[1680px] px-4 pt-10 md:px-6 md:pt-12 lg:px-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-bricolage text-3xl font-bold text-(--brand-blue) md:text-4xl">
                    {gridTitle}
                  </h2>
                  <p className="mt-1 text-sm text-(--gray-500)">
                    {eventsQuery.isPending
                      ? "Loading events…"
                      : `${visibleCards.length} event${visibleCards.length === 1 ? "" : "s"} to explore`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((f) => {
                    const active = statusFilter === f.key
                    return (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`rounded-full border px-5 py-2 font-poppins text-sm font-semibold transition ${
                          active
                            ? "border-(--brand-navy) bg-(--brand-navy) text-white shadow-md"
                            : "border-(--gray-200) bg-white text-(--gray-700) hover:border-(--brand-blue) hover:text-(--brand-blue)"
                        }`}
                      >
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {eventsQuery.isPending ? (
              <EventGridSkeleton />
            ) : visibleCards.length > 0 ? (
              <EventGrid events={visibleCards} title={gridTitle} hideHeader />
            ) : (
              <section className="flex flex-col items-center justify-center py-24 text-center">
                <h2 className="text-2xl font-semibold text-(--brand-blue)">No events here yet</h2>
                <p className="mt-3 text-gray-500">Try a different filter or check back later.</p>
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
                <a className="transition hover:text-white" href="/contact-us">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</p>
              <div className="grid gap-2 text-slate-300">
                <Link className="transition hover:text-white" href="/events">
                  Events
                </Link>
                <Link className="transition hover:text-white" href="/talent">
                  Talents
                </Link>
                <Link className="transition hover:text-white" href="/for-organizers">
                  Organizers
                </Link>
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
