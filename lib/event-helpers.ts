import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency } from "@/lib/format"
import type { EventData, EventStatus } from "@/lib/events-data"
import type { EventSummary } from "@/types/api"

const startOfDay = (iso: string): number => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function computeEventStatus(
  event: Pick<EventSummary, "date" | "endDate" | "ticketTierCount">
): EventStatus {
  const today = startOfDay(new Date().toISOString())
  const start = startOfDay(event.date)
  if (!Number.isNaN(start)) {
    const end = event.endDate ? startOfDay(event.endDate) : start
    if (today > end) return "past"
  }
  return (event.ticketTierCount ?? 0) > 0 ? "live" : "upcoming"
}

export type EventPhase = "ongoing" | "upcoming" | "recent" | "hidden"

const endOfDayMs = (iso: string): number => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

const RECENTLY_COMPLETED_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

// Classifies an event for the events list: ongoing/upcoming events show first,
// events that finished within the last 2 days show below, and anything older
// is hidden. `sort` is the timestamp to order within a phase.
export function getEventPhase(
  event: Pick<EventSummary, "date" | "endDate">
): { phase: EventPhase; sort: number } {
  const now = Date.now()
  const startMs = new Date(event.date).getTime()
  const endMs = endOfDayMs(event.endDate ?? event.date)

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { phase: "upcoming", sort: Number.isNaN(startMs) ? now : startMs }
  }

  if (now <= endMs) {
    return { phase: startMs <= now ? "ongoing" : "upcoming", sort: startMs }
  }

  if (now - endMs <= RECENTLY_COMPLETED_WINDOW_MS) {
    return { phase: "recent", sort: endMs }
  }

  return { phase: "hidden", sort: endMs }
}

// True once an event has fully finished (now past the end of its last day).
// Mirrors getEventPhase's cutoff — used to block checkout for past events.
export function isEventPast(
  event: Pick<EventSummary, "date" | "endDate">
): boolean {
  const endMs = endOfDayMs(event.endDate ?? event.date)
  if (Number.isNaN(endMs)) return false
  return Date.now() > endMs
}

export function formatCardDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date))
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function asSponsorNames(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : []
  return entries
    .map((entry) => {
      const sponsor = asRecord(entry)
      return typeof sponsor.name === "string" ? sponsor.name.trim() : ""
    })
    .filter(Boolean)
}

export function toEventCardData(event: EventSummary): EventData {
  const lowestPrice = event.startingPrice ?? 0
  const readablePrice =
    lowestPrice === 0 ? "Free" : formatCurrency(lowestPrice).replace(/[^\d.,-]+/, "INR ")
  const routeId = event.slug ?? event.id
  const sponsors = asRecord(event.sponsors)
  const sponsorNames = [
    ...asSponsorNames(sponsors.titleSponsors),
    ...asSponsorNames(sponsors.coPartners),
    ...asSponsorNames(sponsors.mediaPartners),
  ]
  const requirements = asRecord(event.requirements)
  const requirementHighlights = Array.isArray(requirements.highlights)
    ? requirements.highlights
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : []
  const artistHighlights = (event.artists ?? []).map((artist) => artist.name).filter(Boolean)
  const highlights = [...new Set([event.tagline ?? "", ...requirementHighlights, ...artistHighlights])]
    .filter(Boolean)
    .slice(0, 3)

  return {
    id: routeId,
    title: event.title,
    price: readablePrice,
    numericPrice: lowestPrice,
    category: event.category ?? "Live Event",
    image: getEventCoverImageUrl(event.id, event.updatedAt),
    date: formatCardDate(event.date),
    location: event.venue,
    bookedCount: event.bookedCount ?? 0,
    tag: event.tagline ?? "Live Experience",
    chiefGuest: event.artists?.[0]?.name || undefined,
    sponsors: sponsorNames[0] || undefined,
    eventTime: "All ages welcome",
    status: computeEventStatus(event),
    cancelled: Boolean(event.cancelledAt),
    highlights:
      highlights.length > 0
        ? highlights
        : [event.tagline ?? "Curated event experience", event.venue, event.category ?? "Live Event"],
  }
}

export async function fetchPublicEvents(): Promise<{ events: EventSummary[]; error: boolean }> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/events`, { next: { revalidate: 60 } })
    if (!res.ok) return { events: [], error: true }
    const json = (await res.json()) as { data?: { events?: EventSummary[] } }
    return { events: json.data?.events ?? [], error: false }
  } catch {
    return { events: [], error: true }
  }
}
