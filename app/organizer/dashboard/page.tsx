"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { StatsGrid } from "@/components/event-org/stats-grid"
import { UpcomingEventHighlights } from "@/components/event-org/upcoming-event-highlights"
import { AnalyticsChart } from "@/components/event-org/analytics-chart"
import { toUpcomingManageEvents } from "@/components/event-org/manage-events/manage-events"
import { apiRequest } from "@/lib/api/client"
import type { EventDetail, OrganizerAnalytics } from "@/types/api"

type DashboardQueryData = {
  analytics: OrganizerAnalytics
  events: EventDetail[]
}

export default function Home() {
  const { profile } = useAuth()

  const dashboardQuery = useQuery<DashboardQueryData, Error>({
    queryKey: ["organizer-dashboard"],
    queryFn: async () => {
      const [analyticsResponse, eventsResponse] = await Promise.all([
        apiRequest<{ data: { analytics: OrganizerAnalytics } }>("/organizer/analytics", {
          auth: true,
        }),
        apiRequest<{ data: { events: EventDetail[] } }>("/organizer/events", {
          auth: true,
        }),
      ])

      return {
        analytics: analyticsResponse.data.analytics,
        events: eventsResponse.data.events,
      }
    },
  })

  const greetingName = profile?.full_name?.trim().split(/\s+/)[0] || "Organizer"

  const upcomingEvent = useMemo(() => {
    const upcoming = toUpcomingManageEvents(dashboardQuery.data?.events ?? [])
    return upcoming[0] ?? null
  }, [dashboardQuery.data?.events])

  const errorMessage = dashboardQuery.isError
    ? dashboardQuery.error?.message || "Unable to load dashboard data right now."
    : null

  return (
    <ProtectedRoute requireOrganizer>
      <div className="w-full flex flex-col gap-6">
        <div className="w-full flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-upcoming-primary-700">Hello {greetingName}!</h1>
          <p className="text-black">Track, update, and grow your events the smart way.</p>
        </div>

        <StatsGrid
          analytics={dashboardQuery.data?.analytics ?? null}
          events={dashboardQuery.data?.events ?? []}
          isLoading={dashboardQuery.isLoading}
        />
        <UpcomingEventHighlights
          event={upcomingEvent}
          isLoading={dashboardQuery.isLoading}
          errorMessage={errorMessage}
        />

        <div className="w-full block min-h-80">
          <AnalyticsChart
            events={dashboardQuery.data?.events ?? []}
            isLoading={dashboardQuery.isLoading}
            errorMessage={errorMessage}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}
