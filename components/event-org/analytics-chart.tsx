"use client"

import { useState } from "react"
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
import { CHART_DATA } from "./data/dashboard-data"

interface GradientCursorProps {
  points?: { x: number }[]
  height?: number
}

const GradientCursor = ({ points, height }: GradientCursorProps) => {
  if (!points || !points.length || height === undefined) return null

  const x = points[0].x

  const BAR_WIDTH = 36
  const BAR_HEIGHT = 120
  const BAR_RADIUS = 14

  const y = height - BAR_HEIGHT - 12

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
        x={x - BAR_WIDTH / 2}
        y={y}
        width={BAR_WIDTH}
        height={BAR_HEIGHT}
        rx={BAR_RADIUS}
        fill="url(#hoverGradient)"
      />
    </g>
  )
}

export function AnalyticsChart() {
  const [metric, setMetric] = useState("revenue")
  const [period, setPeriod] = useState("monthly")

  const getChartData = () => {
    switch (period) {
      case "weekly":
        return CHART_DATA.weekly
      case "yearly":
        return CHART_DATA.yearly
      default:
        return CHART_DATA.monthly
    }
  }

  const data = getChartData()
  const dataKey = metric === "tickets" ? "tickets" : "revenue"
  const labelKey = "label"

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
                {["weekly", "monthly", "yearly"].map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="dropdown-item-custom"
                  >
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="chart-wrapper">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.2} />

                <XAxis
                  dataKey={labelKey}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tick={{
                    fill: "var(--color-muted-foreground)",
                    fontSize: 12,
                  }}
                  dy={10}
                  label={{
                    value: period === "yearly" ? "Timeline (Months)" : period === "weekly" ? "Timeline (Days)" : "Timeline (Weeks)",
                    position: 'insideBottom',
                    offset: -10,
                    fill: "var(--color-muted-foreground)",
                    fontSize: 12
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
                  tickFormatter={(val) => metric === "revenue" ? `₹${val}` : val}
                  label={{
                    value: metric === "revenue" ? "Revenue (₹)" : "Registrations",
                    angle: -90,
                    position: 'insideLeft',
                    offset: -15,
                    fill: "var(--color-muted-foreground)",
                    fontSize: 12
                  }}
                />

                <Tooltip
                  cursor={<GradientCursor />}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number
                      const displayVal =
                        metric === "revenue" ? `₹${val * 1000}` : val.toString()

                      return (
                        <div className="chart-tooltip">
                          <p className="chart-tooltip-label">{label}</p>
                          <p className="chart-tooltip-value">{displayVal}</p>
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
      </CardContent>
    </Card>
  )
}
