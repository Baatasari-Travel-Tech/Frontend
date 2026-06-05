"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RefreshCw, Check } from "lucide-react"
import { listAdminSupportMessages, resolveAdminSupportMessage, isAdminAuthFailure } from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { getAdminToken } from "@/lib/admin/session"
import type { SupportMessage } from "@/lib/api/support"

type Filter = "ALL" | "OPEN" | "RESOLVED"

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

export default function AdminSupportPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("OPEN")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminSupportMessages(filter === "ALL" ? undefined : filter)
      setMessages(res.messages)
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to load support messages.")
    } finally {
      setLoading(false)
    }
  }, [filter, router])

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(ADMIN_ROUTES.login)
      return
    }
    void load()
  }, [load, router])

  const handleResolve = async (id: string) => {
    setResolvingId(id)
    setError(null)
    try {
      await resolveAdminSupportMessage(id)
      await load()
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to resolve the case.")
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Support Messages</h1>
            <p className="text-sm text-slate-600">Requests raised by users from the Contact us page.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={ADMIN_ROUTES.dashboard}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Dashboard
            </Link>
            <button
              type="button"
              onClick={() => void load()}
              aria-label="Refresh"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          {(["OPEN", "RESOLVED", "ALL"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                filter === value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {value === "OPEN" ? "Open" : value === "RESOLVED" ? "Resolved" : "All"}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Problem</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No {filter === "ALL" ? "" : filter.toLowerCase()} messages.
                    </td>
                  </tr>
                ) : (
                  messages.map((m) => (
                    <tr key={m.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{m.name || "—"}</div>
                        <div className="font-mono text-[11px] text-slate-400" title={m.userId}>
                          {m.userId.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <a className="hover:underline" href={`mailto:${m.email}`}>
                          {m.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <a className="hover:underline" href={`tel:${m.phone}`}>
                          {m.phone}
                        </a>
                      </td>
                      <td className="max-w-sm px-4 py-3 text-slate-700">
                        <p className="whitespace-pre-wrap">{m.problem}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            m.status === "OPEN" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {m.status === "OPEN" ? "Open" : "Resolved"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.status === "OPEN" ? (
                          <button
                            type="button"
                            onClick={() => void handleResolve(m.id)}
                            disabled={resolvingId === m.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" />
                            {resolvingId === m.id ? "Closing…" : "Close case"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {m.resolvedAt ? `Closed ${formatDate(m.resolvedAt)}` : "Closed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
