"use client"

import { useRouter } from "next/navigation"
import EventPage from "@/components/event-org/EventPage"
import { ProtectedRoute } from "@/components/auth/protected-route"
import type { EventFormData } from "@/components/event-org/data/create-event-data"
import { uploadFile } from "@/lib/api/uploads"
import { apiRequest } from "@/lib/api/client"

type TicketTierPayload = {
  name: string
  description: string
  quantity: number
  price: number
}

function toNumber(value: string | number | undefined | null, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseTime12Hour(value: string | undefined) {
  if (!value) return { hours: 0, minutes: 0 }
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return { hours: 0, minutes: 0 }

  const rawHours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? 0)
  const period = (match[3] ?? "AM").toUpperCase()

  const hours12 = rawHours % 12
  const hours = period === "PM" ? hours12 + 12 : hours12

  return { hours, minutes }
}

function combineDateAndTime(dateText: string, timeText?: string) {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()

  const { hours, minutes } = parseTime12Hour(timeText)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

function buildTicketTiers(formData: EventFormData): TicketTierPayload[] {
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
  const fallbackPrice = formData.ticketType === "free" ? 0 : Math.max(0, toNumber(formData.ticketPrice, 0))

  return [
    {
      name: formData.ticketName?.trim() || "General Admission",
      description: formData.description?.trim() || "General access",
      quantity: fallbackQuantity,
      price: fallbackPrice,
    },
  ]
}

function buildCreateEventPayload(formData: EventFormData, heroImage?: { secureUrl: string; publicId: string }) {
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
    googleMapsUrl: formData.googleMapsUrl || null,
    transportToEvent: formData.transportToEvent || null,
    entrySide: formData.entrySide || null,
    transportOptions: formData.transportOptions || {},
    artists: (formData.artists || [])
      .filter((artist) => artist.name?.trim())
      .map((artist) => ({
        name: artist.name.trim(),
        genre: artist.genre?.trim() || null,
      })),
    sponsors: formData.sponsors || {
      titleSponsors: [],
      coPartners: [],
      mediaPartners: [],
    },
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
    heroImageUrl: heroImage?.secureUrl ?? null,
    heroImagePublicId: heroImage?.publicId ?? null,
    published: true,
    ticketTiers: tiers,
  }
}

export default function OrganizerCreateEventPage() {
  const router = useRouter()

  return (
    <ProtectedRoute requireOrganizer>
      <EventPage
        isDashboardMode
        startDirectly
        onSubmit={async (formData) => {
          let heroImage: { secureUrl: string; publicId: string } | undefined

          if (formData.eventPhoto) {
            heroImage = await uploadFile(formData.eventPhoto, "eventAsset")
          }

          const payload = buildCreateEventPayload(formData, heroImage)

          await apiRequest("/organizer/events", {
            method: "POST",
            auth: true,
            body: JSON.stringify(payload),
          })

          router.push("/organizer/manage-events")
        }}
      />
    </ProtectedRoute>
  )
}
