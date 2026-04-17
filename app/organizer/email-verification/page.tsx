"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function OrganizerEmailVerificationPage() {
  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer verification"
        title="Verify your email to continue"
        description="Organizer mode stays locked until the backend marks your email as verified."
      >
        <SectionCard title="Next step">
          <div className="grid gap-4 text-sm leading-6 text-slate-600">
            <p>
              We’ve paused organizer access until email verification completes. Once the verification link from your inbox
              is used, this account can switch into user mode immediately and move into the pending-approval state for
              organizer tools.
            </p>
          </div>
        </SectionCard>
      </PageShell>
    </ProtectedRoute>
  )
}
