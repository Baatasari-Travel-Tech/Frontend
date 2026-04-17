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

const ATTENDED_STATUSES = new Set(["USED", "ATTENDED", "CHECKED_IN", "CHECKED-IN", "COMPLETED"])

const resolveTicketId = (entry: HistoryEntry) => {
  const metadataTicketId = entry.metadata?.ticketId
  return typeof metadataTicketId === "string" && metadataTicketId.trim()
    ? metadataTicketId
    : entry.id
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

  const attendedTickets = useMemo(
    () =>
      bookedTickets.filter((item) => {
        const status = item.ticket?.ticketStatus?.toUpperCase()
        return Boolean(status && ATTENDED_STATUSES.has(status))
      }),
    [bookedTickets]
  )

  const isTicketLoading = ticketQueries.some((ticketQuery) => ticketQuery.isLoading)

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Account activity</p>
          <h1 className="mt-2 font-bricolage text-4xl text-slate-950">Your Activity</h1>
          <p className="mt-2 text-sm text-slate-500">Track the events you booked and the ones you have attended.</p>
        </div>

        <div className="grid gap-8">
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
                  <Link
                    key={item.entry.id}
                    href={`/history/${item.ticketId}`}
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
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-white/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-900">Attended Events</h2>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {attendedTickets.length} attended
              </span>
            </div>

            {isTicketLoading ? (
              <p className="text-sm text-slate-500">Checking attendance status...</p>
            ) : attendedTickets.length === 0 ? (
              <p className="text-sm text-slate-500">No attended events yet.</p>
            ) : (
              <div className="grid gap-4">
                {attendedTickets.map((item) => (
                  <Link
                    key={`attended-${item.entry.id}`}
                    href={`/history/${item.ticketId}`}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 transition hover:border-emerald-200"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Attended</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{item.ticket?.eventTitle ?? "Event"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      {item.ticket?.eventDate ? (
                        <span>
                          {new Date(item.ticket.eventDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : null}
                      <span>{item.ticket?.ticketStatus ?? "Attended"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  )
}
