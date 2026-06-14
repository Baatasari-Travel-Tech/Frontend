"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Eye, ShoppingCart, TrendingUp } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { apiRequest } from "@/lib/api/client"
import type { EventFunnel } from "@/types/api"

// Views-vs-purchases funnel for one event (J1). Real data from
// GET /organizer/events/:id/funnel — replaces the old mock time-series.
export function ViewsVsPurchases({ eventId }: { eventId?: string }) {
  const { data, isLoading, isError } = useQuery<EventFunnel, Error>({
    queryKey: ["organizer-event-funnel", eventId],
    queryFn: async () => {
      const response = await apiRequest<{ data: { funnel: EventFunnel } }>(
        `/organizer/events/${eventId}/funnel`,
        { auth: true }
      )
      return response.data.funnel
    },
    enabled: Boolean(eventId),
  })

  const chartData = useMemo(
    () =>
      (data?.series ?? []).map((p) => ({
        // "12 Jun" style label
        label: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        views: p.views,
        purchases: p.purchases,
      })),
    [data?.series]
  )

  const conversionPct =
    data && data.totalViews > 0
      ? `${(data.conversionRate * 100).toFixed(1)}%`
      : "—"

  return (
    <Card className="rounded-2xl border-slate-200">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Visitors vs. Purchases
            </h3>
            <p className="text-sm text-slate-500">
              Unique people who viewed this event page and how many bought.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Stat icon={<Eye className="h-4 w-4" />} label="Views" value={data?.totalViews ?? 0} />
            <Stat
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Purchases"
              value={data?.totalPurchases ?? 0}
            />
            <Stat
              icon={<TrendingUp className="h-4 w-4" />}
              label="Conversion"
              value={conversionPct}
              highlight
            />
          </div>
        </div>

        <div className="mt-6 h-72 w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart…
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center text-sm text-rose-500">
              Couldn’t load analytics.
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-slate-600">No views yet</p>
              <p className="text-xs text-slate-400">
                Views appear here once people start visiting your event page.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchasesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#3b82f6"
                  fill="url(#viewsFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="Purchases"
                  stroke="#16a34a"
                  fill="url(#purchasesFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="flex items-center gap-1 text-xs text-slate-400">
        {icon}
        {label}
      </span>
      <span
        className={`text-lg font-semibold ${highlight ? "text-emerald-600" : "text-slate-900"}`}
      >
        {value}
      </span>
    </div>
  )
}
