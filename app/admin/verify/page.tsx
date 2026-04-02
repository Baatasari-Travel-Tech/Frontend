"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminVerifyOtp } from "@/lib/api/admin"
import { setAdminToken } from "@/lib/admin/session"

export default function AdminVerifyPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await adminVerifyOtp({ token })
      setAdminToken(response.token)
      router.push("/admin/dashboard")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Two-factor verification</h2>
        <p className="mb-6 text-sm text-slate-500">Enter the 6-digit code from your authenticator app.</p>

        <input
          value={token}
          maxLength={6}
          inputMode="numeric"
          className="w-full rounded-lg border border-slate-300 p-3 text-center text-2xl tracking-[0.35em] outline-none transition focus:border-slate-600"
          onChange={(event) => setToken(event.target.value.replace(/[^\d]/g, ""))}
        />

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <button
          onClick={() => void handleVerify()}
          disabled={loading || token.length !== 6}
          className="mt-5 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Verifying..." : "Verify and open dashboard"}
        </button>
      </div>
    </div>
  )
}
