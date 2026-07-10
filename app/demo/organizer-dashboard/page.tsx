"use client"

/**
 * DEMO — redesigned organizer dashboard (content area only; the real sidebar
 * and navbar stay as-is). Preview at /demo/organizer-dashboard with dummy
 * data. After approval this layout replaces the organizer dashboard content.
 */

import { useState } from "react"
import Image from "next/image"
import { DemoOrganizerShell } from "../_components/demo-shell"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  CalendarDays,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Gift,
  IndianRupee,
  Pencil,
  Play,
  RotateCcw,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react"

// ─── Demo data ──────────────────────────────────────────────────────────────

const STATS = [
  { label: "Total Events", value: "12", sub: "All time", icon: CalendarDays, iconCls: "bg-violet-100 text-violet-600" },
  { label: "Upcoming", value: "4", sub: "Scheduled", icon: TrendingUp, iconCls: "bg-emerald-100 text-emerald-600" },
  { label: "Past Events", value: "8", sub: "Completed", icon: Play, iconCls: "bg-orange-100 text-orange-500" },
  { label: "Total Capacity", value: "2,365", sub: "Across all events", icon: Users, iconCls: "bg-amber-100 text-amber-600" },
]

const UPCOMING = {
  title: "TEDx GITAM",
  date: "6 Sept 2026, Saturday",
  time: "10:00 AM – 05:00 PM",
  category: "Conference",
  cover: "/event.jpeg",
  highlights: ["Inspiring Talks", "Networking", "Live Performances"],
  moreHighlights: 2,
  registered: 156,
  capacity: 500,
  addOnsSold: 12,
  dateChangeRequests: 2,
}

const REVENUE_SERIES = [
  { month: "Feb", value: 0 },
  { month: "Mar", value: 400 },
  { month: "Apr", value: 2400 },
  { month: "May", value: 1900 },
  { month: "Jun", value: 2800 },
  { month: "Jul", value: 7400 },
]

const TICKETS_SERIES = [
  { month: "Feb", value: 0 },
  { month: "Mar", value: 6 },
  { month: "Apr", value: 32 },
  { month: "May", value: 24 },
  { month: "Jun", value: 41 },
  { month: "Jul", value: 96 },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DemoOrganizerDashboard() {
  const [series, setSeries] = useState<"tickets" | "revenue">("revenue")
  const bookedPct = Math.round((UPCOMING.registered / UPCOMING.capacity) * 100)
  const chartData = series === "revenue" ? REVENUE_SERIES : TICKETS_SERIES

  return (
    <DemoOrganizerShell active="dashboard">
      <div className="w-full">
        {/* Greeting */}
        <h1 className="font-bricolage text-2xl font-bold text-slate-900 sm:text-3xl">
          Hello Mahesh! <span aria-hidden>👋</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track, update, and grow your events the smart way.
        </p>

        {/* ── Stat cards ── */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {STATS.map(({ label, value, sub, icon: Icon, iconCls }) => (
            <div
              key={label}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:p-5"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="hidden text-xs font-medium text-slate-500 sm:block">{label}</p>
                <p className="text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{value}</p>
                <p className="text-xs font-medium text-slate-500 sm:hidden">{label}</p>
                <p className="text-[11px] text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Upcoming event ── */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Upcoming Event</h2>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-slate-900"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            {/* Left: poster + identity */}
            <div className="flex gap-4 sm:gap-5">
              <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl sm:w-36">
                <Image
                  src={UPCOMING.cover}
                  alt={UPCOMING.title}
                  fill
                  sizes="(min-width: 640px) 144px, 96px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  Upcoming
                </span>
                <h3 className="mt-2 font-bricolage text-xl font-bold text-slate-900 sm:text-2xl">
                  {UPCOMING.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    {UPCOMING.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    {UPCOMING.time}
                  </span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    {UPCOMING.category}
                  </span>
                </div>

                <p className="mt-4 hidden text-xs font-semibold text-slate-500 sm:block">Event Highlights</p>
                <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
                  {UPCOMING.highlights.map((h, i) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {i === 0 ? <Sparkles className="h-3 w-3 text-amber-500" /> : i === 1 ? <Users className="h-3 w-3 text-slate-400" /> : <Play className="h-3 w-3 text-slate-400" />}
                      {h}
                    </span>
                  ))}
                  {UPCOMING.moreHighlights > 0 ? (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      +{UPCOMING.moreHighlights} more
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Right: mini-stats 2×2 */}
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200/80">
              <div className="border-b border-r border-slate-200/80 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Users className="h-3.5 w-3.5 text-violet-500" /> Registrations
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {UPCOMING.registered} / {UPCOMING.capacity}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${bookedPct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Tickets booked <span className="float-right tabular-nums">{bookedPct}%</span>
                </p>
              </div>
              <div className="border-b border-slate-200/80 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Gift className="h-3.5 w-3.5 text-emerald-500" /> Add-ons
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{UPCOMING.addOnsSold}</p>
                <p className="mt-1 text-[11px] text-slate-400">Total sold</p>
              </div>
              <div className="border-r border-slate-200/80 p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5 text-amber-500" /> Date Change Requests
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{UPCOMING.dateChangeRequests}</p>
                <p className="mt-1 text-[11px] text-slate-400">Pending</p>
              </div>
              <div className="p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Progress
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{bookedPct}%</p>
                <p className="mt-1 text-[11px] text-slate-400">Tickets booked</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-(--brand-navy) px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-(--brand-navy)/90 active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" /> Edit Event
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 active:scale-[0.98]"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 active:scale-[0.98]"
            >
              <CalendarClock className="h-4 w-4" /> Reschedule
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" /> Cancel Event
            </button>
          </div>
        </div>

        {/* ── Insights & analytics ── */}
        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">Insights &amp; Analytics</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setSeries("tickets")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    series === "tickets" ? "bg-(--brand-navy) text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Tickets
                </button>
                <button
                  type="button"
                  onClick={() => setSeries("revenue")}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    series === "revenue" ? "bg-(--brand-navy) text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Revenue
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
              >
                Monthly <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
            {/* Stats */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/80 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <IndianRupee className="h-4 w-4" />
                  </span>
                  <p className="mt-2.5 text-xs font-medium text-slate-500">Total Revenue</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900">₹0</p>
                  <p className="text-[11px] text-slate-400">From paid orders</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <p className="mt-2.5 text-xs font-medium text-slate-500">This Month</p>
                  <p className="text-xl font-bold tabular-nums text-slate-900">
                    ₹0 <span className="text-xs font-semibold text-emerald-600">↑ 0%</span>
                  </p>
                  <p className="text-[11px] text-slate-400">vs last month</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Avg. Order Value", value: "₹0", icon: ShoppingCart, cls: "bg-sky-100 text-sky-600" },
                  { label: "Total Orders", value: "0", icon: ShoppingBag, cls: "bg-amber-100 text-amber-600" },
                  { label: "Refunded Amount", value: "₹0", icon: RotateCcw, cls: "bg-rose-100 text-rose-500" },
                ].map(({ label, value, icon: Icon, cls }) => (
                  <div key={label} className="rounded-xl border border-slate-200/80 p-3.5">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${cls}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-2 text-[11px] font-medium leading-tight text-slate-500">{label}</p>
                    <p className="text-lg font-bold tabular-nums text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400">0% vs last month</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">
                {series === "revenue" ? "Revenue over time" : "Tickets over time"}
              </p>
              <div className="mt-2 h-56 w-full sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="demo-dash-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      dy={6}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(v: number) =>
                        series === "revenue" ? (v === 0 ? "₹0" : `₹${Math.round(v / 1000)}K`) : String(v)
                      }
                      width={44}
                    />
                    <Tooltip
                      formatter={(value: number | string) => [
                        series === "revenue" ? `₹${Number(value).toLocaleString("en-IN")}` : value,
                        series === "revenue" ? "Revenue" : "Tickets",
                      ]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#demo-dash-fill)"
                      dot={{ r: 3.5, fill: "#7c3aed", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Data will appear once your events start receiving bookings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DemoOrganizerShell>
  )
}
