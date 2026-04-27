"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { formatCurrency } from "@/lib/format"
import type { EventDetail } from "@/types/api"

interface GradientCursorProps {
  points?: { x: number }[]
  height?: number
}

type Period = "weekly" | "monthly" | "yearly"

type ChartPoint = {
  label: string
  revenue: number
  tickets: number
}

type AnalyticsChartProps = {
  events?: EventDetail[]
  isLoading?: boolean
  errorMessage?: string | null
}

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const formatDayKey = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getEventRevenueAndTickets = (event: EventDetail) => {
  return (event.ticketTiers ?? []).reduce(
    (acc, tier) => {
      const soldCount = Number(tier.soldCount ?? 0)
      const price = Number(tier.price ?? 0)
      return {
        tickets: acc.tickets + (Number.isFinite(soldCount) ? soldCount : 0),
        revenue: acc.revenue + (Number.isFinite(price) ? soldCount * price : 0),
      }
    },
    { tickets: 0, revenue: 0 }
  )
}

const buildWeeklyData = (events: EventDetail[]): ChartPoint[] => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const formatter = new Intl.DateTimeFormat("en-IN", { weekday: "short" })

  const buckets = new Map<string, ChartPoint>()
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now)
    date.setDate(now.getDate() - offset)
    const key = formatDayKey(date)
    buckets.set(key, {
      label: formatter.format(date),
      revenue: 0,
      tickets: 0,
    })
  }

  for (const event of events) {
    const eventDate = new Date(event.date)
    if (Number.isNaN(eventDate.getTime())) continue

    const key = formatDayKey(eventDate)
    const bucket = buckets.get(key)
    if (!bucket) continue

    const totals = getEventRevenueAndTickets(event)
    bucket.revenue += totals.revenue
    bucket.tickets += totals.tickets
  }

  return Array.from(buckets.values())
}

const buildMonthlyData = (events: EventDetail[]): ChartPoint[] => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat("en-IN", { month: "short" })

  const buckets = new Map<string, ChartPoint>()
  for (let offset = 11; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`
    buckets.set(key, {
      label: formatter.format(monthDate),
      revenue: 0,
      tickets: 0,
    })
  }

  for (const event of events) {
    const eventDate = new Date(event.date)
    if (Number.isNaN(eventDate.getTime())) continue

    const key = `${eventDate.getFullYear()}-${eventDate.getMonth() + 1}`
    const bucket = buckets.get(key)
    if (!bucket) continue

    const totals = getEventRevenueAndTickets(event)
    bucket.revenue += totals.revenue
    bucket.tickets += totals.tickets
  }

  return Array.from(buckets.values())
}

const buildYearlyData = (events: EventDetail[]): ChartPoint[] => {
  const currentYear = new Date().getFullYear()

  const buckets = new Map<string, ChartPoint>()
  for (let offset = 4; offset >= 0; offset -= 1) {
    const year = currentYear - offset
    const key = `${year}`
    buckets.set(key, {
      label: key,
      revenue: 0,
      tickets: 0,
    })
  }

  for (const event of events) {
    const eventDate = new Date(event.date)
    if (Number.isNaN(eventDate.getTime())) continue

    const key = `${eventDate.getFullYear()}`
    const bucket = buckets.get(key)
    if (!bucket) continue

    const totals = getEventRevenueAndTickets(event)
    bucket.revenue += totals.revenue
    bucket.tickets += totals.tickets
  }

  return Array.from(buckets.values())
}

const buildChartData = (events: EventDetail[], period: Period): ChartPoint[] => {
  if (period === "weekly") return buildWeeklyData(events)
  if (period === "yearly") return buildYearlyData(events)
  return buildMonthlyData(events)
}

const GradientCursor = ({ points, height }: GradientCursorProps) => {
  if (!points || !points.length || height === undefined) return null

  const x = points[0].x
  const barWidth = 36
  const barHeight = 120
  const barRadius = 14
  const y = height - barHeight - 12

  return (
    <g>
      <defs>
        <linearGradient id="hoverGradient" x1="0" y1="1" x2="0" y2="0">
          <stop
            offset="0%"
            stopColor="var(--color-primary)"
            stopOpacity="0.18"
          />
          <stop
            offset="50%"
            stopColor="var(--color-primary)"
            stopOpacity="0.10"
          />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect
        x={x - barWidth / 2}
        y={y}
        width={barWidth}
        height={barHeight}
        rx={barRadius}
        fill="url(#hoverGradient)"
      />
    </g>
  )
}

export function AnalyticsChart({
  events = [],
  isLoading = false,
  errorMessage = null,
}: AnalyticsChartProps) {
  const [metric, setMetric] = useState<"revenue" | "tickets">("revenue")
  const [period, setPeriod] = useState<Period>("monthly")

  const data = useMemo(() => buildChartData(events, period), [events, period])
  const hasAnyActivity = data.some((point) => point.revenue > 0 || point.tickets > 0)
  const dataKey = metric

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="analytics-header">
          <h2 className="analytics-title ">Insights & Analytics</h2>

          <div className="analytics-controls">
            <Button
              variant={metric === "tickets" ? "default" : "outline"}
              size="sm"
              className={`rounded-full px-4 h-8 transition-colors border ${metric === "tickets"
                ? "bg-blue-soft text-white border-blue-soft"
                : "bg-transparent text-blue-soft border-foreground"
                }`}
              onClick={() => setMetric("tickets")}
            >
              Tickets
            </Button>

            <Button
              variant={metric === "revenue" ? "default" : "outline"}
              size="sm"
              className={`rounded-full px-4 h-8 transition-colors border ${metric === "revenue"
                ? "bg-blue-soft text-white border-blue-soft"
                : "bg-transparent text-blue-soft border-foreground"
                }`}
              onClick={() => setMetric("revenue")}
            >
              Revenue
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-dropdown-trigger"
                >
                  {period} <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="bg-muted border-border">
                {(["weekly", "monthly", "yearly"] as Period[]).map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => setPeriod(option)}
                    className="dropdown-item-custom"
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500 mt-4">Loading chart data...</p>
        ) : errorMessage ? (
          <p className="text-sm text-rose-600 mt-4">{errorMessage}</p>
        ) : (
          <>
            {!hasAnyActivity ? (
              <p className="text-sm text-slate-500 mt-3">
                Ticket and revenue activity will appear here once your events start receiving bookings.
              </p>
            ) : null}

            <div className="chart-wrapper">
              <div className="chart-area">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.2} />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      tick={{
                        fill: "var(--color-muted-foreground)",
                        fontSize: 12,
                      }}
                      dy={10}
                      label={{
                        value:
                          period === "yearly"
                            ? "Timeline (Years)"
                            : period === "weekly"
                              ? "Timeline (Days)"
                              : "Timeline (Months)",
                        position: "insideBottom",
                        offset: -10,
                        fill: "var(--color-muted-foreground)",
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "var(--color-muted-foreground)",
                        fontSize: 12,
                      }}
                      dx={-10}
                      tickFormatter={(value) =>
                        metric === "revenue"
                          ? compactNumberFormatter.format(Number(value))
                          : `${Number(value)}`
                      }
                      label={{
                        value: metric === "revenue" ? "Revenue (INR)" : "Tickets Sold",
                        angle: -90,
                        position: "insideLeft",
                        offset: -15,
                        fill: "var(--color-muted-foreground)",
                        fontSize: 12,
                      }}
                    />

                    <Tooltip
                      cursor={<GradientCursor />}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const value = Number(payload[0].value ?? 0)
                          const displayValue =
                            metric === "revenue" ? formatCurrency(value) : `${value} tickets`

                          return (
                            <div className="chart-tooltip">
                              <p className="chart-tooltip-label">{label}</p>
                              <p className="chart-tooltip-value">{displayValue}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey={dataKey}
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: "var(--color-primary)",
                        stroke: "var(--color-background)",
                        strokeWidth: 2,
                      }}
                      isAnimationActive
                      animationDuration={1200}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
