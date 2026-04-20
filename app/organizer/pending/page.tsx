"use client"

import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"

export default function OrganizerPendingPage() {
  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer approval"
        title="Your organizer account is pending review"
        description="Your onboarding and email verification are complete. Our onboarding team will now review your organization before organizer tools are unlocked."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Current status">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                Organizer onboarding is complete and your email has been verified. The remaining step is approval from our onboarding team.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                A member of our onboarding team will contact you for document verification and organization verification.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Please keep your PAN, GST, and organization details ready so the review can move quickly.
              </div>
              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Open user side
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="What you can do right now">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Use the switch role option in the navbar profile dropdown to move back to the user side whenever you want.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Continue browsing events, managing your personal profile, and using all user-facing features while approval is in progress.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Organizer dashboard access, event creation, analytics, and management tools will unlock after approval.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
