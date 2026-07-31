"use client"

import { useState } from "react"
import { apiRequest } from "@/lib/api/client"
import { RecruitmentFill } from "@/components/recruitment/RecruitmentFill"
import { coerceForm, type RecruitmentForm as RecruitmentFormSchema } from "@/lib/recruitment"

export default function RecruitmentFillClient({
  slug,
  title,
  schema,
}: {
  slug: string
  title: string
  schema: RecruitmentFormSchema
}) {
  // Hidden from real applicants (input is visually hidden below); a filled
  // value means a bot blindly filled every input it could find.
  const [honeypot, setHoneypot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (answers: { question: string; answer: string }[]) => {
    setError(null)
    setSubmitting(true)
    try {
      await apiRequest(`/recruitment/forms/${slug}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers, website: honeypot }),
        retryOn401: false,
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>

        {submitted ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Thanks — your application has been submitted.
          </p>
        ) : (
          <div className="mt-6">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}
            <RecruitmentFill form={coerceForm(schema)} submitting={submitting} onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </main>
  )
}
