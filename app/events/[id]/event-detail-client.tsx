"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Ticket,
  ArrowRight,
  CalendarX2,
  CalendarPlus,
  Navigation,
  Bus,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  Phone,
  ScrollText,
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { useAuthModal } from "@/components/auth/auth-modal-context"
import { ShareEventButton } from "@/components/event-org/share-event-button"
import { isEventPast } from "@/lib/event-helpers"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventDetail } from "@/types/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DateReviewsSection } from "@/components/events/date-reviews-section"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean) : []

// "publicTransport" / "ample_parking" → "Public Transport" / "Ample Parking"
const humanize = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

export default function EventDetailClient({ event }: { event: EventDetail }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { openModal } = useAuthModal()
  const isLoggedIn = Boolean(session?.user)

  const [coverImageSrc, setCoverImageSrc] = useState(getEventCoverImageUrl(event.id, event.updatedAt))
  const [aboutExpanded, setAboutExpanded] = useState(false)

  // J1 — record a unique daily view of this event page (fire-and-forget).
  useEffect(() => {
    if (typeof window === "undefined") return
    let visitorId = localStorage.getItem("baatasari-visitor-id") || ""
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem("baatasari-visitor-id", visitorId)
    }
    void apiRequest(`/events/${event.id}/view`, {
      method: "POST",
      body: JSON.stringify({ visitorId }),
    }).catch(() => undefined)
  }, [event.id])

  const tiers = event.ticketTiers ?? []
  const [selectedTierId, setSelectedTierId] = useState<string>(() => tiers[0]?.id ?? "")
  const isFreeEvent = tiers.length > 0 && tiers.every((t) => Number(t.price) === 0)
  const minPrice = useMemo(() => {
    if (tiers.length === 0) return null
    return Math.min(...tiers.map((t) => Number(t.price ?? 0)))
  }, [tiers])
  const priceDisplay = isFreeEvent ? "Free" : minPrice !== null ? formatCurrency(minPrice) : "—"

  const eventHighlights = useMemo(() => {
    const requirements = asRecord(event.requirements)
    const requirementHighlights = asStringArray(requirements.highlights)
    const artistHighlights = (event.artists ?? []).map((artist) => artist.name).filter(Boolean)
    const combined = [event.tagline ?? "", ...requirementHighlights, ...artistHighlights].filter(Boolean)
    return [...new Set(combined)].slice(0, 8)
  }, [event])

  const guidelineItems = useMemo(() => {
    const guidelines = asRecord(event.guidelines)
    const text = typeof guidelines.text === "string" ? guidelines.text.trim() : ""
    if (!text) return []
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  }, [event])

  const transportItems = useMemo(() => {
    const opts = (event.transportOptions ?? {}) as Record<string, unknown>
    return Object.entries(opts)
      .filter(([, v]) => v === true)
      .map(([k]) => humanize(k))
  }, [event.transportOptions])

  const ageRange = (() => {
    const range = event.audienceRange
    if (range && typeof range.min === "number" && typeof range.max === "number") {
      if (range.min <= 0 && range.max >= 100) return "All Ages"
      return `${range.min}–${range.max} yrs`
    }
    return "All Ages"
  })()

  const timeLabel = `${event.startTime ?? "TBA"}${event.endTime ? ` – ${event.endTime}` : ""}`
  const contact = (event.contactInfo ?? {}) as { mobile?: string; email?: string; website?: string }
  const organizerName = event.organizerDisplayName ?? null

  const facts = [
    { icon: <CalendarDays className="h-4 w-4" />, label: "Date", value: formatDate(event.date) },
    { icon: <Clock className="h-4 w-4" />, label: "Time", value: timeLabel },
    { icon: <MapPin className="h-4 w-4" />, label: "Venue", value: event.venue ?? "TBA" },
    { icon: <Users className="h-4 w-4" />, label: "Age", value: ageRange },
  ]

  const isCancelled = Boolean(event.cancelledAt)
  const isPast = isEventPast(event)
  const unavailable = isCancelled || isPast

  const goToCheckout = () => {
    if (unavailable) return
    const tierParam = selectedTierId ? `&tierId=${encodeURIComponent(selectedTierId)}` : ""
    const target = `/checkout?eventId=${event.id}${tierParam}`
    if (!isLoggedIn) {
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      params.set("redirect", target)
      router.replace(`${pathname}?${params.toString()}`)
      openModal("login")
      return
    }
    router.push(target)
  }

  const aboutLong = (event.description ?? "").length > 260

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-10">
        {/* ── Hero: cover + ticket card ─────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Cover */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-xl sm:aspect-[16/10] lg:aspect-[3/4]">
            <Image
              src={coverImageSrc}
              alt={event.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={`object-cover object-center ${unavailable ? "grayscale-[0.3]" : ""}`}
              priority
              onError={() => setCoverImageSrc("/an2.png")}
            />
            {event.category ? (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                {event.category}
              </span>
            ) : null}
            {isCancelled ? (
              <span className="absolute right-4 top-4 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Cancelled
              </span>
            ) : isPast ? (
              <span className="absolute right-4 top-4 rounded-full bg-(--brand-navy) px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                Completed
              </span>
            ) : null}
          </div>

          {/* Ticket card */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-3xl border border-(--gray-200) bg-(--white) p-5 shadow-lg sm:p-6">
              {/* Title + share */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-bricolage text-2xl font-bold leading-tight text-(--brand-navy) sm:text-3xl">
                    {event.title}
                  </h1>
                  {event.tagline ? (
                    <p className="mt-1 text-sm font-medium text-(--brand-blue)">{event.tagline}</p>
                  ) : null}
                </div>
                <ShareEventButton
                  eventId={event.id}
                  slug={event.slug}
                  title={event.title}
                  iconOnly
                  className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--gray-200) text-(--brand-blue) transition hover:bg-(--blue-50)"
                />
              </div>

              {/* Price */}
              <div className="mt-4 flex items-end justify-between border-y border-(--gray-100) py-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--gray-400)">Starting from</p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="font-bricolage text-3xl font-bold text-(--brand-navy)">{priceDisplay}</span>
                    {!isFreeEvent && minPrice !== null ? (
                      <span className="text-sm font-medium text-(--gray-500)">/ ticket</span>
                    ) : null}
                  </p>
                </div>
                {tiers.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-(--blue-100) bg-(--blue-50) px-3 py-1 text-[11px] font-semibold text-(--brand-blue)">
                    <Ticket className="h-3.5 w-3.5" />
                    {tiers.length} tier{tiers.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>

              {/* Facts */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-2xl border border-(--gray-100) bg-(--gray-50)/60 p-3">
                    <div className="flex items-center gap-1.5 text-(--brand-blue)">
                      {f.icon}
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--gray-400)">{f.label}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-(--brand-navy)">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Tier selection */}
              {tiers.length > 0 && !unavailable ? (
                <div className="mt-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-(--gray-400)">Pick your ticket</p>
                  {tiers.slice(0, 4).map((tier) => {
                    const isSelected = tier.id === selectedTierId
                    return (
                      <button
                        type="button"
                        key={tier.id ?? tier.name}
                        onClick={() => setSelectedTierId(tier.id ?? "")}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${
                          isSelected
                            ? "border-(--brand-navy) bg-(--brand-navy)/5 ring-2 ring-(--brand-navy)/25"
                            : "border-(--gray-100) bg-(--white) hover:border-(--brand-blue)/40 hover:bg-(--blue-50)/40"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-(--brand-navy)">{tier.name}</p>
                          {tier.description ? (
                            <p className="truncate text-xs text-(--gray-500)">{tier.description}</p>
                          ) : null}
                        </div>
                        <p className="ml-3 shrink-0 text-sm font-bold text-(--brand-blue)">
                          {Number(tier.price) === 0 ? "Free" : formatCurrency(Number(tier.price))}
                        </p>
                      </button>
                    )
                  })}
                </div>
              ) : null}

              {/* CTA */}
              <div className="mt-5">
                {isCancelled ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-center">
                    <p className="flex items-center justify-center gap-2 font-poppins text-base font-bold text-rose-700">
                      <CalendarX2 className="h-5 w-5" /> Event cancelled
                    </p>
                    <p className="mt-1 text-[11px] text-rose-500">If you booked, you’ll be refunded.</p>
                  </div>
                ) : isPast ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-4 text-center">
                    <p className="flex items-center justify-center gap-2 font-poppins text-base font-bold text-slate-600">
                      <CalendarX2 className="h-5 w-5" /> Event ended
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Tickets are no longer available.</p>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={goToCheckout}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-(--brand-navy) px-6 py-3.5 font-poppins text-base font-bold text-white shadow-lg shadow-(--brand-navy)/20 transition hover:bg-(--brand-navy)/90"
                    >
                      <Ticket className="h-5 w-5" />
                      Book Tickets
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-2.5 text-center text-[11px] text-(--gray-500)">Secure checkout · Instant e-tickets</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sections ──────────────────────────────────────────────── */}
        <div className="mt-10 space-y-6 lg:max-w-3xl">
          {/* About */}
          <section className="rounded-3xl border border-(--gray-200) bg-(--white) p-6 shadow-sm md:p-7">
            <h2 className="mb-3 text-lg font-bold text-(--brand-navy)">About Event</h2>
            <p
              className={`whitespace-pre-line leading-relaxed text-(--gray-600) ${
                aboutLong && !aboutExpanded ? "line-clamp-4" : ""
              }`}
            >
              {event.description}
            </p>
            {aboutLong ? (
              <button
                type="button"
                onClick={() => setAboutExpanded((v) => !v)}
                className="mt-2 text-sm font-semibold text-(--brand-blue) hover:underline"
              >
                {aboutExpanded ? "Read less" : "Read more"}
              </button>
            ) : null}
          </section>

          {/* Highlights */}
          {eventHighlights.length > 0 ? (
            <section className="rounded-3xl border border-(--gray-200) bg-(--white) p-6 shadow-sm md:p-7">
              <h2 className="mb-4 text-lg font-bold text-(--brand-navy)">Event Highlights</h2>
              <div className="flex flex-wrap gap-2">
                {eventHighlights.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--blue-100) bg-(--blue-50) px-3.5 py-1.5 text-sm font-semibold text-(--brand-blue)"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {h}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {/* Venue & Transport */}
          <section className="rounded-3xl border border-(--gray-200) bg-(--white) p-6 shadow-sm md:p-7">
            <h2 className="mb-4 text-lg font-bold text-(--brand-navy)">Venue &amp; Transport</h2>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-(--brand-blue)" />
              <div className="min-w-0">
                <p className="font-semibold text-(--brand-navy)">{event.venue ?? "TBA"}</p>
                {event.googleMapsUrl ? (
                  <a
                    href={event.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-(--brand-navy) px-4 py-2 text-sm font-semibold text-white transition hover:bg-(--brand-navy)/90"
                  >
                    <Navigation className="h-4 w-4" /> Get Directions
                  </a>
                ) : null}
              </div>
            </div>

            {transportItems.length > 0 || event.transportToEvent ? (
              <div className="mt-5 space-y-2 border-t border-(--gray-100) pt-4">
                {transportItems.map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-sm text-(--gray-600)">
                    <Bus className="h-4 w-4 shrink-0 text-(--brand-blue)" />
                    {t}
                  </div>
                ))}
                {event.transportToEvent ? (
                  <div className="flex items-start gap-2.5 text-sm text-(--gray-600)">
                    <Bus className="mt-0.5 h-4 w-4 shrink-0 text-(--brand-blue)" />
                    {event.transportToEvent}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Hosted By */}
          {organizerName ? (
            <section className="rounded-3xl border border-(--gray-200) bg-(--white) p-6 shadow-sm md:p-7">
              <h2 className="mb-4 text-lg font-bold text-(--brand-navy)">Hosted By</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-(--brand-navy) text-base font-bold text-white">
                  {organizerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-(--brand-navy)">
                    {organizerName}
                    <BadgeCheck className="h-4 w-4 text-(--brand-blue)" />
                  </p>
                  <p className="text-xs text-(--gray-500)">Event Host</p>
                </div>
              </div>
            </section>
          ) : null}

          {/* Request a new date — shown to everyone; guests are prompted to register */}
          <section className="rounded-3xl border border-(--gray-200) bg-(--white) p-6 text-center shadow-sm md:p-7">
            <CalendarPlus className="mx-auto mb-3 h-9 w-9 text-(--brand-blue)" />
            <h3 className="mb-1 text-base font-bold text-(--brand-navy)">Can&apos;t make it this time?</h3>
            <p className="mx-auto mb-5 max-w-md text-sm text-(--gray-600)">
              Let the organizer know which date would work better for you.
            </p>
            {isLoggedIn ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-(--brand-navy) px-6 text-white hover:bg-(--brand-navy)/90">
                    <CalendarPlus className="mr-2 h-4 w-4" /> Request a New Date
                  </Button>
                </DialogTrigger>
                <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border-0 bg-(--white) p-0">
                  <VisuallyHidden>
                    <DialogTitle>Select Date and View Reviews</DialogTitle>
                  </VisuallyHidden>
                  <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6 md:p-8">
                    <DateReviewsSection eventId={event.id} />
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button
                onClick={() => openModal("register")}
                className="rounded-full bg-(--brand-navy) px-6 text-white hover:bg-(--brand-navy)/90"
              >
                <CalendarPlus className="mr-2 h-4 w-4" /> Request a New Date
              </Button>
            )}
          </section>

          {/* Quick links — Refund · Guidelines · Contact */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/refund-policy"
              className="flex items-center gap-3 rounded-2xl border border-(--gray-200) bg-(--white) p-4 shadow-sm transition hover:border-(--brand-blue)/40 hover:bg-(--blue-50)/40"
            >
              <ShieldCheck className="h-5 w-5 shrink-0 text-(--brand-blue)" />
              <span className="text-sm font-semibold text-(--brand-navy)">Refund Policy</span>
            </Link>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-(--gray-200) bg-(--white) p-4 text-left shadow-sm transition hover:border-(--brand-blue)/40 hover:bg-(--blue-50)/40"
                >
                  <ScrollText className="h-5 w-5 shrink-0 text-(--brand-blue)" />
                  <span className="text-sm font-semibold text-(--brand-navy)">Guidelines &amp; Rules</span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] w-[95vw] max-w-lg overflow-y-auto rounded-3xl border border-(--gray-200) bg-(--white) p-6">
                <DialogTitle className="mb-3 text-lg font-bold text-(--brand-navy)">Guidelines &amp; Rules</DialogTitle>
                <ul className="list-disc space-y-2 pl-5 text-sm text-(--gray-600)">
                  {guidelineItems.length > 0 ? (
                    guidelineItems.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <>
                      <li>Tickets once booked cannot be exchanged or refunded.</li>
                      <li>Please arrive at least 20 minutes before the event start time.</li>
                      <li>Carry a valid ID; rights of admission reserved.</li>
                    </>
                  )}
                </ul>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-3 rounded-2xl border border-(--gray-200) bg-(--white) p-4 text-left shadow-sm transition hover:border-(--brand-blue)/40 hover:bg-(--blue-50)/40"
                >
                  <Phone className="h-5 w-5 shrink-0 text-(--brand-blue)" />
                  <span className="text-sm font-semibold text-(--brand-navy)">Contact Information</span>
                </button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md rounded-3xl border border-(--gray-200) bg-(--white) p-6">
                <DialogTitle className="mb-3 text-lg font-bold text-(--brand-navy)">Contact Information</DialogTitle>
                <div className="space-y-2 text-sm text-(--gray-600)">
                  {contact.mobile ? (
                    <a href={`tel:${contact.mobile}`} className="flex items-center gap-2 hover:text-(--brand-blue)">
                      <Phone className="h-4 w-4" /> {contact.mobile}
                    </a>
                  ) : null}
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-(--brand-blue)">
                      <ScrollText className="h-4 w-4" /> {contact.email}
                    </a>
                  ) : null}
                  {contact.website ? (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-(--brand-blue)">
                      <Navigation className="h-4 w-4" /> {contact.website}
                    </a>
                  ) : null}
                  {!contact.mobile && !contact.email && !contact.website ? (
                    <p>Reach us at <a href="mailto:contact-us@baatasari.com" className="font-semibold text-(--brand-blue)">contact-us@baatasari.com</a></p>
                  ) : null}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </main>

      {/* ── Sticky bottom bar (mobile) ────────────────────────────── */}
      {!unavailable ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--gray-200) bg-(--white) px-4 py-3 shadow-[0_-8px_24px_rgba(12,29,55,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-(--gray-400)">Starting from</p>
              <p className="font-bricolage text-xl font-bold text-(--brand-navy)">{priceDisplay}</p>
            </div>
            <button
              type="button"
              onClick={goToCheckout}
              className="flex items-center gap-2 rounded-full bg-(--brand-navy) px-7 py-3 font-poppins text-sm font-bold text-white transition hover:bg-(--brand-navy)/90"
            >
              <Ticket className="h-4 w-4" /> Book Tickets
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
