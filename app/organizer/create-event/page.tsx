"use client"

import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { OrganizerEventForm } from "@/components/platform/organizer-event-form"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { apiRequest } from "@/lib/api/client"

export default function OrganizerCreateEventPage() {
  const router = useRouter()

  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer events"
        title="Create a new event"
        description="Publish immediately and attach ticket tiers that the public events flow can sell through the backend."
      >
        <div className="grid gap-6">
          <SectionCard title="Event builder">
            <OrganizerEventForm
              mode="create"
              onSubmit={async (payload) => {
                await apiRequest("/organizer/events", {
                  method: "POST",
                  auth: true,
                  body: JSON.stringify(payload),
                })
                router.push("/organizer/manage-events")
              }}
            />
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
