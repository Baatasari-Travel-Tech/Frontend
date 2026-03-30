"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts"
import { ArrowUp, ShoppingBag, Users, Clock, BookmarkCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  REVENUE_BY_DATE_DATA,
  TICKETS_BY_DATE_DATA,
  REVENUE_CHART_CONFIG,
  RADIAL_DATA
} from "../data/analytics-data"

// Prevent hydration mismatch
function ClientOnlyPieChart({ radialData }: { radialData: { name: string; value: number; fill?: string }[] }) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div className="h-22.5 w-22.5 rounded-full border-4 border-muted" />
  }

  return (
    <PieChart width={90} height={90}>
      <Pie
        data={radialData}
        cx={40}
        cy={40}
        innerRadius={32}
        outerRadius={40}
        startAngle={90}
        endAngle={-270}
        dataKey="value"
        stroke="none"
      >
        <Cell key="cell-0" fill="var(--upcoming-primary-800)" />
        <Cell key="cell-1" fill="#FFFFFF" />
      </Pie>
    </PieChart>
  )
}

import { ChartConfig } from "@/components/ui/chart"

interface AnalyticsChartBlockProps {
  amount: string
  label: string
  data: Record<string, string | number>[]
  dataKey: string
  config: ChartConfig
}

const AnalyticsChartBlock = ({
  amount,
  label,
  data,
  dataKey,
  config,
}: AnalyticsChartBlockProps) => (
  <div className="overflow-x-auto scrollbar-hide pb-2">
    <div className="relative h-80 w-full rounded-2xl bg-muted/10 p-4 border border-border/50">
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold">{amount}</span>
          <div className="rounded-full border border-(--blue-200) bg-white p-0.5">
            <ArrowUp className="h-4 w-4 text-(--blue-500)" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
      </div>

      <ChartContainer config={config} className="h-full w-full">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 40, bottom: 10 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={4} interval={4} />
          <YAxis hide domain={[0, "auto"]} />
          <CartesianGrid vertical horizontal={false} strokeDasharray="4 4" strokeOpacity={0.2} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <Area
            dataKey={dataKey}
            type="natural"
            fill="var(--upcoming-primary-800)"
            fillOpacity={1}
            stroke="var(--upcoming-primary-800)"
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  </div>
)

export function RevenueStats() {
  const [viewMode, setViewMode] = React.useState<"revenue" | "tickets">("revenue")
  const [revenueTab, setRevenueTab] = React.useState("total")
  const [ticketsTab, setTicketsTab] = React.useState("vip")

  const revenueTabs = [
    { value: "total", label: "Ticket Revenue" },
    { value: "addons", label: "Add-Ons Revenue" },
  ]

  const ticketTabs = [
    { value: "vip", label: "Vip" },
    { value: "regular", label: "Regular" },
    { value: "child", label: "Child" },
    { value: "family", label: "Family" },
  ]

  const currentSubTab = viewMode === "revenue" ? revenueTab : ticketsTab
  const setCurrentSubTab = viewMode === "revenue" ? setRevenueTab : setTicketsTab
  const subTabs = viewMode === "revenue" ? revenueTabs : ticketTabs

  // Chart data/config based on current selection
  const chartProps = viewMode === "revenue"
    ? revenueTab === "total"
      ? { amount: "₹165,000", label: "Ticket Revenue", data: REVENUE_BY_DATE_DATA, dataKey: "revenue", config: REVENUE_CHART_CONFIG }
      : { amount: "₹18,500", label: "Add-Ons Revenue", data: REVENUE_BY_DATE_DATA, dataKey: "addOns", config: REVENUE_CHART_CONFIG }
    : ticketsTab === "vip"
      ? { amount: "150", label: "VIP Tickets", data: TICKETS_BY_DATE_DATA, dataKey: "vip", config: REVENUE_CHART_CONFIG }
      : ticketsTab === "regular"
        ? { amount: "850", label: "Regular Tickets", data: TICKETS_BY_DATE_DATA, dataKey: "regular", config: REVENUE_CHART_CONFIG }
        : ticketsTab === "child"
          ? { amount: "100", label: "Child Tickets", data: TICKETS_BY_DATE_DATA, dataKey: "child", config: REVENUE_CHART_CONFIG }
          : { amount: "50", label: "Family Tickets", data: TICKETS_BY_DATE_DATA, dataKey: "family", config: REVENUE_CHART_CONFIG }

  return (
    <Card className="w-full">
      <CardHeader className="pb-0 flex flex-row justify-between items-center mt-2">
        <div>
          <CardTitle className="text-xl font-semibold mb-0">
            {viewMode === "revenue" ? "Revenue" : "Tickets"}
          </CardTitle>
          {viewMode === "revenue" && (
            <p className="text-lg font-bold mt-1" style={{ color: "var(--upcoming-primary-800)" }}>
              Total Revenue: ₹183,500
            </p>
          )}
        </div>
        <div className="flex bg-muted/50 p-1 rounded-full">
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === "revenue"
              ? "bg-white text-black shadow-sm"
              : "text-muted-foreground"
              }`}
            onClick={() => setViewMode("revenue")}
          >
            Revenue
          </button>
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${viewMode === "tickets"
              ? "bg-white text-black shadow-sm"
              : "text-muted-foreground"
              }`}
            onClick={() => setViewMode("tickets")}
          >
            Tickets
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Sub-category tabs - text-only highlight */}
        <div className="flex gap-4 sm:gap-6 border-b border-border mt-4 mb-6">
          {subTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCurrentSubTab(tab.value)}
              className={`pb-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${currentSubTab === tab.value
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart - always visible */}
        <AnalyticsChartBlock {...chartProps} />

        {/* Bottom Cards (shared) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          <Card className="bg-(--zinc-950) text-white border-none flex flex-col items-center justify-center p-4 shadow-lg">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <ClientOnlyPieChart radialData={RADIAL_DATA} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">79%</span>
                <span className="text-[10px] text-(--zinc-400)">Booked</span>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4 border-none shadow-sm bg-(--zinc-50)">
            <ShoppingBag className="h-6 w-6 text-(--blue-600) mb-2" />
            <span className="text-2xl font-bold">43</span>
            <span className="text-xs font-semibold text-muted-foreground">Add-Ons</span>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4 border-none shadow-sm bg-(--zinc-50)">
            <Users className="h-6 w-6 text-(--blue-600) mb-2" />
            <span className="text-2xl font-bold">4</span>
            <span className="text-xs font-semibold text-muted-foreground">Sponsors</span>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4 border-none shadow-sm bg-(--zinc-50)">
            <Clock className="h-6 w-6 text-(--blue-600) mb-2" />
            <span className="text-2xl font-bold">234</span>
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Last-Minute tickets
            </span>
          </Card>

          <Card className="flex flex-col items-center justify-center p-4 border-none shadow-sm bg-(--zinc-50)">
            <BookmarkCheck className="h-6 w-6 text-(--blue-600) mb-2" />
            <span className="text-2xl font-bold">75%</span>
            <span className="text-xs font-semibold text-muted-foreground">Early Birds</span>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
