"use client"


import { UpcomingEventsSection } from "@/components/event-org/manage-events/upcoming-events-section"
import { AllEventsSection } from "@/components/event-org/manage-events/all-events-section"

export default function ManageEventsPage() {
    return (
        <>
            <div className="w-full mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-10 py-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-3xl font-bold text-upcoming-primary-700">Manage Events</h1>
                </div>
                <UpcomingEventsSection />
                <AllEventsSection />
            </div>
        </>
    )
}
