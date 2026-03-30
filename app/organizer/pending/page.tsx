"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function OrganizerPendingPage() {
  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer approval"
        title="Your organizer account is pending admin review"
        description="You can still use the user side of the product, but organizer dashboards stay blocked until manual approval is complete."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Current status">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                Organizer onboarding is complete and email is verified. The remaining step is manual admin approval.
              </div>
              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Use user mode for now
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="What unlocks after approval">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Organizer dashboard, event creation, analytics, and event management screens.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Active-role switching into organizer mode with the `x-active-role` header applied to requests.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
