"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock3, Lightbulb, MapPin, Users } from "lucide-react"
import type { SuggestedEventSummary } from "@/types/api"

type SuggestedEventCardProps = {
  event: SuggestedEventSummary
  actionLabel: string
  actionDisabled?: boolean
  actionLoading?: boolean
  onAction: () => void
}

const formatSupportDeadline = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

export function SuggestedEventCard({
  event,
  actionLabel,
  actionDisabled = false,
  actionLoading = false,
  onAction,
}: SuggestedEventCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden bg-linear-to-br from-brand-900 via-brand-800 to-sky-700 px-6 py-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)]" />
        <div className="relative flex flex-wrap items-center gap-2">
          <Badge className="rounded-full border-0 bg-white/18 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white hover:bg-white/18">
            {event.category}
          </Badge>
          <Badge className="rounded-full border-0 bg-white/12 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/12">
            {event.month}
          </Badge>
          {event.isCreator ? (
            <Badge className="rounded-full border-0 bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-amber-300">
              Your idea
            </Badge>
          ) : null}
        </div>

        <div className="relative mt-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/14 p-3">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-white/75">Suggested by {event.creatorName}</p>
              <h3 className="mt-1 text-2xl font-semibold leading-tight">{event.title}</h3>
            </div>
          </div>

          <p className="line-clamp-4 text-sm leading-6 text-white/85">{event.description}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 py-5">
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
            <MapPin className="h-4 w-4 text-brand-800" />
            <span className="truncate">{event.location}</span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
            <Users className="h-4 w-4 text-brand-800" />
            <span>
              {event.interestCount} {event.interestCount === 1 ? "person is" : "people are"} interested
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
            <CalendarDays className="h-4 w-4 text-brand-800" />
            <span>Support goal: 3 people in 15 days</span>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3">
            <Clock3 className="h-4 w-4 text-brand-800" />
            <span>Valid until {formatSupportDeadline(event.supportDeadline)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Live support</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{event.interestCount}/3 supporters</p>
          </div>

          <Button
            type="button"
            onClick={onAction}
            disabled={actionDisabled || actionLoading}
            className="rounded-full bg-brand-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {actionLoading ? "Saving..." : actionLabel}
          </Button>
        </div>
      </div>
    </article>
  )
}
