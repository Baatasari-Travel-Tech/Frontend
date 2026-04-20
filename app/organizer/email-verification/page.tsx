"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { apiRequest } from "@/lib/api/client"

export default function OrganizerEmailVerificationPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const handleResend = async () => {
    setMessage(null)
    setError(null)
    setIsSending(true)

    try {
      const response = await apiRequest<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        auth: true,
      })
      setMessage(response.message)
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Could not resend the verification email.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer verification"
        title="Verify your email to continue"
        description="A verification link has been sent to your registered account email. Once you verify it, we will move you to the approval pending stage."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Next step" description="Please open your inbox and use the verification link from Baatasari.">
            <div className="grid gap-4 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                After verification, you will land on the approval pending page while our onboarding team reviews your account.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                If you do not see the email, please check your spam or promotions folder before requesting another one.
              </div>
              {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</p> : null}
              {message ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">{message}</p> : null}
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={isSending}
                className="inline-flex w-fit items-center justify-center rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Resend verification email"}
              </button>
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
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
