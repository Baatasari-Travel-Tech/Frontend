"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, MapPin, Search } from "lucide-react"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventSummary } from "@/types/api"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"

export default function EventsPage() {
  const [query, setQuery] = useState("")
  const eventsQuery = useQuery({
    queryKey: ["public-events"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { events: EventSummary[] } }>("/events")
      return response.data.events
    },
  })

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return eventsQuery.data ?? []

    return (eventsQuery.data ?? []).filter((event) =>
      [event.title, event.venue, event.category, event.tagline].some((value) =>
        (value ?? "").toLowerCase().includes(term)
      )
    )
  }, [eventsQuery.data, query])

  return (
    <PageShell
      eyebrow="Public events"
      title="Browse what’s live on Baatasari"
      description="Discover published events, compare ticket tiers, and move straight into checkout from the detail page."
    >
      <SectionCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-slate-950">Find an experience that fits the moment</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Public listings stay open to guests, while checkout can continue into authentication and onboarding when
              needed.
            </p>
          </div>

          <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm lg:min-w-80">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, city, or category"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>
      </SectionCard>

      {eventsQuery.isLoading ? (
        <SkeletonGrid />
      ) : eventsQuery.isError ? (
        <StateBlock
          tone="error"
          title="We couldn’t load the event feed"
          description="The backend is reachable but the event listing request failed. Please retry in a moment."
        />
      ) : filtered.length === 0 ? (
        <StateBlock
          title="No events matched your search"
          description="Try a different keyword or come back when more organizers publish events."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.slug ?? event.id}`}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_15px_45px_rgba(12,29,55,0.05)] transition hover:-translate-y-1 hover:shadow-[0_25px_55px_rgba(12,29,55,0.1)]"
            >
              <div className="flex min-h-56 flex-col justify-between bg-[linear-gradient(135deg,_rgba(12,29,55,0.94),_rgba(43,69,112,0.88))] p-6 text-white">
                <div>
                  <p className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/75">
                    {event.category ?? "Featured"}
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold">{event.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/75">{event.description}</p>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm text-white/75">
                  <span>{formatCurrency(event.startingPrice ?? 0)}</span>
                  <span>{event.capacity} seats</span>
                </div>
              </div>
              <div className="grid gap-4 p-6">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4 text-brand-900" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-brand-900" />
                  <span>{event.venue}</span>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {event.tagline ?? "Open for public discovery and ticket purchases."}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}
