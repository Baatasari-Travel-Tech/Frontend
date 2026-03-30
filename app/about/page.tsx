import Hero from "@/components/about/hero"
import Features from "@/components/about/features"


import SuggestionsForm from "@/components/suggestions-form"
import EventOrganizer from "@/components/about/organizer"
import RestaurantOwner from "@/components/about/restaurant-owner"
import Performers from "@/components/about/performers"

export default function AboutPage() {
    return (
        <main className="min-h-screen">
            <Hero />
            <Features />
            <SuggestionsForm />
            <EventOrganizer />
            <RestaurantOwner />
            <Performers />
        </main>
    )
}