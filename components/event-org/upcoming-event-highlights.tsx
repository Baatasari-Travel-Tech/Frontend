"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { UpcomingManageEvent } from "@/components/event-org/manage-events/manage-events"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiRequest } from "@/lib/api/client"

type UpcomingEventHighlightsProps = {
  event?: UpcomingManageEvent | null
  isLoading?: boolean
  errorMessage?: string | null
}

export function UpcomingEventHighlights({
  event = null,
  isLoading = false,
  errorMessage = null,
}: UpcomingEventHighlightsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [cancelError, setCancelError] = useState<string | null>(null)

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/organizer/events/${event!.id}/cancel`, { method: "POST", auth: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organizer-events"] })
      await queryClient.invalidateQueries({ queryKey: ["organizer-dashboard"] })
    },
    onError: (err) => {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel event. Please try again.")
    },
  })

  const handleViewDetails = () => {
    if (!event) return
    localStorage.setItem("analyticsEventData", JSON.stringify(event.analyticsData))
    router.push(`/organizer/analytics?eventId=${encodeURIComponent(event.id)}`)
  }

  const handleReschedule = () => {
    if (!event) return
    localStorage.setItem("eventFormData", JSON.stringify(event.formData))
    router.push(
      `/organizer/create-event?startDirectly=true&action=reschedule&eventId=${encodeURIComponent(
        event.id
      )}`
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-[(--upcoming-primary-700)] mb-2">Upcoming Event Highlights</h2>
          <p className="text-sm text-slate-500">Loading upcoming event...</p>
        </CardContent>
      </Card>
    )
  }

  if (errorMessage) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-[(--upcoming-primary-700)] mb-2">Upcoming Event Highlights</h2>
          <p className="text-sm text-rose-600">{errorMessage}</p>
        </CardContent>
      </Card>
    )
  }

  if (!event) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-[(--upcoming-primary-700)]">Upcoming Event Highlights</h2>
          <p className="text-sm text-slate-600">
            You do not have an upcoming event yet. Create one to see performance highlights here.
          </p>
          <Button
            className="w-fit rounded-full bg-foreground text-background"
            onClick={() => router.push("/organizer/create-event?mode=create")}
          >
            Create Event
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="w-full cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={handleViewDetails}
    >
      <CardContent className="p-4 sm:p-6 pb-6 mt-4">
        <h2 className="text-xl font-semibold text-[(--upcoming-primary-700)] mb-6">
          Upcoming Event Highlights
        </h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="shrink-0">
            {event.posterImage ? (
              <Image
                src={event.posterImage}
                alt={`${event.title} poster`}
                width={234}
                height={363}
                className="object-cover rounded-lg mx-auto lg:mx-0"
                sizes="(max-width: 640px) 70vw, 234px"
                onError={(imageEvent) => {
                  imageEvent.currentTarget.src = "/event-img.svg"
                }}
              />
            ) : (
              <div className="w-58.5 h-90.75 rounded-lg bg-slate-100 flex items-center justify-center mx-auto lg:mx-0">
                <span className="text-slate-400 text-sm">No image</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-sm space-y-2 lg:pl-4">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1 wrap-break-word">
              {event.title}
            </h3>
            <p className="font-semibold text-[(--upcoming-primary-800)] text-base">{event.date}</p>

            <p>
              <b>Time:</b> {event.timeRange}
            </p>
            <p>
              <b>Type:</b> {event.type}
            </p>
            <p>
              <b>Venue:</b>{" "}
              <span className="font-medium text-[(--upcoming-blue-600)]">{event.venue}</span>
            </p>

            <div className="pt-3">
              <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">{event.aboutTitle}</p>
              <p className="text-sm leading-relaxed text-[(--upcoming-gray-600)]">
                {event.aboutDescription}
              </p>
            </div>

            <div className="pt-2">
              <p className="font-semibold mb-1 text-[(--upcoming-primary-700)]">{event.highlightsTitle}</p>
              <ul className="list-disc ml-4 text-sm text-[(--upcoming-gray-600)] space-y-1">
                {event.highlights.slice(0, 3).map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="w-full lg:w-90 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <Stat title="Event Registrations" value={event.stats.registrations} />
              <Stat title="Total Revenue" value={event.stats.revenue} />
              <Stat title="Ad Ons" value={event.stats.addOns} />
              <Stat title="Date Change" value={event.stats.dateChange} />
            </div>

            {cancelError && (
              <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                {cancelError}
              </p>
            )}
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 mt-10 w-full justify-between sm:justify-start pb-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-destructive text-destructive whitespace-nowrap flex-1 sm:flex-none"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation()
                      setCancelError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(clickEvent) => clickEvent.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the event. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(clickEvent) => clickEvent.stopPropagation()}>
                      Keep Event
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={cancelMutation.isPending}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        cancelMutation.mutate()
                      }}
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Event"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="outline"
                className="rounded-full text-xs sm:text-sm px-2 sm:px-4 py-2 border-foreground text-[(--upcoming-blue-600)] whitespace-nowrap flex-1 sm:flex-none"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  handleReschedule()
                }}
              >
                Reschedule
              </Button>

              <Button
                className="rounded-full text-xs sm:text-sm px-4 sm:px-6 py-2 bg-foreground text-background whitespace-nowrap flex-1 sm:flex-none ml-auto"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  handleViewDetails()
                }}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="border border-border rounded-xl px-4 sm:px-5 py-4 sm:py-5 bg-card min-w-0">
      <p className="text-xs sm:text-sm text-black font-medium mb-2 wrap-break-word">{title}</p>
      <p className="text-xl sm:text-2xl font-bold wrap-break-word">{value}</p>
    </div>
  )
}
