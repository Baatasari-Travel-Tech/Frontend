import { EventsHero } from "@/components/events/hero"
import { EventList } from "@/components/events/event-list"
import SuggestionsForm from "@/components/landing/suggestions-form"

export default function EventsPage() {
    return (
        <main className="min-h-screen bg-(--white)">
            <div className="pt-16">
                <EventsHero />
                <EventList />
                <SuggestionsForm />
            </div>
        </main>
    )
}
