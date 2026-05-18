"use client"

import * as React from "react"
import { Calendar, MapPin, Users, Tag } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { EventDetail } from "@/types/api"

const formatDateAndTime = (date: string, startTime: string | null, endTime: string | null) => {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))

  if (startTime && endTime) return `${formatted}; ${startTime} – ${endTime}`
  if (startTime) return `${formatted}; ${startTime} onwards`
  return formatted
}

type Props = {
  event: EventDetail | null
  isLoading: boolean
  organizerName?: string
}

export function EventDetailsDescription({ event, isLoading, organizerName }: Props) {
  const [showFull, setShowFull] = React.useState(false)

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="rounded-xl border bg-card p-10 animate-pulse h-64" />
      </div>
    )
  }

  if (!event) return null

  const description = event.description ?? ""
  const truncated = description.length > 300 && !showFull
  const displayedDescription = truncated ? `${description.slice(0, 300)}…` : description

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardContent className="px-6 py-6 md:px-10 md:py-10 flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/3 flex flex-col gap-8">
            <h2 className="text-2xl font-bold text-blue-soft">Event Details</h2>

            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  <Calendar className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">Date &amp; Time</h3>
                  <p className="text-muted-foreground">
                    {formatDateAndTime(event.date, event.startTime, event.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <MapPin className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">Location</h3>
                  <p className="text-muted-foreground">{event.venue}</p>
                </div>
              </div>

              {organizerName && (
                <div className="flex gap-4">
                  <div className="mt-1">
                    <Users className="h-6 w-6 text-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold text-lg text-foreground">Organized By</h3>
                    <p className="text-muted-foreground">{organizerName}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <div className="mt-1">
                  <Tag className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-foreground">Category</h3>
                  <p className="text-muted-foreground">{event.category ?? "Live Event"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-blue-soft">Description</h2>

            <div className="flex flex-col gap-4 text-muted-foreground leading-relaxed">
              <p>{displayedDescription}</p>
            </div>

            {description.length > 300 && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="bg-(--white) text-(--upcoming-blue-600) rounded-full px-4 py-1 font-medium text-sm md:text-base transition-transform duration-160 ease-out active:scale-[0.97]"
                  onClick={() => setShowFull((prev) => !prev)}
                >
                  {showFull ? "Show Less" : "Read More"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
