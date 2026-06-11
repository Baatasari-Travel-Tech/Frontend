"use client"

import { Calendar, Clock, Info, MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { EventDetail } from "@/types/api"

type Status = "Upcoming" | "Ongoing" | "Past"

const getStatus = (dateStr: string): Status => {
  const eventDay = new Date(dateStr)
  if (Number.isNaN(eventDay.getTime())) return "Upcoming"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDay.setHours(0, 0, 0, 0)
  if (eventDay.getTime() > today.getTime()) return "Upcoming"
  if (eventDay.getTime() < today.getTime()) return "Past"
  return "Ongoing"
}

const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))

const STATUS_COLORS: Record<Status, string> = {
  Upcoming: "bg-blue-100 text-blue-700",
  Ongoing: "bg-green-100 text-green-700",
  Past: "bg-gray-100 text-slate-600",
}

type Props = {
  event: EventDetail | null
  isLoading: boolean
  onEdit: () => void
}

export function EventOverview({ event, isLoading, onEdit }: Props) {
  if (isLoading) {
    return (
      <div className="w-full px-4 md:px-8 pb-4 md:pb-8 pt-0 animate-pulse">
        <div className="h-10 w-72 rounded bg-slate-200 mb-6" />
        <div className="flex flex-wrap gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-14 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!event) return null

  const status = getStatus(event.date)
  const timeDisplay =
    event.startTime && event.endTime
      ? `${event.startTime} – ${event.endTime}`
      : event.startTime
        ? `${event.startTime} onwards`
        : "TBA"

  return (
    <div className="w-full px-4 md:px-8 pb-4 md:pb-8 pt-0">
      <div className="w-full flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full flex flex-col gap-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-(--upcoming-primary-700)">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 lg:gap-12">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`font-medium px-2 rounded text-sm ${STATUS_COLORS[status]}`}>
                  {status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">{timeDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Venue</span>
                <span className="font-medium">{event.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{formatLongDate(event.date)}</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          className="gap-2 self-start lg:self-auto rounded-full bg-blue-soft text-white transition-transform duration-160 ease-out active:scale-[0.97]"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          Edit Event
        </Button>
      </div>
    </div>
  )
}
