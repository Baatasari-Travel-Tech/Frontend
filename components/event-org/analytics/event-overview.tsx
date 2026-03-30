"use client"

import { useState } from "react"
import { Calendar, Clock, Info, MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"

type AnalyticsEventData = {
  eventName: string
  date: string
  time: string
  status: string
  location: string
}

type StoredAnalyticsEventData = Partial<Pick<AnalyticsEventData, "eventName" | "date" | "status">>

const STORAGE_KEY = "analyticsEventData"

const getInitialEventData = (): AnalyticsEventData => {
  const defaultData: AnalyticsEventData = {
    eventName: "Martiza Concert Vizag",
    date: "25 June 2025",
    time: "12:00 PM",
    status: "Past",
    location: "Visakhapatnam",
  }

  if (typeof window === 'undefined') return defaultData

  try {
    const storedData = localStorage.getItem(STORAGE_KEY)
    if (!storedData) return defaultData

    const parsed = JSON.parse(storedData) as StoredAnalyticsEventData
    return {
      ...defaultData,
      eventName: parsed.eventName || defaultData.eventName,
      date: parsed.date || defaultData.date,
      status: parsed.status || defaultData.status,
    }
  } catch (e) {
    console.error("Failed to parse analytics event data", e)
    return defaultData
  }
}

export function EventOverview() {
  const [eventData] = useState<AnalyticsEventData>(getInitialEventData)

  return (
    <div className="w-full px-4 md:px-8 pb-4 md:pb-8 pt-0">
      <div className="w-full flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full flex flex-col gap-6">
          <h1 className="text-2xl lg:text-4xl font-bold text-(--upcoming-primary-700)">
            {eventData.eventName}
          </h1>

          <div className="flex flex-wrap items-center gap-6 lg:gap-12">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Info className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium bg-muted px-2 rounded">
                  {eventData.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Time</span>
                <span className="font-medium">{eventData.time}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="font-medium">{eventData.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="font-medium">{eventData.date}</span>
              </div>
            </div>
          </div>
        </div>

        <Button className="gap-2 self-start lg:self-auto rounded-full bg-blue-soft text-white">
          <Pencil className="h-4 w-4" />
          Edit Event
        </Button>
      </div>
    </div>
  )
}
