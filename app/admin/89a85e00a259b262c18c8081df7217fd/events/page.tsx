"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RefreshCw, Search } from "lucide-react"
import { listAdminEvents, isAdminAuthFailure, type AdminEventListItem } from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { getAdminToken } from "@/lib/admin/session"
import { ShareEventButton } from "@/components/event-org/share-event-button"

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<AdminEventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminEvents()
      setEvents(res.events)
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to load events.")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(ADMIN_ROUTES.login)
      return
    }
    void load()
  }, [load, router])

  const filtered = events.filter((e) =>
    [e.title, e.venue, e.category, e.organizerName, e.organizerEmail]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Events</h1>
            <p className="text-sm text-slate-600">View any event, edit its details/cover, and see payments.</p>
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

        <div className="relative mb-4 w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events / organizer"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm"
          />
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Event</th>
                  <th className="px-4 py-3 font-semibold">Organizer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No events found.</td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{e.title}</div>
                        <div className="text-xs text-slate-400">{e.venue}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div>{e.organizerName || "—"}</div>
                        <div className="text-xs text-slate-400">{e.organizerEmail}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 text-slate-700">{e.category || "—"}</td>
                      <td className="px-4 py-3">
                        {e.cancelledAt ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Cancelled</span>
                        ) : e.published ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Published</span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Draft</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {e.published && !e.cancelledAt ? (
                            <ShareEventButton eventId={e.id} title={e.title} />
                          ) : null}
                          <Link
                            href={`${ADMIN_ROUTES.events}/${e.id}`}
                            className="inline-flex rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Open
                          </Link>
                        </div>
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
