"use client"

import { ChartNoAxesCombined, Sparkles, TrendingUp } from "lucide-react"

const highlights = [
  {
    title: "Revenue Breakdown",
    detail: "Ticket tier trends, conversion rates, and payout snapshots.",
    icon: TrendingUp,
  },
  {
    title: "Audience Insights",
    detail: "Demographics, peak booking windows, and repeat attendee signals.",
    icon: Sparkles,
  },
  {
    title: "Event Performance",
    detail: "Compare engagement and capacity across your active events.",
    icon: ChartNoAxesCombined,
  },
]

export default function AnalyticsPage() {
  return (
    <div className="w-full px-0 sm:px-6 lg:px-8 py-4">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50/80 px-6 py-8 sm:px-8 sm:py-10 shadow-[0_20px_60px_-35px_rgba(12,29,55,0.35)]">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-blue-200/25 blur-3xl" aria-hidden="true" />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-700 uppercase">
            Organizer Analytics
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">Coming Soon</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            We are building a full analytics suite for organizers. Soon, this page will give you clear
            performance insights for every event.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <item.icon className="h-5 w-5 text-slate-700" />
                <h2 className="mt-3 text-sm font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
