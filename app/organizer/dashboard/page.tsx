"use client"

import { Suspense } from "react"

import { StatsGrid } from "@/components/event-org/stats-grid"
import { UpcomingEventHighlights } from "@/components/event-org/upcoming-event-highlights"
import { AnalyticsChart } from "@/components/event-org/analytics-chart"

const name = "Maggi"
const description = "Track, update, and grow your events the smart way."

export default function Home() {
  return (
    <>
      <div className="w-full flex flex-col gap-6">
        <div className="w-full flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-upcoming-primary-700">
            Hello {name}!
          </h1>
          <p className="text-black">{description}</p>
        </div>

        <StatsGrid />
        <UpcomingEventHighlights />
        {/* <QuickActions /> - Hidden per user request */}

        <Suspense fallback={null}>
          <div className="w-full block min-h-80">
            <AnalyticsChart />
          </div>
        </Suspense>
      </div>
    </>
  )
}
