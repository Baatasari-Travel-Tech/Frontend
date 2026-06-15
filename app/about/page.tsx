import Hero from "@/components/about/hero"
import Features from "@/components/about/features"
import EventOrganizer from "@/components/about/organizer"
import RestaurantOwner from "@/components/about/restaurant-owner"
import Performers from "@/components/about/performers"
import CampusAmbassador from "@/components/about/campus-ambassador"

export default function AboutPage() {
    return (
        <main className="min-h-screen">
            <Hero />
            <Features />
            <EventOrganizer />
            <RestaurantOwner />
            <Performers />
            <CampusAmbassador />
        </main>
    )
}
