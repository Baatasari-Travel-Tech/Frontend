import { HandpickedEventCard } from "@/components/events/handpicked-card"
import { fetchPublicEvents, toEventCardData } from "@/lib/event-helpers"
import Link from "next/link"

export default async function AllEventsPage() {
  const { events, error } = await fetchPublicEvents()
  const cards = events
    .map(toEventCardData)
    .sort((a, b) => (b.bookedCount ?? 0) - (a.bookedCount ?? 0))

  return (
    <main className="min-h-screen bg-(--white)">
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Events
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-800/70">
            All Events
          </p>
          <h1 className="mt-2 font-bricolage text-4xl font-bold text-(--brand-blue) md:text-5xl">
            Every Event, One Place
          </h1>
          {!error && cards.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">{cards.length} event{cards.length !== 1 ? "s" : ""} available</p>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-2xl font-semibold text-(--brand-blue)">Unable to load events</h2>
            <p className="mt-3 text-gray-500">Please try again in a moment.</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-4 text-5xl">🎪</p>
            <h2 className="text-2xl font-semibold text-(--brand-blue)">No events available</h2>
            <p className="mt-3 text-gray-500">Check back later or pitch an event you want to attend.</p>
            <Link
              href="/events#suggest-event-form"
              className="mt-6 inline-flex rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition"
            >
              Suggest an Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <HandpickedEventCard key={card.id} {...card} gridMode />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
