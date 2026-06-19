"use client"

import { useState } from "react"
import { Search, Trash2, RotateCcw, ShieldAlert, FileDown, Loader2, X } from "lucide-react"
import {
  lookupAdminUsers,
  getAdminUserDetails,
  getAdminOrganizerDetails,
  deleteAdminUser,
  reviveAdminUser,
  hardDeleteAdminUser,
  fetchAdminBlob,
  type AdminUserLookupResult,
} from "@/lib/api/admin"

type Detail = {
  user: Record<string, unknown>
  userProfile: Record<string, unknown> | null
  organizerProfile: Record<string, unknown> | null
}

const HIDDEN_KEYS = new Set(["password", "passwordHash", "totpSecret"])

const humanize = (k: string) =>
  k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const fmt = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function Section({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data) return null
  const entries = Object.entries(data).filter(([k]) => !HIDDEN_KEYS.has(k))
  if (entries.length === 0) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-2.5 text-sm font-bold text-slate-900">{title}</h4>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-50 py-0.5 text-xs">
            <dt className="shrink-0 text-slate-500">{humanize(k)}</dt>
            <dd className="max-w-[62%] truncate text-right font-medium text-slate-800" title={fmt(v)}>{fmt(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function FetchUserDetails() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AdminUserLookupResult[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [searching, setSearching] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError(null)
    setNotice(null)
    setDetail(null)
    setSelectedId(null)
    try {
      const { results } = await lookupAdminUsers(query.trim())
      setResults(results)
      if (results.length === 1) void selectUser(results[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed")
    } finally {
      setSearching(false)
    }
  }

  const selectUser = async (id: string) => {
    setSelectedId(id)
    setLoadingDetail(true)
    setError(null)
    setNotice(null)
    try {
      const u = await getAdminUserDetails(id)
      const isOrg = (u.user as { role?: string }).role === "ORGANIZER"
      let organizerProfile: Record<string, unknown> | null = null
      if (isOrg) {
        try {
          const org = await getAdminOrganizerDetails(id)
          organizerProfile = (org.organizerProfile as Record<string, unknown> | null) ?? null
        } catch {
          organizerProfile = null
        }
      }
      setDetail({
        user: u.user as unknown as Record<string, unknown>,
        userProfile: (u.userProfile as unknown as Record<string, unknown> | null) ?? null,
        organizerProfile,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load details")
    } finally {
      setLoadingDetail(false)
    }
  }

  const email = (detail?.user.email as string) ?? ""
  const role = (detail?.user.role as string) ?? ""
  const isDeleted = Boolean(detail?.user.deletedAt)
  const isAnonymized = email.endsWith("@deleted.invalid")
  const isOrganizer = role === "ORGANIZER"

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    if (!selectedId) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await fn()
      setNotice(ok)
      await selectUser(selectedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  const downloadDoc = async (type: "pan" | "agreement") => {
    if (!selectedId) return
    try {
      const blob = await fetchAdminBlob(`/admin/organizers/${selectedId}/documents/${type}`)
      if (!blob) {
        setError(`No ${type} document on file`)
        return
      }
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed")
    }
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Fetch user details</h2>
      <p className="mb-4 text-sm text-slate-500">Search by UID, email, or phone number.</p>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
            placeholder="UID / email / phone…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void search()}
          disabled={searching || !query.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
        </button>
      </div>

      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p> : null}

      {/* Results picker (when >1) */}
      {results && results.length > 1 && !detail ? (
        <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => void selectUser(r.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-800">{r.fullName ?? r.email}</span>
                <span className="block truncate text-xs text-slate-500">{r.email} · {r.role}{r.phone ? ` · ${r.phone}` : ""}</span>
              </span>
              {r.deletedAt ? <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">{r.anonymized ? "ANONYMIZED" : "DELETING"}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {results && results.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No matching user found.</p>
      ) : null}

      {/* Detail */}
      {loadingDetail ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : detail ? (
        <div className="mt-5 space-y-4">
          {/* Header + status */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-bold text-slate-900">
                {(detail.userProfile?.fullName as string) || email}
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">{role}</span>
                {isAnonymized ? <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-white">ANONYMIZED</span> : isDeleted ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">UNDER DELETION</span> : null}
              </p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
            <button type="button" onClick={() => { setDetail(null); setSelectedId(null) }} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200"><X className="h-4 w-4" /></button>
          </div>

          {/* Actions */}
          {!isAnonymized ? (
            <div className="flex flex-wrap gap-2">
              {isDeleted ? (
                <button type="button" disabled={busy} onClick={() => void act(() => reviveAdminUser(selectedId!), "User revived.")} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
                  <RotateCcw className="h-4 w-4" /> Revive
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => { if (window.confirm("Soft-delete this user? They get a 24h grace window and can be revived. Their events & tickets are untouched.")) void act(() => deleteAdminUser(selectedId!), "User soft-deleted (24h grace).") }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                  <Trash2 className="h-4 w-4" /> Soft delete
                </button>
              )}
              <button type="button" disabled={busy} onClick={() => { if (window.confirm("HARD DELETE — permanently anonymize this user's personal data NOW. Irreversible. Their events, orders and tickets are KEPT. Continue?")) void act(() => hardDeleteAdminUser(selectedId!), "User permanently anonymized. Events & tickets preserved.") }} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
                <ShieldAlert className="h-4 w-4" /> Hard delete
              </button>
              {busy ? <span className="inline-flex items-center text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /></span> : null}
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">This account is permanently anonymized — no further actions.</p>
          )}

          {/* Organizer PDFs */}
          {isOrganizer && !isAnonymized ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void downloadDoc("pan")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FileDown className="h-4 w-4" /> PAN document
              </button>
              <button type="button" onClick={() => void downloadDoc("agreement")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <FileDown className="h-4 w-4" /> Agreement
              </button>
            </div>
          ) : null}

          {/* All details */}
          <Section title="Account" data={detail.user} />
          <Section title="Profile" data={detail.userProfile} />
          {isOrganizer ? <Section title="Organizer profile" data={detail.organizerProfile} /> : null}
        </div>
      ) : null}
    </section>
  )
}
