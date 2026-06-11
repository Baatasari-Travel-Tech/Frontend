"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"

export default function OrganizerEmailVerificationPage() {
  const router = useRouter()
  const { user, organizerVerificationStatus, refreshOrganizerStatus } = useAuth()

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

    if (organizerVerificationStatus === "APPROVED") {
      router.replace("/organizer/dashboard")
      return
    }

    if (organizerVerificationStatus === "PENDING") {
      router.replace("/organizer/pending")
      return
    }

    if (organizerVerificationStatus === "DOCUMENTS_REQUIRED" || user.emailVerified) {
      router.replace("/organizer/document-upload")
    }
  }, [organizerVerificationStatus, router, user])

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer verification"
        title="Verify your email to continue"
        description="Finish this step to unlock organizer document upload and move your account into approval review."
      >
        <div className="mx-auto w-full max-w-3xl">
          <SectionCard className="border-slate-200 bg-background">
            <div className="grid gap-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900 sm:px-5">
                A verification link has been sent to your registered email address.
              </div>

              <div className="grid gap-4 text-sm leading-6 text-slate-600">
                <h2 className="text-lg font-semibold text-slate-950">What to do now</h2>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>Open your inbox and click the Baatasari verification link.</li>
                  <li>Return here after verification completes.</li>
                  <li>Continue with PAN and agreement upload.</li>
                </ol>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-background px-4 py-4 text-sm leading-6 text-slate-600 sm:px-5">
                If you cannot find the email, check Spam or Promotions. For support, reach our team directly.
              </div>

              <a
                href="mailto:contact-us@baatasari.com"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Contact support
              </a>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
