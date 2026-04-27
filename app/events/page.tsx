"use client"

import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"
import SuggestionsForm from "@/components/suggestions-form"
import { EventList } from "@/components/events/event-list"
import { EventsHero } from "@/components/events/hero"
import { SuggestedEventsSection } from "@/components/events/suggested-events-section"
import { apiRequest } from "@/lib/api/client"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency } from "@/lib/format"
import type { EventData } from "@/lib/events-data"
import type { EventSummary } from "@/types/api"

type EventRow = {
  title: string
  events: EventData[]
}

const ROW_TITLES = [
  "Handpicked For You",
  "Next Up: Events You'll Love",
  "Based on Your Interests",
  "Solo Performers",
  "For Solopreneurs",
]

function formatCardDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(date))
    .toUpperCase()
}

function toEventCardData(event: EventSummary): EventData {
  const lowestPrice = event.startingPrice ?? 0
  const readablePrice = formatCurrency(lowestPrice).replace("₹", "Rs ")
  const routeId = event.slug ?? event.id

  return {
    id: routeId,
    title: event.title,
    price: readablePrice,
    numericPrice: lowestPrice,
    category: event.category ?? "Live Event",
    image: getEventCoverImageUrl(event.id, event.updatedAt),
    date: formatCardDate(event.date),
    location: event.venue,
    bookedCount: event.bookedCount ?? 0,
    tag: event.tagline ?? "Live Experience",
    chiefGuest: event.artists?.[0]?.name ?? "Special Guests",
    sponsors: "Baatasari",
    eventTime: "All ages welcome",
    highlights: [
      event.tagline ?? "Curated event experience",
      event.venue,
      event.category ?? "Live Event",
    ],
  }
}

function buildRows(events: EventData[]): EventRow[] {
  if (events.length === 0) return []

  const chunkSize = 6
  const rowCount = Math.min(ROW_TITLES.length, Math.ceil(events.length / chunkSize))
  const rows: EventRow[] = []

  for (let index = 0; index < rowCount; index += 1) {
    const start = index * chunkSize
    const slice = events.slice(start, start + chunkSize)
    rows.push({
      title: ROW_TITLES[index] ?? ROW_TITLES[0],
      events: slice,
    })
  }

  return rows
}

export default function EventsPage() {
  const eventsQuery = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { events: EventSummary[] } }>("/events")
      return response.data.events
    },
  })

  const mappedEvents = (eventsQuery.data ?? []).map(toEventCardData)
  const rows = buildRows(mappedEvents)
  const hasAnyEvents = rows.length > 0

  return (
    <main className="min-h-screen bg-(--white)">
      <div className="pt-16">
        {eventsQuery.isLoading ? (
          <section className="flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Loading events...</h2>
          </section>
        ) : eventsQuery.isError ? (
          <section className="flex flex-col items-center justify-center py-32 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Unable to load events</h2>
            <p className="mt-3 text-gray-500">Please try again in a moment.</p>
          </section>
        ) : (
          <>
            <EventsHero />
            {hasAnyEvents ? (
              <EventList rows={rows} />
            ) : (
              <section className="flex flex-col items-center justify-center py-24 text-center">
                <p className="mb-4 text-5xl">No events</p>
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
                <a className="transition hover:text-white" href="/contact">
                  Contact
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
              <div className="grid gap-2 text-slate-300">
                <a className="transition hover:text-white" href="/terms&conditions">
                  Terms & Conditions
                </a>
                <a className="transition hover:text-white" href="/privacy-policy">
                  Privacy Policy
                </a>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800" href="#">
                <FaInstagram className="h-5 w-5" />
              </a>
              <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800" href="#">
                <FaLinkedin className="h-5 w-5" />
              </a>
              <a className="rounded-full border border-slate-600 p-2.5 hover:bg-slate-800" href="#">
                <FaTwitter className="h-5 w-5" />
              </a>
            </div>
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
