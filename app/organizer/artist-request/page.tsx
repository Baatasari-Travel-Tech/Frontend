"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function OrganizerArtistRequestPage() {
  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer modules"
        title="Artist requests are staged for a future backend release"
        description="The frontend keeps this production-quality placeholder available so the organizer information architecture is complete today."
      >
        <SectionCard title="Future workflow">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm leading-6 text-slate-600">
            Artist request intake, review, and response handling will plug into this route once dedicated backend endpoints
            are added. For now, the page communicates status clearly without inventing unsupported contracts.
          </div>
        </SectionCard>
      </PageShell>
    </ProtectedRoute>
  )
}
