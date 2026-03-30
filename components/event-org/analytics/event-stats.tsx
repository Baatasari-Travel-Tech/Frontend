"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  DEMOGRAPHICS_DATA,
  DEMOGRAPHICS_CONFIG,
  CANCELLED_VALUE,
} from "../data/analytics-data"

// --- Gauge Arc (Left fill only) ---
function CancelledGauge({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, value))
  const radius = 50
  const startX = 10
  const endX = 110
  const y = 55
  const halfCircle = Math.PI * radius
  const arcLength = (percent / 100) * halfCircle
  const arcPath = `M${startX} ${y} A${radius} ${radius} 0 0 1 ${endX} ${y}`

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 120 60"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="cancelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop
            offset="0%"
            stopColor="var(--color-destructive)"
            stopOpacity="0.7"
          />
          <stop offset="100%" stopColor="var(--color-destructive)" />
        </linearGradient>
      </defs>

      <path
        d={arcPath}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={8}
        strokeLinecap="round"
      />

      <path
        d={arcPath}
        fill="none"
        stroke="url(#cancelGradient)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${halfCircle}`}
        strokeDashoffset={0}
      />
    </svg>
  )
}

export function EventStats() {
  return (
    <div className="w-full">
      <div className="w-full grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader className="items-start pb-2">
            <CardTitle className="text-lg font-medium text-foreground">
              Total number of tickets ➔ {375 + 25}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-center">
            {/* Swapped: Registered Participants title */}
            <div className="mb-4 w-full">
              <span className="text-sm font-semibold text-muted-foreground mr-2">
                Registered Participants
              </span>
            </div>

            <div className="mb-4 flex justify-between w-full text-sm">
              <div>
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Registered
                </span>
                <div className="text-2xl font-bold text-foreground">375</div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Available
                </span>
                <div className="text-2xl font-bold text-foreground">25</div>
              </div>
            </div>

            <div className="flex gap-2 w-full">
              <div
                className="h-4 rounded-full"
                style={{ backgroundColor: "#7c83db", flex: 375 }}
              />
              <div
                className="h-4 rounded-full"
                style={{ backgroundColor: "#a3e635", flex: 25 }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="items-center pb-2 text-center">
            <CardTitle className="text-lg font-medium text-foreground">
              Demographics (M/F/O)
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col items-center justify-center">
            <ChartContainer
              config={DEMOGRAPHICS_CONFIG}
              className="mx-auto max-h-35 w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={DEMOGRAPHICS_DATA}
                  dataKey="visitors"
                  nameKey="type"
                  innerRadius={30}
                  outerRadius={60}
                  strokeWidth={5}
                />
              </PieChart>
            </ChartContainer>

            <div className="flex justify-center gap-4 pt-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded" style={{ backgroundColor: "hsl(210, 90%, 75%)" }}></span> Male
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded" style={{ backgroundColor: "hsl(340, 80%, 75%)" }}></span> Female
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded" style={{ backgroundColor: "hsl(0, 0%, 75%)" }}></span> Other
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="items-center pb-2 text-center">
            <CardTitle className="text-lg font-medium text-foreground">
              Cancelled Tickets
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 items-center justify-center gap-5 text-center">
            <div className="flex justify-center items-center w-full max-w-42.5 h-21.25">
              <CancelledGauge value={CANCELLED_VALUE} />
            </div>

            <span className="text-sm font-semibold whitespace-nowrap text-foreground">
              {CANCELLED_VALUE}% Cancelled
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
