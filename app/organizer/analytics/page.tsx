"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import type { EventDetail } from "@/types/api"

import { EventOverview } from "@/components/event-org/analytics/event-overview"
import { EventStats } from "@/components/event-org/analytics/event-stats"
import { RevenueStats } from "@/components/event-org/analytics/revenue-stats"
import { DateReviewsSection } from "@/components/event-org/analytics/date-reviews"
import { EventDetailsDescription } from "@/components/event-org/analytics/event-details-description"

function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile } = useAuth()

  const eventId = searchParams.get("eventId")

  const eventQuery = useQuery<EventDetail, Error>({
    queryKey: ["organizer-event-analytics", eventId],
    queryFn: async () => {
      const response = await apiRequest<{ data: { event: EventDetail } }>(
        `/organizer/events/${eventId}`,
        { auth: true }
      )
      return response.data.event
    },
    enabled: Boolean(eventId),
  })

  const event = eventQuery.data ?? null
  const isLoading = eventQuery.isLoading

  const organizerName = profile?.full_name?.trim() || undefined

  const handleEdit = () => {
    if (!eventId) return
    router.push(
      `/organizer/create-event?startDirectly=true&action=edit&eventId=${encodeURIComponent(eventId)}`
    )
  }

  if (!eventId) {
    return (
      <div className="w-full px-0 sm:px-6 lg:px-8 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-slate-500 text-sm">
            No event selected. Go to{" "}
            <button
              className="text-blue-600 underline underline-offset-2"
              onClick={() => router.push("/organizer/manage-events")}
            >
              Manage Events
            </button>{" "}
            and click an event to view its analytics.
          </p>
        </div>
      </div>
    )
  }

  if (eventQuery.isError) {
    return (
      <div className="w-full px-0 sm:px-6 lg:px-8 py-4">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {eventQuery.error?.message ?? "Unable to load event analytics."}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-0 sm:px-6 lg:px-8 pt-0 pb-6 flex flex-col gap-6">
      <EventOverview event={event} isLoading={isLoading} onEdit={handleEdit} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-12">
          <EventStats event={event} isLoading={isLoading} />
        </div>
      </div>
      <RevenueStats event={event} isLoading={isLoading} />
      <DateReviewsSection />
      <EventDetailsDescription
        event={event}
        isLoading={isLoading}
        organizerName={organizerName}
      />
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requireOrganizer>
      <Suspense fallback={null}>
        <AnalyticsContent />
      </Suspense>
    </ProtectedRoute>
  )
}
