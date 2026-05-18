import type { Metadata } from "next"
import { StateBlock } from "@/components/platform/state-block"
import type { EventDetail } from "@/types/api"
import CheckoutClient from "./checkout-client"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your booking",
}

async function fetchEvent(id: string): Promise<EventDetail | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
    const res = await fetch(`${base}/api/v1/events/${id}`, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { event?: EventDetail } }
    return json.data?.event ?? null
  } catch {
    return null
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const { eventId } = await searchParams

  if (!eventId) {
    return (
      <main className="page-x py-20">
        <StateBlock
          tone="error"
          title="No event selected"
          description="Pick an event before continuing to checkout."
        />
      </main>
    )
  }

  const event = await fetchEvent(eventId)

  if (!event) {
    return (
      <main className="page-x py-20">
        <StateBlock
          tone="error"
          title="Event unavailable"
          description="This event could not be loaded. It may have been unpublished or the request failed."
        />
      </main>
    )
  }

  return <CheckoutClient event={event} />
}
