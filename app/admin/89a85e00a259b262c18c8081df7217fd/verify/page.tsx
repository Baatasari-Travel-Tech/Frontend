"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { adminVerifyOtp } from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { setAdminToken } from "@/lib/admin/session"

export default function AdminVerifyPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track the last token we attempted so the auto-submit effect doesn't
  // re-fire if the user clears + re-enters the same value, and so a
  // failed attempt doesn't spam the API as the user backspaces and
  // retypes.
  const lastSubmittedRef = useRef<string | null>(null)

  const handleVerify = useCallback(async (rawToken: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminVerifyOtp({ token: rawToken })
      setAdminToken(response.token)
      router.push(ADMIN_ROUTES.dashboard)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Invalid OTP")
      // Reset the lastSubmitted gate so the user can retype the same
      // (or different) code and trigger a fresh attempt.
      lastSubmittedRef.current = null
    } finally {
      setLoading(false)
    }
  }, [router])

  // Auto-submit once 6 digits are entered. Gated by lastSubmittedRef so
  // the effect doesn't fire twice for the same value (React strict-mode
  // double-invoke + the user pasting then pressing Enter both trigger
  // this otherwise).
  useEffect(() => {
    if (token.length === 6 && !loading && lastSubmittedRef.current !== token) {
      lastSubmittedRef.current = token
      void handleVerify(token)
    }
  }, [token, loading, handleVerify])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Two-factor verification</h2>
        <p className="mb-6 text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (loading || token.length !== 6) return
            lastSubmittedRef.current = token
            void handleVerify(token)
          }}
        >
          <input
            value={token}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="w-full rounded-lg border border-slate-300 p-3 text-center text-2xl tracking-[0.35em] outline-none transition focus:border-slate-600"
            onChange={(event) => setToken(event.target.value.replace(/[^\d]/g, "").slice(0, 6))}
          />

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || token.length !== 6}
            className="mt-5 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Verifying..." : "Verify and open dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}
