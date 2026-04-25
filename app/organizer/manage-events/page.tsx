"use client"

import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { UpcomingEventsSection } from "@/components/event-org/manage-events/upcoming-events-section"
import { AllEventsSection } from "@/components/event-org/manage-events/all-events-section"
import { apiRequest } from "@/lib/api/client"
import type { EventDetail } from "@/types/api"

export default function ManageEventsPage() {
  const eventsQuery = useQuery<EventDetail[], Error>({
    queryKey: ["organizer-events", "manage-events"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { events: EventDetail[] } }>("/organizer/events", {
        auth: true,
      })
      return response.data.events
    },
  })

  const errorMessage = eventsQuery.isError
    ? eventsQuery.error?.message || "Unable to load organizer events right now."
    : null

  return (
    <ProtectedRoute requireOrganizer>
      <div className="w-full mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 py-6 flex flex-col gap-6">
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-3xl font-bold text-upcoming-primary-700">Manage Events</h1>
        </div>

        <UpcomingEventsSection
          events={eventsQuery.data ?? []}
          isLoading={eventsQuery.isLoading}
          errorMessage={errorMessage}
        />
        <AllEventsSection
          events={eventsQuery.data ?? []}
          isLoading={eventsQuery.isLoading}
          errorMessage={errorMessage}
        />
      </div>
    </ProtectedRoute>
  )
}
