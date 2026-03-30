"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard, StatGrid } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventDetail } from "@/types/api"

export default function OrganizerManageEventsPage() {
  const query = useQuery({
    queryKey: ["organizer-events"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { events: EventDetail[] } }>("/organizer/events", { auth: true })
      return response.data.events
    },
  })

  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer events"
        title="Manage published events"
        description="Review the events attached to your organizer account and jump straight into editing or public preview."
        actions={
          <Link href="/organizer/create-event" className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white">
            Create another event
          </Link>
        }
      >
        {query.isLoading ? (
          <SkeletonGrid />
        ) : query.isError ? (
          <StateBlock tone="error" title="Couldn’t load organizer events" description="The organizer event list request failed." />
        ) : (
          <>
            <StatGrid
              items={[
                { label: "Events", value: String(query.data?.length ?? 0), hint: "Published under your organizer account." },
                {
                  label: "Upcoming",
                  value: String((query.data ?? []).filter((event) => new Date(event.date) > new Date()).length),
                  hint: "Events with future dates.",
                },
                {
                  label: "Starting price",
                  value:
                    query.data && query.data.length > 0
                      ? formatCurrency(Math.min(...query.data.map((event) => event.startingPrice ?? 0)))
                      : formatCurrency(0),
                  hint: "Lowest ticket entry point across your events.",
                },
                { label: "Edit route", value: "/organizer/events/[id]", hint: "Alias route is available for per-event editing." },
              ]}
            />

            {query.data && query.data.length > 0 ? (
              <div className="grid gap-4">
                {query.data.map((event) => (
                  <SectionCard key={event.id}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{event.category ?? "Event"}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{event.title}</h2>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                          <span>{formatDate(event.date)}</span>
                          <span>{event.venue}</span>
                          <span>{formatCurrency(event.startingPrice ?? 0)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/events/${event.slug ?? event.id}`} className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          View public page
                        </Link>
                        <Link href={`/organizer/events/${event.id}`} className="rounded-full bg-brand-900 px-4 py-3 text-sm font-semibold text-white">
                          Edit event
                        </Link>
                      </div>
                    </div>
                  </SectionCard>
                ))}
              </div>
            ) : (
              <StateBlock
                title="No organizer events yet"
                description="Create your first event to activate the public listing and ticketing flow."
              />
            )}
          </>
        )}
      </PageShell>
    </ProtectedRoute>
  )
}
