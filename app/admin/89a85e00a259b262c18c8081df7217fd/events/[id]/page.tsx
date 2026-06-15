"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  getAdminEvent,
  updateAdminEvent,
  listAdminEventPayments,
  getAdminEventPayout,
  getAdminEventFunnel,
  cancelAdminEvent,
  uploadAdminEventCover,
  isAdminAuthFailure,
  type AdminEventPayment,
  type AdminEventPayout,
} from "@/lib/api/admin"
import type { AdminEventFunnel } from "@/types/api"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import { getAdminToken } from "@/lib/admin/session"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories"
import CoverImageCropper from "@/components/event-org/CoverImageCropper"
import { ShareEventButton } from "@/components/event-org/share-event-button"
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
  const [payout, setPayout] = useState<AdminEventPayout | null>(null)
  const [funnel, setFunnel] = useState<AdminEventFunnel | null>(null)
  const [cancelling, setCancelling] = useState(false)
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
      const [eventRes, paymentsRes, payoutRes, funnelRes] = await Promise.all([
        getAdminEvent(id),
        listAdminEventPayments(id),
        getAdminEventPayout(id),
        getAdminEventFunnel(id),
      ])
      hydrate(eventRes.event)
      setPayments(paymentsRes.payments)
      setPayout(payoutRes.payout)
      setFunnel(funnelRes.funnel)
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

  const handleCancelEvent = async () => {
    if (!event) return
    if (
      !window.confirm(
        "Cancel this event?\n\nIt will show as CANCELLED to everyone and stop selling tickets. Refunds are handled manually in Razorpay. This can't be undone.",
      )
    )
      return
    setCancelling(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await cancelAdminEvent(id)
      setEvent((prev) => (prev ? { ...prev, cancelledAt: res.cancelledAt } : prev))
      setSuccess("Event cancelled. Remember to refund any paid attendees in Razorpay.")
    } catch (err) {
      if (isAdminAuthFailure(err)) {
        router.replace(ADMIN_ROUTES.login)
        return
      }
      setError(err instanceof Error ? err.message : "Couldn't cancel the event.")
    } finally {
      setCancelling(false)
    }
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
          <div className="flex items-center gap-2">
            {event && event.published && !event.cancelledAt ? (
              <ShareEventButton eventId={event.id} slug={event.slug} title={event.title} />
            ) : null}
            {event && event.cancelledAt ? (
              <span className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                Cancelled
              </span>
            ) : event ? (
              <button
                type="button"
                onClick={() => void handleCancelEvent()}
                disabled={cancelling}
                className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel event"}
              </button>
            ) : null}
            <Link
              href={ADMIN_ROUTES.events}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← All events
            </Link>
          </div>
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
            {/* Conversion funnel — counts + who (admin only) */}
            {funnel ? <AdminFunnelCard funnel={funnel} /> : null}

            {/* Organizer payout (manual settlement) */}
            {payout ? (
              <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-1 text-lg font-bold text-slate-900">Organizer payout (manual)</h2>
                <p className="mb-4 text-xs text-slate-500">
                  Refunds &amp; payouts are handled manually. Pay the organizer the net amount below.
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ticket sales (organizer's share)</span>
                      <span className="font-semibold text-slate-800">₹{payout.ticketRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>− TDS u/s 194-O ({payout.tdsRatePct}%)</span>
                      <span>−₹{payout.tds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>− GST TCS u/s 52 ({payout.tcsRatePct}%)</span>
                      <span>−₹{payout.tcs.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-emerald-700">
                      <span>Net payable to organizer</span>
                      <span>₹{payout.netPayable.toFixed(2)}</span>
                    </div>
                    {payout.refundsIssued > 0 ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                        ⚠️ ₹{payout.refundsIssued.toFixed(2)} has been refunded to buyers for this event — deduct any
                        refunds you've issued from the amount above.
                      </p>
                    ) : null}
                    <p className="pt-1 text-[11px] text-slate-400">
                      Platform fee retained: ₹{payout.platformFeeRetained.toFixed(2)} · gateway (passed through):
                      ₹{payout.gatewayCollected.toFixed(2)} · {payout.ordersCount} paid orders. TDS/TCS are to be
                      deposited to the government, not paid to the organizer.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Organizer bank details
                    </p>
                    {payout.bank && payout.bank.accountNumber ? (
                      <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                        <dt className="text-slate-500">A/c name</dt>
                        <dd className="font-medium text-slate-800">{payout.bank.accountName || "—"}</dd>
                        <dt className="text-slate-500">A/c number</dt>
                        <dd className="font-mono text-slate-800">{payout.bank.accountNumber}</dd>
                        <dt className="text-slate-500">IFSC</dt>
                        <dd className="font-mono text-slate-800">{payout.bank.ifsc || "—"}</dd>
                        <dt className="text-slate-500">Bank</dt>
                        <dd className="text-slate-800">{payout.bank.bankName || "—"}</dd>
                      </dl>
                    ) : (
                      <p className="text-slate-400">No bank details on file for this organizer.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

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
                      payments.map((p) => {
                        const statusClass =
                          p.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "REFUNDED"
                              ? "bg-rose-100 text-rose-700"
                              : p.status === "PARTIALLY_REFUNDED"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                        return (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.orderNumber}</td>
                          <td className="px-4 py-3 text-slate-700">{p.name || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.email || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.phone || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{p.quantity}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            ₹{p.totalAmount.toFixed(2)}
                            {p.refundedAmount > 0 ? (
                              <span className="block text-xs font-normal text-rose-600">−₹{p.refundedAmount.toFixed(2)} refunded</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(p.paidAt)}</td>
                        </tr>
                        )
                      })
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

// ─── Admin conversion funnel (numbers + who) ──────────────────────────────

function funnelRate(value: number, base: number): string {
  if (base <= 0) return "—"
  return `${Math.round((value / base) * 100)}%`
}

function actorLabel(a: { fullName: string | null; email: string | null; visitorId: string }) {
  if (a.fullName || a.email) return a.fullName ?? a.email
  return `Guest · ${a.visitorId.slice(0, 8)}`
}

function AdminFunnelCard({ funnel }: { funnel: AdminEventFunnel }) {
  const { stats, viewers, checkouts, buyers } = funnel
  return (
    <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-lg font-bold text-slate-900">Conversion funnel</h2>
      <p className="mb-4 text-xs text-slate-500">
        Unique people at each stage — and exactly who. Page view → reached checkout → bought.
      </p>

      {/* Stage counts */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <FunnelStat label="Visited page" value={stats.views} tone="blue" />
        <FunnelStat
          label="Reached checkout"
          value={stats.checkouts}
          tone="amber"
          sub={`${funnelRate(stats.checkouts, stats.views)} of visitors`}
        />
        <FunnelStat
          label="Bought"
          value={stats.purchases}
          tone="emerald"
          sub={`${funnelRate(stats.purchases, stats.checkouts)} of checkout`}
        />
      </div>

      {/* Who, per stage */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <FunnelPeople title={`Visitors (${viewers.length})`}>
          {viewers.length === 0 ? (
            <EmptyRow />
          ) : (
            viewers.map((v) => (
              <li key={`v-${v.visitorId}`} className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate text-slate-700">{actorLabel(v)}</span>
                {v.email && v.fullName ? <span className="shrink-0 text-[11px] text-slate-400">{v.email}</span> : null}
              </li>
            ))
          )}
        </FunnelPeople>

        <FunnelPeople title={`Reached checkout (${checkouts.length})`}>
          {checkouts.length === 0 ? (
            <EmptyRow />
          ) : (
            checkouts.map((c) => (
              <li key={`c-${c.visitorId}`} className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate text-slate-700">{actorLabel(c)}</span>
                {c.email && c.fullName ? <span className="shrink-0 text-[11px] text-slate-400">{c.email}</span> : null}
              </li>
            ))
          )}
        </FunnelPeople>

        <FunnelPeople title={`Buyers (${buyers.length})`}>
          {buyers.length === 0 ? (
            <EmptyRow />
          ) : (
            buyers.map((b, i) => (
              <li key={`b-${b.userId ?? i}`} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate text-slate-700">
                  {b.fullName ?? b.email ?? "Unknown"}
                  {b.email && b.fullName ? <span className="ml-1 text-[11px] text-slate-400">{b.email}</span> : null}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                  {b.tickets} tkt · ₹{b.amount.toFixed(0)}
                </span>
              </li>
            ))
          )}
        </FunnelPeople>
      </div>
    </div>
  )
}

const FUNNEL_TONES = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const

function FunnelStat({
  label,
  value,
  tone,
  sub,
}: {
  label: string
  value: number
  tone: keyof typeof FUNNEL_TONES
  sub?: string
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 text-center ${FUNNEL_TONES[tone]}`}>
      <p className="text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-0.5 h-3.5 text-[10px] opacity-70">{sub ?? ""}</p>
    </div>
  )
}

function FunnelPeople({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{title}</p>
      <ul className="max-h-56 divide-y divide-slate-50 overflow-y-auto px-3 py-1 text-sm">{children}</ul>
    </div>
  )
}

function EmptyRow() {
  return <li className="py-2 text-xs text-slate-400">No one yet.</li>
}
