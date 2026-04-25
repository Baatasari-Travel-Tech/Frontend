"use client"


import { EventOverview } from "@/components/event-org/analytics/event-overview"
import { EventStats } from "@/components/event-org/analytics/event-stats"
import { RevenueStats } from "@/components/event-org/analytics/revenue-stats"
import { DateReviewsSection } from "@/components/event-org/analytics/date-reviews"
import { EventDetailsDescription } from "@/components/event-org/analytics/event-details-description"
import { ApprovedStallsSection } from "@/components/event-org/analytics/approved-stalls"

export default function AnalyticsPage() {
  return (
    <>
      <div className="w-full px-0 sm:px-6 lg:px-8 pt-0 pb-6 flex flex-col gap-6">
        <EventOverview />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          <div className="lg:col-span-12">
            <EventStats />
          </div>
        </div>
        <RevenueStats />
        <ApprovedStallsSection />
        <DateReviewsSection />
        <EventDetailsDescription />
      </div>
    </>
  )
}
