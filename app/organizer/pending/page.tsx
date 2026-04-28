"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"

export default function OrganizerPendingPage() {
  const router = useRouter()
  const { user, organizerVerificationStatus } = useAuth()

  useEffect(() => {
    if (!user || user.role !== "ORGANIZER") return

    if (user.onboardingStatus !== "COMPLETED") {
      router.replace("/organizer/onboarding")
      return
    }

    if (organizerVerificationStatus === "EMAIL_NOT_VERIFIED") {
      router.replace("/organizer/email-verification")
      return
    }

    if (organizerVerificationStatus === "DOCUMENTS_REQUIRED") {
      router.replace("/organizer/document-upload")
      return
    }

    if (organizerVerificationStatus === "APPROVED") {
      router.replace("/organizer/analytics")
    }
  }, [organizerVerificationStatus, router, user])

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer approval"
        title="Your organizer account is pending review"
        description="Your onboarding, email verification, and compliance document upload are complete. Our onboarding team will now review your organization before organizer tools are unlocked."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Current status">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                Organizer onboarding, email verification, and required document upload are complete. The remaining step is approval from our onboarding team.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                A member of our onboarding team will contact you for document verification and organization verification.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Please keep your PAN, GST, and organization details ready so the review can move quickly.
              </div>
              <Link
                href="/organizer/profile"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Open organizer profile
              </Link>
            </div>
          </SectionCard>

          <SectionCard title="What you can do right now">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Use the switch role option in the navbar profile dropdown to move back to the user side whenever you want.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Your organizer profile stays available here so you can review the onboarding details you already submitted.
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
