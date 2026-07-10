"use client"

/**
 * DEMO — redesigned per-event analytics page with dummy data.
 * Preview at /demo/organizer-analytics. After approval this layout replaces
 * the real organizer event analytics page.
 */

import { useState } from "react"
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
  ArrowLeft,
  Bookmark,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Gift,
  HandHeart,
  IndianRupee,
  MapPin,
  MessageCircle,
  MonitorX,
  Pencil,
  ScanLine,
  Share2,
  Star,
  Ticket,
  Timer,
  Users,
} from "lucide-react"
import { DemoOrganizerShell } from "../_components/demo-shell"

// ─── Demo data ──────────────────────────────────────────────────────────────

const EVENT = {
  title: "TEDx GITAM",
  live: true,
  date: "6 Sept 2026",
  day: "Saturday",
  startTime: "10:00 AM",
  endTime: "05:00 PM",
  venue: "Main Auditorium, GITAM University",
  capacity: 2365,
  registered: 0,
}

const REVENUE_SERIES = [
  { day: "29 Aug", value: 0 },
  { day: "1 Sep", value: 0 },
  { day: "2 Sep", value: 20 },
  { day: "3 Sep", value: 60 },
  { day: "4 Sep", value: 140 },
  { day: "5 Sep", value: 380 },
  { day: "6 Sep", value: 620 },
]

// July 2026: the 1st is a Wednesday; 31 days. Amber = days with date-change requests.
const CALENDAR_WEEKS: (number | null)[][] = [
  [null, null, 1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24, 25, 26],
  [27, 28, 29, 30, 31, null, null],
]
const REQUESTED_DAYS = new Set([18, 19])

// Small ring used for the "% booked" radials.
function BookedRing({ pct, dark = false }: { pct: number; dark?: boolean }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className={dark ? "stroke-white/20" : "stroke-slate-200"} />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          className={dark ? "stroke-white" : "stroke-emerald-500"}
        />
      </svg>
      <span className={`absolute text-[11px] font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>
        {pct}%
      </span>
    </span>
  )
}

function CardTitle({ icon: Icon, iconCls, children }: { icon: React.ElementType; iconCls: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-sm font-bold text-slate-900 sm:text-base">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconCls}`}>
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </p>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DemoOrganizerAnalytics() {
  const [series, setSeries] = useState<"revenue" | "tickets">("revenue")
  const [revenueTab, setRevenueTab] = useState<"tickets" | "addons">("tickets")
  const bookedPct = Math.round((EVENT.registered / EVENT.capacity) * 100)
  const available = EVENT.capacity - EVENT.registered

  return (
    <DemoOrganizerShell active="events">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-bricolage text-xl font-bold text-slate-900 sm:text-2xl">{EVENT.title}</h1>
          {EVENT.live ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              Live
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-(--brand-navy) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--brand-navy)/90"
          >
            <Pencil className="h-4 w-4" /> Edit Event
          </button>
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-4 sm:p-5">
        {[
          { icon: CalendarDays, label: "Date", value: EVENT.date, sub: EVENT.day },
          { icon: Clock, label: "Time", value: EVENT.startTime, sub: EVENT.endTime },
          { icon: MapPin, label: "Venue", value: "Main Auditorium,", sub: "GITAM University" },
          { icon: Users, label: "Total Capacity", value: EVENT.capacity.toLocaleString("en-IN"), sub: "" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="flex items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-(--gold-icon)" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400">{label}</p>
              <p className="truncate text-sm font-bold text-slate-900">{value}</p>
              {sub ? <p className="truncate text-xs font-medium text-slate-600">{sub}</p> : null}
            </div>
          </div>
        ))}
      </div>

      {/* ── Ticket registrations ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle icon={Ticket} iconCls="bg-amber-100 text-amber-600">Ticket Registrations</CardTitle>
          <p className="text-xs text-slate-400">Total capacity: {EVENT.capacity.toLocaleString("en-IN")}</p>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Registered</p>
            <p className="text-3xl font-bold tabular-nums text-slate-900">{EVENT.registered}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Available</p>
            <p className="text-3xl font-bold tabular-nums text-emerald-600">{available.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-500">
          <div className="h-full rounded-full bg-emerald-700" style={{ width: `${bookedPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-400">{bookedPct}% booked</p>
      </div>

      {/* ── Visitors vs purchases ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle icon={Eye} iconCls="bg-sky-100 text-sky-600">Visitors vs. Purchases</CardTitle>
            <p className="mt-1.5 text-xs text-slate-400 sm:ml-[42px]">
              Unique people who viewed this event page and how many bought.
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Views <b className="tabular-nums text-slate-900">0</b></span>
            <span className="inline-flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5" /> Purchases <b className="tabular-nums text-slate-900">0</b></span>
            <span className="inline-flex items-center gap-1.5">Conversion <b className="text-slate-900">—</b></span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { value: 0, label: "Visited page", cls: "border-sky-100 bg-sky-50 text-sky-700" },
            { value: 0, label: "Reached checkout", cls: "border-amber-100 bg-amber-50 text-amber-700" },
            { value: 0, label: "Bought", cls: "border-emerald-100 bg-emerald-50 text-emerald-700" },
          ].map(({ value, label, cls }) => (
            <div key={label} className={`rounded-xl border p-4 text-center ${cls}`}>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em]">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pb-2 text-center">
          <MonitorX className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-500">No views yet</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Views appear here once people start visiting your event page.
          </p>
        </div>
      </div>

      {/* ── Revenue ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle icon={IndianRupee} iconCls="bg-amber-100 text-amber-600">Revenue</CardTitle>
            <p className="mt-1.5 text-sm font-semibold text-slate-700 sm:ml-[42px]">Total Revenue: ₹0</p>
          </div>
          <div className="flex rounded-full border border-slate-200 bg-slate-50 p-1">
            {(["revenue", "tickets"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSeries(key)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                  series === key ? "bg-(--brand-navy) text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket / add-ons revenue tabs */}
        <div className="mt-4 flex gap-6 border-b border-slate-100 text-sm font-semibold">
          {(
            [
              ["tickets", "Ticket Revenue"],
              ["addons", "Add-Ons Revenue"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRevenueTab(key)}
              className={`-mb-px border-b-2 pb-2.5 transition ${
                revenueTab === key
                  ? "border-(--brand-navy) text-(--brand-navy)"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              ₹0 <span className="text-sm font-semibold text-emerald-600">↑</span>
            </p>
            <p className="text-xs text-slate-400">
              {revenueTab === "tickets" ? "Ticket Revenue" : "Add-Ons Revenue"}
            </p>
          </div>
          <BookedRing pct={bookedPct} />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            {series === "revenue" ? "Revenue over time" : "Tickets over time"}
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400"
          >
            Daily <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-2 h-52 w-full sm:h-60">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="demo-analytics-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={6} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v: number) => (series === "revenue" ? `₹${v}` : String(v))}
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
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#demo-analytics-fill)"
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mini stat tiles */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex items-center justify-center rounded-2xl bg-[#0b1020] p-4">
            <div className="text-center">
              <BookedRing pct={bookedPct} dark />
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Booked</p>
            </div>
          </div>
          {[
            { label: "Add-Ons", value: "0", icon: Gift },
            { label: "Sponsors", value: "0", icon: HandHeart },
            { label: "Last-Minute tickets", value: "0", icon: Timer },
            { label: "Early Birds", value: "0", icon: Bookmark },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200/80 p-4 text-center">
              <Icon className="mx-auto h-5 w-5 text-slate-400" />
              <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">{value}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-tight text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Date change requests + reviews ── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <CardTitle icon={CalendarDays} iconCls="bg-amber-100 text-amber-600">Date Change Requests</CardTitle>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-700">
            <button type="button" aria-label="Previous month" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4" />
            </button>
            July 2026
            <button type="button" aria-label="Next month" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <table className="mt-3 w-full table-fixed text-center text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <th key={d} className="pb-2 font-bold">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CALENDAR_WEEKS.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => (
                    <td key={di} className="py-1.5">
                      {day === null ? (
                        <span className="text-slate-300">·</span>
                      ) : (
                        <span
                          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full tabular-nums ${
                            REQUESTED_DAYS.has(day)
                              ? "bg-amber-100 font-bold text-amber-700"
                              : "text-slate-700"
                          }`}
                        >
                          {day}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <CardTitle icon={Star} iconCls="bg-amber-100 text-amber-600">Customer Reviews</CardTitle>
          <div className="flex h-[calc(100%-3rem)] min-h-48 flex-col items-center justify-center py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200">
              <MessageCircle className="h-5 w-5 text-slate-400" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-500">No reviews yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Reviews will appear here once attendees submit them.
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <CardTitle icon={ScanLine} iconCls="bg-amber-100 text-amber-600">Quick Actions</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-(--brand-navy)/40 hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-(--brand-navy)" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Scan tickets at the door</span>
                <span className="block text-xs text-slate-500">Open scanner to validate attendee tickets</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-(--brand-navy)/40 hover:bg-slate-50"
          >
            <span className="flex items-center gap-3">
              <Download className="h-5 w-5 text-(--brand-navy)" />
              <span>
                <span className="block text-sm font-bold text-slate-900">Export Attendees CSV</span>
                <span className="block text-xs text-slate-500">Download all registered attendees</span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </DemoOrganizerShell>
  )
}
