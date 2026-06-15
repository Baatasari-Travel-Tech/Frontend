"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Download, ScanLine } from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import type { EventDetail } from "@/types/api"

import { EventOverview } from "@/components/event-org/analytics/event-overview"
import { EventStats } from "@/components/event-org/analytics/event-stats"
import { RevenueStats } from "@/components/event-org/analytics/revenue-stats"
import { DateReviewsSection } from "@/components/event-org/analytics/date-reviews"
import { ViewsVsPurchases } from "@/components/event-org/analytics/views-vs-purchases"
import { GstThresholdBanner } from "@/components/event-org/gst-threshold-banner"

function AnalyticsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId")
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportCsv = async () => {
    if (!eventId) return
    setExportLoading(true)
    setExportError(null)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
      const res = await fetch(`${base}/api/v1/organizer/events/${eventId}/attendees/export`, {
        credentials: "include",
        headers: { "x-active-role": "ORGANIZER" },
      })
      if (!res.ok) throw new Error("Export failed. Please try again.")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendees-${eventId}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExportLoading(false)
    }
  }

  const eventsQuery = useQuery<EventDetail[], Error>({
    queryKey: ["organizer-events"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { events: EventDetail[] } }>("/organizer/events", { auth: true })
      return response.data.events
    },
    enabled: !eventId,
  })

  useEffect(() => {
    if (eventId || !eventsQuery.data) return
    const events = eventsQuery.data
    if (events.length === 0) return
    const now = Date.now()
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const nearest = sorted.find((e) => new Date(e.date).getTime() >= now) ?? sorted[sorted.length - 1]
    if (nearest) {
      router.replace(`/organizer/analytics?eventId=${encodeURIComponent(nearest.id)}`)
    }
  }, [eventId, eventsQuery.data, router])

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

  const handleEdit = () => {
    if (!eventId) return
    router.push(
      `/organizer/create-event?startDirectly=true&action=edit&eventId=${encodeURIComponent(eventId)}`
    )
  }

  if (!eventId) {
    if (eventsQuery.isLoading || (eventsQuery.data && eventsQuery.data.length > 0)) {
      return (
        <div className="w-full px-0 sm:px-6 lg:px-8 py-4">
          <div className="rounded-2xl border border-slate-200 bg-background px-6 py-10 text-center">
            <p className="text-slate-500 text-sm">Loading events...</p>
          </div>
        </div>
      )
    }
    return (
      <div className="w-full px-0 sm:px-6 lg:px-8 py-4">
        <div className="rounded-2xl border border-slate-200 bg-background px-6 py-10 text-center flex flex-col items-center gap-3">
          <p className="text-slate-500 text-sm">No events yet. Create your first event to view analytics.</p>
          <button
            className="rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-semibold hover:bg-slate-800 transition"
            onClick={() => router.push("/organizer/create-event?mode=create")}
          >
            Create Event
          </button>
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
      <GstThresholdBanner />
      <EventOverview event={event} isLoading={isLoading} onEdit={handleEdit} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        <div className="lg:col-span-12">
          <EventStats event={event} isLoading={isLoading} />
        </div>
      </div>
      <ViewsVsPurchases eventId={event?.id} />
      <RevenueStats event={event} isLoading={isLoading} />
      <DateReviewsSection eventId={event?.id} />

      <div className="flex flex-col gap-2 px-4 md:px-8">
        {exportError && (
          <p className="text-sm text-rose-600">{exportError}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {event ? (
            <Button asChild variant="outline" className="w-fit gap-2 rounded-full">
              <Link href={`/organizer/events/${eventId}/scan`}>
                <ScanLine className="h-4 w-4" />
                Scan tickets at the door
              </Link>
            </Button>
          ) : null}

          <Button
            variant="outline"
            className="w-fit gap-2 rounded-full"
            onClick={() => void handleExportCsv()}
            disabled={exportLoading || !event}
          >
            <Download className="h-4 w-4" />
            {exportLoading ? "Exporting..." : "Export Attendees CSV"}
          </Button>
        </div>
      </div>
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
