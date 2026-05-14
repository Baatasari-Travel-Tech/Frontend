import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency } from "@/lib/format"
import type { EventData } from "@/lib/events-data"
import type { EventSummary } from "@/types/api"

export function formatCardDate(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(date))
    .toUpperCase()
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
