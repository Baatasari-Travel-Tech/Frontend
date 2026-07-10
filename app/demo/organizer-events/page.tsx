"use client"

/**
 * DEMO — redesigned Manage Events page with dummy data.
 * Preview at /demo/organizer-events. After approval this layout replaces the
 * real /organizer/manage-events content.
 */

import { useMemo, useState } from "react"
import Image from "next/image"
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Gift,
  Pencil,
  Play,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"
import { DemoOrganizerShell } from "../_components/demo-shell"

// ─── Demo data ──────────────────────────────────────────────────────────────

type DemoEvent = {
  id: string
  code: string
  name: string
  date: string
  dateSub: string
  category: string
  categoryCls: string
  status: "Upcoming" | "Past" | "Cancelled"
  registered: number
  capacity: number
}

const EVENTS: DemoEvent[] = [
  { id: "1", code: "EV-2026-0012", name: "TEDx GITAM", date: "6 Sept 2026", dateSub: "Sat, 10:00 AM – 05:00 PM", category: "Conference", categoryCls: "bg-violet-100 text-violet-700", status: "Upcoming", registered: 156, capacity: 500 },
  { id: "2", code: "EV-2026-0011", name: "Echoes of Tomorrow", date: "20 Sept 2026", dateSub: "Sun, 06:00 PM – 10:00 PM", category: "Music", categoryCls: "bg-rose-100 text-rose-600", status: "Upcoming", registered: 342, capacity: 800 },
  { id: "3", code: "EV-2026-0010", name: "CodeSprint 3.0", date: "4 Oct 2026", dateSub: "Sat, 09:00 AM – 06:00 PM", category: "Workshop", categoryCls: "bg-purple-100 text-purple-700", status: "Upcoming", registered: 87, capacity: 300 },
  { id: "4", code: "EV-2026-0009", name: "Vizag Food Festival", date: "15 Aug 2026", dateSub: "Fri, 04:00 PM – 10:00 PM", category: "Festival", categoryCls: "bg-red-100 text-red-600", status: "Past", registered: 1250, capacity: 1500 },
  { id: "5", code: "EV-2026-0008", name: "Startup Connect", date: "12 July 2026", dateSub: "Sun, 10:00 AM – 02:00 PM", category: "Networking", categoryCls: "bg-teal-100 text-teal-700", status: "Past", registered: 210, capacity: 250 },
  { id: "6", code: "EV-2026-0007", name: "Nrityotsav 2026", date: "5 May 2026", dateSub: "Tue, 05:00 PM – 09:00 PM", category: "Cultural", categoryCls: "bg-amber-100 text-amber-700", status: "Past", registered: 620, capacity: 800 },
]

const UPCOMING_CAROUSEL = [
  {
    name: "TEDx GITAM",
    date: "6 Sept 2026",
    day: "Saturday",
    time: "10:00 AM – 05:00 PM",
    venue: "Main Auditorium, GITAM University",
    highlights: ["Inspiring Talks", "Networking", "Live Performances"],
    more: 2,
    registered: 156,
    capacity: 500,
    addOns: 12,
    dateChange: 2,
  },
  {
    name: "Echoes of Tomorrow",
    date: "20 Sept 2026",
    day: "Sunday",
    time: "06:00 PM – 10:00 PM",
    venue: "RK Beach Grounds, Visakhapatnam",
    highlights: ["Indie bands", "Food street"],
    more: 1,
    registered: 342,
    capacity: 800,
    addOns: 4,
    dateChange: 0,
  },
  {
    name: "CodeSprint 3.0",
    date: "4 Oct 2026",
    day: "Sunday",
    time: "09:00 AM – 06:00 PM",
    venue: "GITAM Innovation Hub",
    highlights: ["48h hackathon", "₹1L prizes"],
    more: 0,
    registered: 87,
    capacity: 300,
    addOns: 2,
    dateChange: 1,
  },
  {
    name: "Winter Arts Fair",
    date: "12 Dec 2026",
    day: "Saturday",
    time: "11:00 AM – 08:00 PM",
    venue: "Beach Road Promenade",
    highlights: ["Craft stalls", "Live murals"],
    more: 0,
    registered: 0,
    capacity: 600,
    addOns: 0,
    dateChange: 0,
  },
]

type Tab = "All Events" | "Upcoming" | "Past" | "Cancelled"

const pctCls = (pct: number, status: DemoEvent["status"]) =>
  status === "Past" ? "bg-emerald-500" : "bg-blue-500"

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DemoOrganizerEvents() {
  const [slide, setSlide] = useState(0)
  const [tab, setTab] = useState<Tab>("All Events")
  const [query, setQuery] = useState("")
  const [dateAsc, setDateAsc] = useState(false)

  const upcoming = UPCOMING_CAROUSEL[slide]
  const upcomingPct = Math.round((upcoming.registered / upcoming.capacity) * 100)

  const counts = {
    Upcoming: EVENTS.filter((e) => e.status === "Upcoming").length,
    Past: EVENTS.filter((e) => e.status === "Past").length,
    Cancelled: EVENTS.filter((e) => e.status === "Cancelled").length,
  }

  const rows = useMemo(() => {
    let list = [...EVENTS]
    if (tab !== "All Events") list = list.filter((e) => e.status === tab)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return dateAsc ? da - db : db - da
    })
    return list
  }, [tab, query, dateAsc])

  return (
    <DemoOrganizerShell active="events">
      {/* Heading */}
      <h1 className="font-bricolage text-2xl font-bold text-slate-900 sm:text-3xl">Manage Events</h1>
      <p className="mt-1 text-sm text-slate-500">Create, manage and track all your events in one place.</p>

      {/* ── Stat strip ── */}
      <div className="mt-6 grid grid-cols-2 gap-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:grid-cols-4 sm:divide-x sm:divide-slate-100 sm:p-5">
        {[
          { label: "Total Events", value: "12", sub: "All time", icon: CalendarDays, cls: "bg-sky-100 text-sky-600" },
          { label: "Upcoming", value: "4", sub: "Scheduled events", icon: TrendingUp, cls: "bg-emerald-100 text-emerald-600" },
          { label: "Past", value: "8", sub: "Completed events", icon: Play, cls: "bg-orange-100 text-orange-500" },
        ].map(({ label, value, sub, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-3 sm:px-4 sm:first:pl-0 sm:last:pr-0">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className="text-xl font-bold tabular-nums text-slate-900">{value}</p>
              <p className="text-[11px] text-slate-400">{sub}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 sm:px-4 sm:last:pr-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Zap className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900">Everything in one place</p>
            <p className="text-[11px] leading-snug text-slate-400">
              Track registrations, engagement and more for every event you host.
            </p>
          </div>
        </div>
      </div>

      {/* ── Upcoming event carousel ── */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">Upcoming Event</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous event"
              onClick={() => setSlide((s) => (s - 1 + UPCOMING_CAROUSEL.length) % UPCOMING_CAROUSEL.length)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5">
              {UPCOMING_CAROUSEL.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to event ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === slide ? "w-4 bg-slate-800" : "w-2 bg-slate-300"}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Next event"
              onClick={() => setSlide((s) => (s + 1) % UPCOMING_CAROUSEL.length)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="flex gap-4 sm:gap-5">
            <div className="relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-xl sm:w-36">
              <Image src="/event.jpeg" alt={upcoming.name} fill sizes="(min-width: 640px) 144px, 96px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                Upcoming
              </span>
              <h3 className="mt-2 font-bricolage text-xl font-bold text-slate-900 sm:text-2xl">{upcoming.name}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  {upcoming.date}, {upcoming.day}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  {upcoming.time}
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-500">{upcoming.venue}</span>
              </div>
              <p className="mt-4 hidden text-xs font-semibold text-slate-500 sm:block">Event Highlights</p>
              <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
                {upcoming.highlights.map((h) => (
                  <span key={h} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    {h}
                  </span>
                ))}
                {upcoming.more > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                    +{upcoming.more} more
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200/80">
            <div className="border-b border-r border-slate-200/80 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Users className="h-3.5 w-3.5 text-violet-500" /> Registrations
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                {upcoming.registered} / {upcoming.capacity}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${upcomingPct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Tickets booked <span className="float-right tabular-nums">{upcomingPct}%</span>
              </p>
            </div>
            <div className="border-b border-slate-200/80 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Gift className="h-3.5 w-3.5 text-emerald-500" /> Add-ons
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{upcoming.addOns}</p>
              <p className="mt-1 text-[11px] text-slate-400">Total sold</p>
            </div>
            <div className="border-r border-slate-200/80 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CalendarClock className="h-3.5 w-3.5 text-amber-500" /> Date Change Requests
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{upcoming.dateChange}</p>
              <p className="mt-1 text-[11px] text-slate-400">Pending</p>
            </div>
            <div className="p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> Progress
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{upcomingPct}%</p>
              <p className="mt-1 text-[11px] text-slate-400">Tickets booked</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button type="button" className="inline-flex items-center gap-2 rounded-full bg-(--brand-navy) px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-(--brand-navy)/90 active:scale-[0.98]">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 active:scale-[0.98]">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 active:scale-[0.98]">
            <CalendarClock className="h-4 w-4" /> Reschedule
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 active:scale-[0.98]">
            <Trash2 className="h-4 w-4" /> Cancel Event
          </button>
        </div>
      </div>

      {/* ── All events table ── */}
      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">All Events</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events..."
                className="w-44 rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 sm:w-56"
              />
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
              <CalendarDays className="h-4 w-4" /> <span className="hidden sm:inline">Calendar View</span>
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
              <Filter className="h-4 w-4" /> <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ["All Events", EVENTS.length],
              ["Upcoming", counts.Upcoming],
              ["Past", counts.Past],
              ["Cancelled", counts.Cancelled],
            ] as [Tab, number][]
          ).map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                tab === name
                  ? "bg-(--brand-navy) text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
            >
              {name}
              {name !== "All Events" ? (
                <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === name ? "bg-white/20" : "bg-slate-100"}`}>
                  {count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="pb-3 pr-4 font-bold">Event Name</th>
                <th className="pb-3 pr-4 font-bold">
                  <button type="button" onClick={() => setDateAsc((v) => !v)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-600">
                    Date <ChevronDown className={`h-3 w-3 transition-transform ${dateAsc ? "rotate-180" : ""}`} />
                  </button>
                </th>
                <th className="pb-3 pr-4 font-bold">Category</th>
                <th className="hidden pb-3 pr-4 font-bold lg:table-cell">Status</th>
                <th className="pb-3 pr-4 font-bold">Registrations</th>
                <th className="pb-3 font-bold">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => {
                const pct = Math.round((event.registered / event.capacity) * 100)
                return (
                  <tr key={event.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative aspect-[2/3] w-9 shrink-0 overflow-hidden rounded-md">
                          <Image src="/event.jpeg" alt="" fill sizes="36px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{event.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {event.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{event.date}</p>
                      <p className="text-[11px] text-slate-400">{event.dateSub}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${event.categoryCls}`}>
                        {event.category}
                      </span>
                    </td>
                    <td className="hidden py-3 pr-4 lg:table-cell">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          event.status === "Upcoming"
                            ? "bg-emerald-100 text-emerald-700"
                            : event.status === "Past"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-semibold tabular-nums text-slate-900">
                        {event.registered.toLocaleString("en-IN")} / {event.capacity.toLocaleString("en-IN")}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className={`h-full rounded-full ${pctCls(pct, event.status)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-slate-400">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400">
                        <Pencil className="h-3 w-3" /> <span className="hidden sm:inline">Edit</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    No events match your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p className="text-xs">Showing 1 to {rows.length} of 12 events</p>
          <div className="flex items-center gap-1.5">
            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400" disabled>
              <ChevronLeft className="h-3 w-3" /> Previous
            </button>
            <button type="button" className="h-8 w-8 rounded-full bg-(--brand-navy) text-xs font-bold text-white">1</button>
            <button type="button" className="h-8 w-8 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-slate-400">2</button>
            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400">
              Next <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400">
            Rows per page: 10 <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </DemoOrganizerShell>
  )
}
