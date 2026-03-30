"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function OrganizerStallsPage() {
  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer modules"
        title="Stalls is ready for the next backend phase"
        description="This route ships with a polished placeholder until the stalls contract is added to the API."
      >
        <SectionCard title="Planned capability">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5 text-sm leading-6 text-slate-600">
            Stall intake, approvals, and allocation flows are intentionally held back in v1. The frontend keeps this
            route present so navigation and IA stay stable while backend support is introduced later.
          </div>
        </SectionCard>
      </PageShell>
    </ProtectedRoute>
  )
}
