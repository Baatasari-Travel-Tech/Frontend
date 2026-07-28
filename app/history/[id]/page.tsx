"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import QRCode from "qrcode"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import type { OrderTicket, TicketRecord } from "@/types/api"

// Routes into the existing (tracked, admin-notified) support-ticket flow
// with the order context already filled in, instead of the buyer retyping
// it or emailing cold. See app/contact-us/page.tsx's `problem` prefill.
const buildCancelRequestHref = (ticket: TicketRecord): string => {
  const lines = [
    "I'd like to request a cancellation/refund for my ticket.",
    "",
    `Event: ${ticket.eventTitle}`,
    `Order ID: ${ticket.orderId}`,
    `Ticket code: ${ticket.ticketCode}`,
    "",
    "Reason: ",
  ]
  return `/contact-us?problem=${encodeURIComponent(lines.join("\n"))}`
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  // ticketId → QR data-url; multi-tier orders carry one entry pass per line.
  const [qrMap, setQrMap] = useState<Record<string, string>>({})

  const query = useQuery({
    queryKey: ["ticket-detail", params.id],
    queryFn: async () => {
      const response = await apiRequest<{ data: { ticket: TicketRecord } }>(`/user/history/${params.id}`, {
        auth: true,
      })
      return response.data.ticket
    },
  })

  // Every ticket on the order; older single-ticket records (no tickets array)
  // fall back to the top-level fields.
  const orderTickets = useMemo<OrderTicket[]>(() => {
    const t = query.data
    if (!t) return []
    if (t.tickets && t.tickets.length > 0) return t.tickets
    return [
      {
        ticketId: t.ticketId,
        tierName: null,
        quantity: t.quantity,
        ticketCode: t.ticketCode,
        qrPayload: t.qrPayload,
        ticketStatus: t.ticketStatus,
      },
    ]
  }, [query.data])

  useEffect(() => {
    let cancelled = false
    const withQr = orderTickets.filter((t) => t.qrPayload)
    if (withQr.length === 0) return
    void Promise.all(
      withQr.map(async (t) => {
        const url = await QRCode.toDataURL(t.qrPayload as string, { width: 200, margin: 2 }).catch(
          () => null,
        )
        return [t.ticketId, url] as const
      }),
    ).then((entries) => {
      if (cancelled) return
      const map: Record<string, string> = {}
      for (const [id, url] of entries) if (url) map[id] = url
      setQrMap(map)
    })
    return () => {
      cancelled = true
    }
  }, [orderTickets])

  const multiPass = orderTickets.length > 1

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">
            {multiPass ? "Tickets" : "Ticket"}
          </p>
          <h1 className="mt-3 font-bricolage text-4xl text-slate-950">
            {query.data?.eventTitle ?? "Loading ticket…"}
          </h1>

          {query.data ? (
            <>
              {/* Entry passes — one QR per ticket type */}
              <div className={`mt-6 grid gap-4 ${multiPass ? "sm:grid-cols-2" : "justify-center"}`}>
                {orderTickets.map((pass) => (
                  <div
                    key={pass.ticketId}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
                  >
                    {qrMap[pass.ticketId] ? (
                      <img
                        src={qrMap[pass.ticketId]}
                        alt={`QR code for ${pass.tierName ?? "ticket"}`}
                        width={180}
                        height={180}
                        className="mx-auto"
                      />
                    ) : (
                      <div className="mx-auto h-[180px] w-[180px] animate-pulse rounded-lg bg-slate-100" />
                    )}
                    {multiPass ? (
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {pass.tierName ?? "Ticket"} · Admits {pass.quantity}
                      </p>
                    ) : null}
                    <p className="mt-1 font-mono text-xs font-semibold text-slate-700">{pass.ticketCode}</p>
                    <p className="mt-1 text-xs text-slate-500">Show this at entry</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {multiPass ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tickets</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {orderTickets.map((p) => `${p.quantity} × ${p.tierName ?? "Ticket"}`).join(" · ")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ticket code</p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-950">{query.data.ticketCode}</p>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                  <p
                    className={`mt-2 text-lg font-semibold ${
                      query.data.ticketStatus === "ACTIVE" ? "text-emerald-600" : "text-slate-950"
                    }`}
                  >
                    {query.data.ticketStatus}
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Event date</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{formatDate(query.data.eventDate)}</p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Venue</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.venue}</p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attendee</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.attendeeName}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{query.data.attendeeEmail}</p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quantity</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.quantity}</p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Amount paid</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {query.data.totalAmount === 0
                      ? "Free"
                      : formatCurrency(query.data.totalAmount, query.data.currency)}
                  </p>
                </div>

                {query.data.paidAt ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid on</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{formatDateTime(query.data.paidAt)}</p>
                  </div>
                ) : null}
              </div>

              {query.data.ticketStatus === "ACTIVE" ? (
                <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                  <Link
                    href={buildCancelRequestHref(query.data)}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Cancel ticket
                  </Link>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  )
}
