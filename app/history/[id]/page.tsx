"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import QRCode from "qrcode"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import type { TicketRecord } from "@/types/api"

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ["ticket-detail", params.id],
    queryFn: async () => {
      const response = await apiRequest<{ data: { ticket: TicketRecord } }>(`/user/history/${params.id}`, {
        auth: true,
      })
      return response.data.ticket
    },
  })

  useEffect(() => {
    if (!query.data?.qrPayload) return
    QRCode.toDataURL(query.data.qrPayload, { width: 200, margin: 2 })
      .then((url) => setQrDataUrl(url))
      .catch(() => undefined)
  }, [query.data?.qrPayload])

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Ticket</p>
          <h1 className="mt-3 font-bricolage text-4xl text-slate-950">
            {query.data?.eventTitle ?? "Loading ticket…"}
          </h1>

          {query.data ? (
            <>
              {qrDataUrl ? (
                <div className="mt-6 flex justify-center">
                  <div className="inline-block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                    <img src={qrDataUrl} alt="Ticket QR code" width={180} height={180} />
                    <p className="mt-2 text-xs text-slate-500">Show this at entry</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ticket code</p>
                  <p className="mt-2 font-mono text-lg font-semibold text-slate-950">{query.data.ticketCode}</p>
                </div>

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
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  )
}
