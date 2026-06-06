"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  getAdminEvent,
  updateAdminEvent,
  listAdminEventPayments,
  uploadAdminEventCover,
  isAdminAuthFailure,
  type AdminEventPayment,
} from "@/lib/api/admin"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { getAdminToken } from "@/lib/admin/session"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories"
import CoverImageCropper from "@/components/event-org/CoverImageCropper"
import type { EventDetail } from "@/types/api"

const isoToLocalInput = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const formatDateTime = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—"

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none"

export default function AdminEventDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [payments, setPayments] = useState<AdminEventPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [coverVersion, setCoverVersion] = useState<string | number | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)

  // form fields
  const [form, setForm] = useState({
    title: "",
    category: "",
    tagline: "",
    description: "",
    venue: "",
    googleMapsUrl: "",
    date: "",
    startTime: "",
    endTime: "",
    capacity: "",
    published: true,
  })

  const hydrate = useCallback((e: EventDetail) => {
    setEvent(e)
    setCoverVersion(e.updatedAt)
    setForm({
      title: e.title ?? "",
      category: e.category ?? "",
      tagline: e.tagline ?? "",
      description: e.description ?? "",
      venue: e.venue ?? "",
      googleMapsUrl: e.googleMapsUrl ?? "",
      date: isoToLocalInput(e.date),
      startTime: e.startTime ?? "",
      endTime: e.endTime ?? "",
      capacity: String(e.capacity ?? ""),
      published: e.published,
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [eventRes, paymentsRes] = await Promise.all([getAdminEvent(id), listAdminEventPayments(id)])
      hydrate(eventRes.event)
      setPayments(paymentsRes.payments)
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to load the event.")
    } finally {
      setLoading(false)
    }
  }, [id, hydrate, router])

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace(ADMIN_ROUTES.login)
      return
    }
    void load()
  }, [load, router])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        venue: form.venue.trim(),
        category: form.category.trim() || null,
        tagline: form.tagline.trim() || null,
        googleMapsUrl: form.googleMapsUrl.trim() || null,
        startTime: form.startTime.trim() || null,
        endTime: form.endTime.trim() || null,
        capacity: Number(form.capacity) || 1,
        published: form.published,
      }
      if (form.date) {
        const iso = new Date(form.date).toISOString()
        payload.date = iso
      }
      const res = await updateAdminEvent(id, payload)
      hydrate(res.event)
      setSuccess("Event updated.")
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Failed to save changes.")
    } finally {
      setSaving(false)
    }
  }

  // Open the adjustable cropper when a file is picked, so the admin frames the
  // cover to the exact 2:3 portrait that's stored and shown everywhere — same
  // UX organizers get — instead of a blind upload.
  const handlePickCover = (file: File | null) => {
    if (!file) return
    setCoverError(null)
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setCoverError("Please upload a JPG, PNG, GIF, or WEBP file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("File size must be less than 5MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setCropSource(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleCover = async (file: File, previewUrl: string) => {
    setCoverPreview(previewUrl)
    setUploading(true)
    setError(null)
    setSuccess(null)
    try {
      await uploadAdminEventCover(id, file)
      setCoverVersion(Date.now())
      setSuccess("Cover updated.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed.")
      setCoverPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{event?.title ?? "Event"}</h1>
          <Link
            href={ADMIN_ROUTES.events}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← All events
          </Link>
        </div>

        {error ? <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : !event ? (
          <p className="text-sm text-slate-500">Event not found.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            {/* Cover */}
            <div className="flex flex-col gap-3">
              <div className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverPreview ?? getEventCoverImageUrl(id, coverVersion)}
                  alt="Event cover"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              </div>
              <label className="cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800">
                {uploading ? "Uploading…" : "Change & adjust cover"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    handlePickCover(e.target.files?.[0] ?? null)
                    e.target.value = ""
                  }}
                />
              </label>
              {coverError ? <p className="text-center text-xs text-rose-600">{coverError}</p> : null}
              <p className="text-center text-xs text-slate-400">Pick an image, then drag &amp; zoom to frame it. Stored as 2:3 portrait.</p>
            </div>

            {/* Details form */}
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <label className="block text-sm font-semibold text-slate-700">
                Title
                <input className={inputClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Category
                  <select className={inputClass} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {EVENT_CATEGORY_GROUPS.map((g) => (
                      <optgroup key={g.category} label={g.category}>
                        {g.subcategories.map((s) => (
                          <option key={`${g.category}-${s}`} value={s}>{s}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Capacity
                  <input type="number" min={1} className={inputClass} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Tagline
                <input className={inputClass} value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Description
                <textarea className={`${inputClass} min-h-28 resize-y`} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Venue
                <input className={inputClass} value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Google Maps URL
                <input className={inputClass} value={form.googleMapsUrl} onChange={(e) => setForm((f) => ({ ...f, googleMapsUrl: e.target.value }))} placeholder="https://maps.google.com/…" />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Date &amp; time
                  <input type="datetime-local" className={inputClass} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Start time
                  <input className={inputClass} value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} placeholder="e.g. 6:00 PM" />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  End time
                  <input className={inputClass} value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} placeholder="e.g. 9:00 PM" />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-slate-900" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
                Published (visible on the events page)
              </label>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="w-fit rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {/* Payments */}
        {!loading && event ? (
          <div className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Payments ({payments.length})</h2>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Amount</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Paid at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No payments yet.</td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.orderNumber}</td>
                          <td className="px-4 py-3 text-slate-700">{p.name || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.email || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.phone || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.quantity}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">₹{p.totalAmount.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                p.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(p.paidAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {cropSource ? (
        <CoverImageCropper
          source={cropSource}
          onCancel={() => setCropSource(null)}
          onApply={(file, previewUrl) => {
            setCropSource(null)
            void handleCover(file, previewUrl)
          }}
        />
      ) : null}
    </main>
  )
}
