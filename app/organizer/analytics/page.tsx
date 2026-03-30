"use client"

import { useQuery } from "@tanstack/react-query"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard, StatGrid } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"

type AnalyticsResponse = {
  totalEvents: number
  totalCapacity: number
  nextEventDate: string | null
  paidOrders: number
  grossRevenue: number
}

export default function OrganizerAnalyticsPage() {
  const query = useQuery({
    queryKey: ["organizer-analytics"],
    queryFn: async () => {
      const response = await apiRequest<{ data: AnalyticsResponse }>("/organizer/analytics", { auth: true })
      return response.data
    },
  })

  return (
    <ProtectedRoute requireOrganizer>
      <PageShell
        eyebrow="Organizer analytics"
        title="Read the health of your event business"
        description="This page translates organizer analytics into a clearer operational summary for revenue and planning."
      >
        {query.isLoading ? (
          <SkeletonGrid />
        ) : query.isError || !query.data ? (
          <StateBlock tone="error" title="Analytics unavailable" description="The organizer analytics request failed." />
        ) : (
          <>
            <StatGrid
              items={[
                { label: "Revenue", value: formatCurrency(query.data.grossRevenue), hint: "Gross ticket revenue." },
                { label: "Paid orders", value: String(query.data.paidOrders), hint: "Completed ticket purchases." },
                { label: "Events", value: String(query.data.totalEvents), hint: "Published organizer events." },
                { label: "Capacity", value: String(query.data.totalCapacity), hint: "Seats available across events." },
              ]}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="Operational takeaways">
                <div className="grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Revenue is derived from verified event orders only, so the value aligns with completed checkout state.
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    {query.data.nextEventDate
                      ? `Your next scheduled event is ${formatDate(query.data.nextEventDate)}.`
                      : "No next event date is currently available in analytics."}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Backend-aligned notes">
                <div className="grid gap-3 text-sm leading-6 text-slate-600">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Organizer mode depends on `x-active-role` without changing the stored database role.
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                    Approval and email verification remain enforced ahead of this route, so analytics never rely on frontend-only truth.
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        )}
      </PageShell>
    </ProtectedRoute>
  )
}
