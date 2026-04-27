import type { EventFormData } from "@/components/event-org/data/create-event-data"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency } from "@/lib/format"
import type { EventDetail } from "@/types/api"

export type ManageEventStatus = "Upcoming" | "Ongoing" | "Past"

export type AnalyticsEventData = {
  eventName: string
  date: string
  category: string
  status: ManageEventStatus
}

export type UpcomingManageEvent = {
  id: string
  slug: string | null
  title: string
  date: string
  timeRange: string
  type: string
  venue: string
  aboutTitle: string
  aboutDescription: string
  highlightsTitle: string
  highlights: string[]
  posterImage: string
  stats: {
    registrations: string
    revenue: string
    addOns: string
    dateChange: string
  }
  formData: Partial<EventFormData>
  analyticsData: AnalyticsEventData
}

export type AllManageEvent = {
  id: string
  slug: string | null
  date: string
  name: string
  category: string
  status: ManageEventStatus
  action: "Edit" | "Repeat"
  formData: Partial<EventFormData>
  analyticsData: AnalyticsEventData
}

const DEFAULT_TRANSPORT_OPTIONS = {
  publicTransport: false,
  ownVehicles: false,
  thirdPartyApp: false,
  localPrivateTransport: false,
}

const DEFAULT_ADD_ONS = {
  freebies: false,
  giftHampers: false,
  merchandise: false,
  addOther: false,
  giftHampersDescription: "",
  addOtherDescription: "",
}

const DEFAULT_CONTACT_INFO = {
  mobile: "",
  email: "",
  website: "",
  additionalLinks: "",
}

const DEFAULT_SPONSOR_ENTRY = { name: "", website: "" }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {})

const asString = (value: unknown): string => (typeof value === "string" ? value : "")

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const asBoolean = (value: unknown): boolean => value === true

const asArray = <T = unknown>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

const formatTableDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))

const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))

const toDateInput = (value?: string | null) => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toISOString().slice(0, 10)
}

const formatTimeRange = (startTime: string | null, endTime: string | null) => {
  if (startTime && endTime) return `${startTime} - ${endTime}`
  if (startTime) return `${startTime} onwards`
  if (endTime) return `Until ${endTime}`
  return "Time to be announced"
}

const getStatusFromDate = (value: string): ManageEventStatus => {
  const eventDate = new Date(value)
  if (Number.isNaN(eventDate.getTime())) return "Upcoming"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventDay = new Date(eventDate)
  eventDay.setHours(0, 0, 0, 0)

  if (eventDay.getTime() > today.getTime()) return "Upcoming"
  if (eventDay.getTime() < today.getTime()) return "Past"
  return "Ongoing"
}

const sanitizeSponsorList = (value: unknown) => {
  const sponsors = asArray(value)
    .map((entry) => {
      const sponsor = asRecord(entry)
      const name = asString(sponsor.name).trim()
      if (!name) return null
      return {
        name,
        website: asString(sponsor.website).trim(),
      }
    })
    .filter((entry): entry is { name: string; website: string } => entry !== null)

  return sponsors.length > 0 ? sponsors : [{ ...DEFAULT_SPONSOR_ENTRY }]
}

const toEventFormDraft = (event: EventDetail): Partial<EventFormData> => {
  const requirements = asRecord(event.requirements)
  const contactInfo = asRecord(event.contactInfo)
  const audienceRange = asRecord(event.audienceRange)
  const targetAudience = asRecord(event.targetAudience)
  const addOns = asRecord(event.addOns)
  const transportOptions = asRecord(event.transportOptions)
  const discounts = asRecord(event.discounts)
  const guidelines = asRecord(event.guidelines)
  const sponsors = asRecord(event.sponsors)
  const postEventFollowUp = asRecord(event.postEventFollowUp)

  const parsedArtists = asArray(event.artists)
    .map((artist) => {
      const artistRecord = asRecord(artist)
      const name = asString(artistRecord.name).trim()
      if (!name) return null
      return {
        name,
        genre: asString(artistRecord.genre).trim(),
      }
    })
    .filter((artist): artist is { name: string; genre: string } => artist !== null)

  const tiers = event.ticketTiers ?? []
  const hasPaidTier = tiers.some((tier) => Number(tier.price) > 0)
  const totalTicketQuantity = tiers.reduce((sum, tier) => sum + Number(tier.quantity || 0), 0)

  const audienceCategory =
    tiers.length > 0
      ? tiers.map((tier) => ({
          category: tier.name,
          numberOfTickets: String(tier.quantity),
          price: String(tier.price),
          description: tier.description ?? "",
        }))
      : [{ category: "", numberOfTickets: "", price: "", description: "" }]

  const stallsPrices = asArray(requirements.stallsPrices)
    .map((stall) => {
      const stallRecord = asRecord(stall)
      const stallType = asString(stallRecord.stallType).trim()
      const stallPrice = asString(stallRecord.stallPrice).trim()
      if (!stallType && !stallPrice) return null
      return { stallType, stallPrice }
    })
    .filter((stall): stall is { stallType: string; stallPrice: string } => stall !== null)

  const parsedTargetAudience = Object.fromEntries(
    Object.entries(targetAudience).map(([key, value]) => [key, asBoolean(value)])
  )

  return {
    eventName: event.title,
    category: event.category ?? "",
    tagline: event.tagline ?? "",
    description: event.description ?? "",
    personnel: asString(requirements.personnel),
    date: toDateInput(event.date),
    endDate: toDateInput(event.endDate),
    time: event.startTime ?? "",
    endTime: event.endTime ?? "",
    venue: event.venue ?? "",
    googleMapsUrl: event.googleMapsUrl ?? "",
    transportToEvent: event.transportToEvent ?? "",
    entrySide: event.entrySide ?? "",
    ticketType: hasPaidTier ? "paid" : "free",
    audienceCategory,
    refundPolicy: asString(discounts.refundPolicy),
    ticketName: tiers[0]?.name ?? "General Admission",
    ticketQuantity: String(totalTicketQuantity > 0 ? totalTicketQuantity : 1),
    ticketPrice: String(tiers[0]?.price ?? 0),
    enableOffers: asBoolean(discounts.enabled),
    discountType: asString(discounts.discountType) || "flat",
    discountAmount: String(asNumber(discounts.discountAmount, 0)),
    discountCode: asString(discounts.discountCode),
    couponCode: asString(discounts.couponCode),
    couponExpiry: asString(discounts.couponExpiry),
    minOrderValue: String(asNumber(discounts.minOrderValue, 0)),
    guidelines: asString(guidelines.text),
    addOns: {
      ...DEFAULT_ADD_ONS,
      freebies: asBoolean(addOns.freebies),
      giftHampers: asBoolean(addOns.giftHampers),
      merchandise: asBoolean(addOns.merchandise),
      addOther: asBoolean(addOns.addOther),
      giftHampersDescription: asString(addOns.giftHampersDescription),
      addOtherDescription: asString(addOns.addOtherDescription),
    },
    contactInfo: {
      ...DEFAULT_CONTACT_INFO,
      mobile: asString(contactInfo.mobile),
      email: asString(contactInfo.email),
      website: asString(contactInfo.website),
      additionalLinks: asString(contactInfo.additionalLinks),
    },
    sponsors: {
      titleSponsors: sanitizeSponsorList(sponsors.titleSponsors),
      coPartners: sanitizeSponsorList(sponsors.coPartners),
      mediaPartners: sanitizeSponsorList(sponsors.mediaPartners),
    },
    requirements: {
      artists: asString(requirements.artists),
      stallsAvailability: asString(requirements.stallsAvailability),
      stallsPrices:
        stallsPrices.length > 0
          ? stallsPrices
          : [
              { stallType: "", stallPrice: "" },
              { stallType: "", stallPrice: "" },
            ],
    },
    postEventFollowUp: {
      thankYouNote: asString(postEventFollowUp.thankYouNote),
    },
    transportOptions: {
      ...DEFAULT_TRANSPORT_OPTIONS,
      publicTransport: asBoolean(transportOptions.publicTransport),
      ownVehicles: asBoolean(transportOptions.ownVehicles),
      thirdPartyApp: asBoolean(transportOptions.thirdPartyApp),
      localPrivateTransport: asBoolean(transportOptions.localPrivateTransport),
    },
    artists: parsedArtists.length > 0 ? parsedArtists : [{ name: "", genre: "" }],
    audienceRange: {
      min: asNumber(audienceRange.min, 13),
      max: asNumber(audienceRange.max, 86),
    },
    targetAudience: parsedTargetAudience,
    eventPhoto: null,
  }
}

const toUpcomingCard = (event: EventDetail): UpcomingManageEvent => {
  const status = getStatusFromDate(event.date)
  const soldCount = event.ticketTiers.reduce((sum, tier) => sum + Number(tier.soldCount || 0), 0)
  const revenue = event.ticketTiers.reduce(
    (sum, tier) => sum + Number(tier.soldCount || 0) * Number(tier.price || 0),
    0
  )
  const activeAddOns = Object.values(asRecord(event.addOns)).filter((value) => value === true).length

  const artistNames = asArray(event.artists)
    .map((artist) => asString(asRecord(artist).name).trim())
    .filter(Boolean)

  const highlights = [event.tagline ?? "", ...artistNames]
    .filter(Boolean)
    .slice(0, 2)

  while (highlights.length < 2) {
    highlights.push(highlights.length === 0 ? event.venue : event.category ?? "Live Event")
  }

  const analyticsDate = formatLongDate(event.date)

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    date: analyticsDate,
    timeRange: formatTimeRange(event.startTime, event.endTime),
    type: event.category ?? "Live Event",
    venue: event.venue,
    aboutTitle: "About The Event",
    aboutDescription: event.description,
    highlightsTitle: "Event Highlights",
    highlights,
    posterImage: getEventCoverImageUrl(event.id, event.updatedAt),
    stats: {
      registrations: String(soldCount),
      revenue: formatCurrency(revenue),
      addOns: String(activeAddOns),
      dateChange: "-",
    },
    formData: toEventFormDraft(event),
    analyticsData: {
      eventName: event.title,
      date: analyticsDate,
      category: event.category ?? "Live Event",
      status,
    },
  }
}

const toAllEventsRow = (event: EventDetail): AllManageEvent => {
  const status = getStatusFromDate(event.date)

  return {
    id: event.id,
    slug: event.slug,
    date: formatTableDate(event.date),
    name: event.title,
    category: event.category ?? "Live Event",
    status,
    action: status === "Past" ? "Repeat" : "Edit",
    formData: toEventFormDraft(event),
    analyticsData: {
      eventName: event.title,
      date: formatLongDate(event.date),
      category: event.category ?? "Live Event",
      status,
    },
  }
}

export const toUpcomingManageEvents = (events: EventDetail[]) =>
  events
    .map((event) => ({ event, status: getStatusFromDate(event.date) }))
    .filter(({ status }) => status !== "Past")
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())
    .map(({ event }) => toUpcomingCard(event))

export const toAllManageEvents = (events: EventDetail[]) =>
  [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((event) => toAllEventsRow(event))
