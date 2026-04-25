"use client"


import { ArtistRequestsCarousel } from "@/components/event-org/artist-requests-carousel"

export default function ArtistRequestsPage() {
    return (
        <>
            <div className="w-full mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 py-3 md:py-6 flex flex-col gap-6">
                <h1 className="text-3xl font-bold text-(--upcoming-primary-700)">
                    Suggested Events
                </h1>
                <ArtistRequestsCarousel />
            </div>
        </>
    )
}
