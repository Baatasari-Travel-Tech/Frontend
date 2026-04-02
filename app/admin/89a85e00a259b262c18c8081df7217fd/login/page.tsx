"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { adminLogin } from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      await adminLogin(form)
      router.push(ADMIN_ROUTES.verify)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Invalid credentials"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900">Admin Sign In</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Enter your admin credentials.</p>

        <div className="space-y-4">
          <input
            value={form.username}
            placeholder="Username"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-slate-600"
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
          <input
            type="password"
            value={form.password}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-slate-600"
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            onClick={() => void handleSubmit()}
            disabled={loading || !form.username || !form.password}
            className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Authenticating..." : "Continue to OTP"}
          </button>
        </div>
      </div>
    </div>
  )
}
