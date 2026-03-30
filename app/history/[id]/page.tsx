"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"
import type { TicketRecord } from "@/types/api"

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const query = useQuery({
    queryKey: ["ticket-detail", params.id],
    queryFn: async () => {
      const response = await apiRequest<{ data: { ticket: TicketRecord } }>(`/user/history/${params.id}`, {
        auth: true,
      })
      return response.data.ticket
    },
  })

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Ticket details</p>
          <h1 className="mt-3 font-bricolage text-4xl text-slate-950">{query.data?.eventTitle ?? "Loading ticket…"}</h1>
          {query.data ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ticket code</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.ticketCode}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quantity</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.quantity}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Venue</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{query.data.venue}</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Paid amount</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {query.data.currency} {query.data.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  )
}
