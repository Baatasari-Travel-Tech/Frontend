"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import EventPage from "@/components/event-org/EventPage"
import { ProtectedRoute } from "@/components/auth/protected-route"
import type { EventFormData } from "@/components/event-org/data/create-event-data"
import { toEventFormDraft } from "@/components/event-org/manage-events/manage-events"
import { uploadEventCoverImage } from "@/lib/api/uploads"
import { apiRequest } from "@/lib/api/client"
import type { EventDetail } from "@/types/api"

type TicketTierPayload = {
  name: string
  description: string
  quantity: number
  price: number
}

const toNumber = (value: string | number | undefined | null, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeOptionalUrl = (value: string | undefined | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed).toString()
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString()
    } catch {
      return null
    }
  }
}

const parseTime = (value: string | undefined) => {
  if (!value) return { hours: 0, minutes: 0 }

  const twelveHourMatch = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (twelveHourMatch) {
    const rawHours = Number(twelveHourMatch[1] ?? 0)
    const minutes = Number(twelveHourMatch[2] ?? 0)
    const period = (twelveHourMatch[3] ?? "AM").toUpperCase()
    const normalizedHours = rawHours % 12
    return {
      hours: period === "PM" ? normalizedHours + 12 : normalizedHours,
      minutes,
    }
  }

  const twentyFourHourMatch = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourMatch) {
    return {
      hours: Number(twentyFourHourMatch[1] ?? 0),
      minutes: Number(twentyFourHourMatch[2] ?? 0),
    }
  }

  return { hours: 0, minutes: 0 }
}

const combineDateAndTime = (dateText: string, timeText?: string) => {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Event date is invalid. Please choose a valid date.")
  }

  const { hours, minutes } = parseTime(timeText)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

const buildTicketTiers = (formData: EventFormData): TicketTierPayload[] => {
  const fromAudienceCategory = (formData.audienceCategory ?? [])
    .filter((item) => item.category?.trim() && toNumber(item.numberOfTickets, 0) > 0)
    .map((item) => ({
      name: item.category.trim(),
      description: item.description?.trim() || "General access",
      quantity: Math.max(1, toNumber(item.numberOfTickets, 1)),
      price: formData.ticketType === "free" ? 0 : Math.max(0, toNumber(item.price, 0)),
    }))

  if (fromAudienceCategory.length > 0) return fromAudienceCategory

  const fallbackQuantity = Math.max(1, toNumber(formData.ticketQuantity, 1))
  const fallbackPrice =
    formData.ticketType === "free" ? 0 : Math.max(0, toNumber(formData.ticketPrice, 0))

  return [
    {
      name: formData.ticketName?.trim() || "General Admission",
      description: formData.description?.trim() || "General access",
      quantity: fallbackQuantity,
      price: fallbackPrice,
    },
  ]
}

const sanitizeSponsorList = (value: unknown) => {
  const entries = Array.isArray(value) ? value : []
  return entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const record = entry as Record<string, unknown>
      const name = typeof record.name === "string" ? record.name.trim() : ""
      if (!name) return null
      const website = normalizeOptionalUrl(
        typeof record.website === "string" ? record.website : null
      )

      return {
        name,
        website,
      }
    })
    .filter((entry): entry is { name: string; website: string | null } => entry !== null)
}

const normalizeSponsors = (sponsors: EventFormData["sponsors"]) => {
  if (Array.isArray(sponsors)) {
    const titleSponsors = sanitizeSponsorList(
      sponsors.filter((item) => item?.type === "titleSponsors")
    )
    const coPartners = sanitizeSponsorList(
      sponsors.filter((item) => item?.type === "coPartners")
    )
    const mediaPartners = sanitizeSponsorList(
      sponsors.filter((item) => item?.type === "mediaPartners")
    )

    return { titleSponsors, coPartners, mediaPartners }
  }

  return {
    titleSponsors: sanitizeSponsorList(sponsors?.titleSponsors),
    coPartners: sanitizeSponsorList(sponsors?.coPartners),
    mediaPartners: sanitizeSponsorList(sponsors?.mediaPartners),
  }
}

const buildCreateEventPayload = (
  formData: EventFormData
) => {
  const tiers = buildTicketTiers(formData)
  const capacity = tiers.reduce((total, tier) => total + tier.quantity, 0)
  const endDateSource = formData.endDate?.trim() || formData.date

  return {
    title: formData.eventName.trim(),
    description: formData.description.trim(),
    date: combineDateAndTime(formData.date, formData.time),
    endDate: combineDateAndTime(endDateSource, formData.endTime),
    startTime: formData.time || null,
    endTime: formData.endTime || null,
    venue: formData.venue.trim(),
    capacity: Math.max(1, capacity),
    category: formData.category || null,
    tagline: formData.tagline || null,
    googleMapsUrl: normalizeOptionalUrl(formData.googleMapsUrl),
    transportToEvent: formData.transportToEvent || null,
    entrySide: formData.entrySide || null,
    transportOptions: formData.transportOptions || {},
    artists: (formData.artists || [])
      .filter((artist) => artist.name?.trim())
      .map((artist) => ({
        name: artist.name.trim(),
        genre: artist.genre?.trim() || null,
      })),
    sponsors: normalizeSponsors(formData.sponsors),
    requirements: {
      ...(formData.requirements || {}),
      personnel: formData.personnel || "",
    },
    postEventFollowUp: formData.postEventFollowUp || {},
    contactInfo: formData.contactInfo || {},
    audienceRange: formData.audienceRange || { min: 0, max: 100 },
    targetAudience: formData.targetAudience || {},
    addOns: formData.addOns || {},
    discounts: {
      enabled: Boolean(formData.enableOffers),
      ticketType: formData.ticketType,
      refundPolicy: formData.refundPolicy || "",
      discountType: formData.discountType || "",
      discountAmount: toNumber(formData.discountAmount, 0),
      discountCode: formData.discountCode || "",
      couponCode: formData.couponCode || "",
      couponExpiry: formData.couponExpiry || "",
      minOrderValue: toNumber(formData.minOrderValue, 0),
    },
    guidelines: {
      text: formData.guidelines || "",
    },
    published: true,
    ticketTiers: tiers,
  }
}

function CreateEventContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const mode = searchParams.get("mode")
  const eventId = searchParams.get("eventId")
  const action = searchParams.get("action")?.toLowerCase() ?? null
  const startDirectly = mode === "create" || searchParams.get("startDirectly") === "true"
  const isUpdateFlow = Boolean(eventId) && (action === "edit" || action === "reschedule")
  const [isHydratingEvent, setIsHydratingEvent] = useState(() => Boolean(eventId))
  const [prefillError, setPrefillError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const hydrateDraftFromEvent = async () => {
      if (!eventId) {
        setIsHydratingEvent(false)
        setPrefillError(null)
        return
      }

      setIsHydratingEvent(true)
      setPrefillError(null)

      try {
        localStorage.removeItem("eventFormData")
        localStorage.removeItem("eventFormCurrentStep")
        localStorage.removeItem("eventFormOpenSections")

        const response = await apiRequest<{ data: { event: EventDetail } }>(`/organizer/events/${eventId}`, {
          auth: true,
        })

        if (!active) return
        localStorage.setItem("eventFormData", JSON.stringify(toEventFormDraft(response.data.event)))
      } catch (error) {
        if (!active) return
        setPrefillError(error instanceof Error ? error.message : "Unable to load event details.")
      } finally {
        if (active) {
          setIsHydratingEvent(false)
        }
      }
    }

    void hydrateDraftFromEvent()

    return () => {
      active = false
    }
  }, [eventId])

  if (isHydratingEvent) {
    return (
      <div className="w-full rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
        Loading event details...
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {prefillError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {prefillError}
        </p>
      ) : null}

      <EventPage
        isDashboardMode
        startDirectly={startDirectly}
        action={action}
        onSubmit={async (formData) => {
          const payload = buildCreateEventPayload(formData)
          let persistedEventId = eventId ?? ""

          if (isUpdateFlow && eventId) {
            const response = await apiRequest<{ data: { event: EventDetail } }>(`/organizer/events/${eventId}`, {
              method: "PUT",
              auth: true,
              body: JSON.stringify(payload),
            })
            persistedEventId = response.data.event.id
          } else {
            const response = await apiRequest<{ data: { event: EventDetail } }>("/organizer/events", {
              method: "POST",
              auth: true,
              body: JSON.stringify(payload),
            })
            persistedEventId = response.data.event.id
          }

          if (formData.eventPhoto && persistedEventId) {
            await uploadEventCoverImage(persistedEventId, formData.eventPhoto)
          }

          router.push("/organizer/manage-events")
        }}
      />
    </div>
  )
}

export default function CreateEventPage() {
  return (
    <ProtectedRoute requireOrganizer>
      <Suspense fallback={null}>
        <CreateEventContent />
      </Suspense>
    </ProtectedRoute>
  )
}
