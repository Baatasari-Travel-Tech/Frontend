"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard, StatGrid } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"

type AnalyticsResponse = {
  totalEvents: number
  totalCapacity: number
  nextEventDate: string | null
  paidOrders: number
  grossRevenue: number
}

export default function OrganizerDashboardPage() {
  const analyticsQuery = useQuery({
    queryKey: ["organizer-analytics", "dashboard"],
    queryFn: async () => {
      const response = await apiRequest<{ data: AnalyticsResponse }>("/organizer/analytics", { auth: true })
      return response.data
    },
  })

  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer dashboard"
        title="Run your events from one place"
        description="Track event volume, ticketed orders, and revenue signals directly from the organizer API."
      >
        {analyticsQuery.isLoading ? (
          <SkeletonGrid />
        ) : analyticsQuery.isError || !analyticsQuery.data ? (
          <StateBlock tone="error" title="Organizer analytics unavailable" description="We couldn’t load organizer analytics right now." />
        ) : (
          <>
            <StatGrid
              items={[
                { label: "Total events", value: String(analyticsQuery.data.totalEvents), hint: "Published through organizer APIs." },
                { label: "Capacity", value: String(analyticsQuery.data.totalCapacity), hint: "Combined event capacity." },
                { label: "Paid orders", value: String(analyticsQuery.data.paidOrders), hint: "Verified orders only." },
                { label: "Revenue", value: formatCurrency(analyticsQuery.data.grossRevenue), hint: "Gross ticket revenue." },
              ]}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Next event">
                <div className="grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-4xl border border-slate-200 bg-white px-4 py-4">
                    {analyticsQuery.data.nextEventDate
                      ? `Your next event is scheduled for ${formatDate(analyticsQuery.data.nextEventDate)}.`
                      : "No upcoming event date is currently scheduled."}
                  </div>
                  <Link href="/organizer/create-event" className="inline-flex w-fit rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white">
                    Create event
                  </Link>
                </div>
              </SectionCard>

              <SectionCard title="Organizer workflow">
                <div className="grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-4xl border border-slate-200 bg-white px-4 py-4">
                    Event creation writes searchable core fields and normalized ticket tiers directly to the backend.
                  </div>
                  <div className="rounded-4xl border border-slate-200 bg-white px-4 py-4">
                    Public buyers discover your events through `/events` and complete verified Razorpay checkout from `/events/[id]`.
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </PageShell>
    </ProtectedRoute>
  )
}
