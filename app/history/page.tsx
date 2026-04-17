"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"
import type { TicketRecord } from "@/types/api"

type HistoryEntry = {
  id: string
  action: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

type TicketActivityItem = {
  entry: HistoryEntry
  ticketId: string
  ticket: TicketRecord | null
}

const resolveTicketId = (entry: HistoryEntry) => {
  const metadataTicketId = entry.metadata?.ticketId
  if (typeof metadataTicketId === "string" && metadataTicketId.trim()) return metadataTicketId

  const metadataOrderId = entry.metadata?.orderId
  if (typeof metadataOrderId === "string" && metadataOrderId.trim()) return metadataOrderId

  return entry.id
}

const toInr = (amount: number, currency: string) => {
  if (currency.toUpperCase() === "INR") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)
  }

  return `${currency.toUpperCase()} ${amount.toFixed(2)}`
}

export default function HistoryPage() {
  const query = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { history: HistoryEntry[] } }>("/user/history", { auth: true })
      return response.data.history
    },
  })

  const bookedEntries = useMemo(
    () => (query.data ?? []).filter((entry) => entry.action === "EVENT_TICKET_PURCHASED"),
    [query.data]
  )

  const ticketQueries = useQueries({
    queries: bookedEntries.map((entry) => {
      const ticketId = resolveTicketId(entry)
      return {
        queryKey: ["activity-ticket", ticketId],
        queryFn: async () => {
          const response = await apiRequest<{ data: { ticket: TicketRecord } }>(`/user/history/${ticketId}`, {
            auth: true,
          })
          return response.data.ticket
        },
      }
    }),
  })

  const bookedTickets = useMemo<TicketActivityItem[]>(() => {
    return bookedEntries.map((entry, index) => ({
      entry,
      ticketId: resolveTicketId(entry),
      ticket: ticketQueries[index]?.data ?? null,
    }))
  }, [bookedEntries, ticketQueries])

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Account activity</p>
          <h1 className="mt-2 font-bricolage text-4xl text-slate-950">Your Booked Events</h1>
          <p className="mt-2 text-sm text-slate-500">Track and open the tickets for events you booked.</p>
        </div>

        <section className="rounded-[1.75rem] border border-white/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Booked Tickets</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {bookedTickets.length} total
            </span>
          </div>

          {query.isLoading ? (
            <p className="text-sm text-slate-500">Loading your bookings...</p>
          ) : bookedTickets.length === 0 ? (
            <p className="text-sm text-slate-500">No booked events yet.</p>
          ) : (
            <div className="grid gap-4">
              {bookedTickets.map((item) => (
                <article
                  key={item.entry.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {item.ticket?.ticketCode ? `Ticket ${item.ticket.ticketCode}` : "Booked Event"}
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {item.ticket?.eventTitle ?? item.entry.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{new Date(item.entry.createdAt).toLocaleString()}</span>
                    {item.ticket ? <span>{item.ticket.quantity} ticket(s)</span> : null}
                    {item.ticket ? <span>{toInr(item.ticket.totalAmount, item.ticket.currency)}</span> : null}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/history/${item.ticketId}`}
                      className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Open ticket
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  )
}
