import type { Metadata } from "next"
import { StateBlock } from "@/components/platform/state-block"
import type { EventDetail } from "@/types/api"
import EventDetailClient from "./event-detail-client"

async function fetchEvent(id: string): Promise<EventDetail | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/events/${id}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { event?: EventDetail } }
    return json.data?.event ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const event = await fetchEvent(id)
  if (!event) return { title: "Event Not Found" }
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? "Event details",
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? "Event details",
    },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await fetchEvent(id)

  if (!event) {
    return (
      <main className="page-x py-10">
        <StateBlock
          tone="error"
          title="Event unavailable"
          description="This event could not be loaded. It may have been unpublished or the request failed."
        />
      </main>
    )
  }

  return <EventDetailClient event={event} />
}
