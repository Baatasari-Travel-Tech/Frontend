"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"

export default function OrganizerPendingPage() {
  const router = useRouter()
  const { user, organizerVerificationStatus, refreshOrganizerStatus, switchRole } = useAuth()
  const [switching, setSwitching] = useState(false)

  const handleSwitchToUser = () => {
    if (switching) return
    setSwitching(true)
    router.push("/dashboard")
    void switchRole("USER")
  }

  useEffect(() => {
    const id = setInterval(() => { void refreshOrganizerStatus() }, 10_000)
    return () => clearInterval(id)
  }, [refreshOrganizerStatus])

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
      router.replace("/organizer/dashboard")
    }
  }, [organizerVerificationStatus, router, user])

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer approval"
        title="Your organizer account is pending review"
        description="All required onboarding steps are complete. Our team is now reviewing your profile and documents."
      >
        <div className="mx-auto w-full max-w-3xl">
          <SectionCard className="border-slate-200 bg-white">
            <div className="grid gap-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:px-5">
                Status: Pending manual verification by the onboarding team.
              </div>

              <div className="grid gap-4 text-sm leading-6 text-slate-600">
                <h2 className="text-lg font-semibold text-slate-950">What happens next</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Our team reviews your submitted documents and organizer details.</li>
                  <li>We contact you if any clarification is needed.</li>
                  <li>Your organizer tools unlock automatically once approved.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 sm:px-5">
                Keep PAN, GST, and organization details handy to speed up verification if our team reaches out.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/organizer/profile"
                  className="inline-flex items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  Open organizer profile
                </Link>
                <button
                  type="button"
                  onClick={handleSwitchToUser}
                  disabled={switching}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Switch to user side
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
