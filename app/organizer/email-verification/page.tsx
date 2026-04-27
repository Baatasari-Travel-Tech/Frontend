"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"

export default function OrganizerEmailVerificationPage() {
  const router = useRouter()
  const { user, organizerVerificationStatus } = useAuth()

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
        description="Your verification email is sent only after organizer onboarding is completed. Once you verify it, you will continue to document upload."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Next step" description="Please open your inbox and use the verification link from Baatasari.">
            <div className="grid gap-4 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                After verification, you will land on the document upload page before approval review begins.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                We do not show resend here. If there is any issue with the verification email, please contact us and our team will help you directly.
              </div>
              <a
                href="mailto:contact-us@baatasari.com"
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                Contact us
              </a>
            </div>
          </SectionCard>

          <SectionCard title="While you wait">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Your organizer dashboard will unlock only after email verification and manual approval are both complete.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                You can still access the user side of the platform by switching roles from the profile menu in the navbar once your onboarding is complete.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Once your email is verified, your organizer profile will stay available from the pending state so you can review the same onboarding details anytime.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
