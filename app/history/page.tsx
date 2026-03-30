"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { apiRequest } from "@/lib/api/client"

type HistoryEntry = {
  id: string
  action: string
  description: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

export default function HistoryPage() {
  const query = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await apiRequest<{ data: { history: HistoryEntry[] } }>("/user/history", { auth: true })
      return response.data.history
    },
  })

  return (
    <ProtectedRoute>
      <main className="page-x py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Account activity</p>
          <h1 className="mt-2 font-bricolage text-4xl text-slate-950">History</h1>
        </div>

        <div className="grid gap-4">
          {query.data?.map((entry) => {
            const ticketId = (entry.metadata?.ticketId as string | undefined) ?? entry.id
            return (
              <Link
                key={entry.id}
                href={entry.action === "EVENT_TICKET_PURCHASED" ? `/history/${ticketId}` : "#"}
                className="rounded-[1.75rem] border border-white/60 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{entry.action.replaceAll("_", " ")}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{entry.description}</p>
                <p className="mt-2 text-sm text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
              </Link>
            )
          })}
        </div>
      </main>
    </ProtectedRoute>
  )
}
