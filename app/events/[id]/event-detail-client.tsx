"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  Bus,
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  Clock,
  DoorOpen,
  Gift,
  Hourglass,
  MapPin,
  Music,
  Navigation,
  Phone,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { useAuthModal } from "@/components/auth/auth-modal-context"
import { ShareEventButton } from "@/components/event-org/share-event-button"
import { isEventPast } from "@/lib/event-helpers"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventDetail } from "@/types/api"
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

// "7:00 PM" / "19:00" → minutes since midnight (null if unparseable).
const parseTimeToMinutes = (t: string | null | undefined): number | null => {
  if (!t) return null
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const meridiem = m[3]?.toUpperCase()
  if (meridiem === "PM" && h < 12) h += 12
  if (meridiem === "AM" && h === 12) h = 0
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

// 1234 → "1.2k" (going count, BookMyShow-style)
const formatCount = (n: number): string => {
  if (n >= 1000) {
    const k = n / 1000
    return `${k.toFixed(k >= 10 ? 0 : 1).replace(/\.0$/, "")}k`
  }
  return String(n)
}

// Max tickets per booking — mirrors the server-side per-identity cap (A9).
const MAX_TICKETS_PER_ORDER = 10

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

// Flat BMS-style section heading.
function SectionHead({ title }: { title: string }) {
  return (
    <h2 className="font-bricolage text-xl font-bold tracking-tight text-(--brand-navy) sm:text-2xl">
      {title}
    </h2>
  )
}

// One label row inside the sidebar info card.
function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm text-(--gray-700)">
      <span className="mt-0.5 shrink-0 text-(--gray-500)">{icon}</span>
      <span className="min-w-0 font-medium">{children}</span>
    </div>
  )
}

export default function EventDetailClient({ event }: { event: EventDetail }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { openModal } = useAuthModal()
  const reduce = useReducedMotion()
  const isLoggedIn = Boolean(session?.user)

  const [coverImageSrc, setCoverImageSrc] = useState(getEventCoverImageUrl(event.id, event.updatedAt))
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [showTiers, setShowTiers] = useState(false)

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

  // ── Tickets: per-tier quantities (multi-tier cart) ──
  const tiers = useMemo(() => event.ticketTiers ?? [], [event.ticketTiers])
  const [tierQty, setTierQty] = useState<Record<string, number>>({})
  const totalQty = useMemo(
    () => Object.values(tierQty).reduce((sum, n) => sum + n, 0),
    [tierQty],
  )
  const totalPrice = useMemo(
    () =>
      tiers.reduce(
        (sum, t) => sum + (tierQty[t.id ?? ""] ?? 0) * Number(t.price ?? 0),
        0,
      ),
    [tiers, tierQty],
  )
  // Seats left on a tier, when the API exposes soldCount (undefined ⇒ unknown).
  const tierLeft = (tier: (typeof tiers)[number]): number | null => {
    if (typeof tier.soldCount !== "number" || typeof tier.quantity !== "number") return null
    return Math.max(0, tier.quantity - tier.soldCount)
  }
  const adjustTierQty = (tierId: string, delta: number, left: number | null) => {
    setTierQty((prev) => {
      const current = prev[tierId] ?? 0
      const total = Object.values(prev).reduce((sum, n) => sum + n, 0)
      let next = current
      if (delta > 0) {
        const underOrderCap = total < MAX_TICKETS_PER_ORDER
        const underTierCap = left === null || current < left
        if (underOrderCap && underTierCap) next = current + 1
      } else {
        next = Math.max(0, current - 1)
      }
      if (next === current) return prev
      return { ...prev, [tierId]: next }
    })
  }

  const isFreeEvent = tiers.length > 0 && tiers.every((t) => Number(t.price) === 0)
  const minPrice = useMemo(() => {
    if (tiers.length === 0) return null
    return Math.min(...tiers.map((t) => Number(t.price ?? 0)))
  }, [tiers])
  const allSoldOut =
    tiers.length > 0 &&
    tiers.every((t) => {
      const left = tierLeft(t)
      return left !== null && left <= 0
    })
  const priceDisplay = isFreeEvent
    ? "Free"
    : minPrice !== null
      ? `${formatCurrency(minPrice)} onwards`
      : "—"

  // ── Content derived from the event record ──
  const descriptionParas = useMemo(
    () => (event.description ?? "").split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean),
    [event.description],
  )
  const aboutLong = (event.description ?? "").length > 260 || descriptionParas.length > 1

  const eventHighlights = useMemo(() => {
    const requirements = asRecord(event.requirements)
    const requirementHighlights = asStringArray(requirements.highlights)
    const combined = [event.tagline ?? "", ...requirementHighlights].filter(Boolean)
    return [...new Set(combined)].slice(0, 8)
  }, [event])

  const artists = useMemo(
    () => (event.artists ?? []).filter((a) => a.name && a.name.trim()),
    [event.artists],
  )

  // Unique artist genres — the "Folk, Indie, Rock" row of the info card.
  const genres = useMemo(() => {
    const list = artists
      .map((a) => (a.genre ?? "").trim())
      .filter(Boolean)
    return [...new Set(list)].slice(0, 4)
  }, [artists])

  const chiefGuest = (() => {
    const personnel = asRecord(event.requirements).personnel
    return typeof personnel === "string" && personnel.trim() ? personnel.trim() : null
  })()

  // Add-ons → "included with your ticket" perks.
  const perks = useMemo(() => {
    const addOns = asRecord(event.addOns)
    const list: string[] = []
    if (addOns.freebies) list.push("Freebies at entry")
    if (addOns.giftHampers) {
      const desc = typeof addOns.giftHampersDescription === "string" ? addOns.giftHampersDescription.trim() : ""
      list.push(desc || "Gift hampers")
    }
    if (addOns.merchandise) list.push("Event merchandise")
    if (addOns.addOther) {
      const desc = typeof addOns.addOtherDescription === "string" ? addOns.addOtherDescription.trim() : ""
      if (desc) list.push(desc)
    }
    return list
  }, [event.addOns])

  const sponsorGroups = useMemo(() => {
    const s = event.sponsors ?? {}
    const groups: [string, { name: string; website?: string | null }[]][] = [
      ["Title sponsors", (s.titleSponsors ?? []).filter((x) => x.name?.trim())],
      ["Co-partners", (s.coPartners ?? []).filter((x) => x.name?.trim())],
      ["Venue partners", (s.venuePartners ?? []).filter((x) => x.name?.trim())],
      ["Media partners", (s.mediaPartners ?? []).filter((x) => x.name?.trim())],
    ]
    return groups.filter(([, names]) => names.length > 0)
  }, [event.sponsors])

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

  const startDateLabel = formatDate(event.date)
  const endDateLabel = event.endDate ? formatDate(event.endDate) : null
  const isMultiDay = Boolean(endDateLabel && endDateLabel !== startDateLabel)
  const dateLabel = isMultiDay ? `${startDateLabel} – ${endDateLabel}` : startDateLabel
  const timeLabel = `${event.startTime ?? "TBA"}${event.endTime ? ` – ${event.endTime}` : ""}`

  // Duration derived from start–end time; only for single-day events with
  // parseable times (a date range already tells the multi-day story).
  const durationLabel = useMemo(() => {
    if (isMultiDay) return null
    const start = parseTimeToMinutes(event.startTime)
    const end = parseTimeToMinutes(event.endTime)
    if (start === null || end === null || end <= start) return null
    const hours = (end - start) / 60
    const rounded = Math.round(hours * 2) / 2
    return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} Hour${rounded !== 1 ? "s" : ""}`
  }, [event.startTime, event.endTime, isMultiDay])

  const contact = (event.contactInfo ?? {}) as { mobile?: string; email?: string; website?: string }
  const organizerName = event.organizerDisplayName ?? null
  const mapsUrl = event.googleMapsUrl
  const goingCount = typeof event.bookedCount === "number" ? event.bookedCount : 0

  const isCancelled = Boolean(event.cancelledAt)
  const isPast = isEventPast(event)
  const unavailable = isCancelled || isPast

  const goToCheckout = () => {
    if (unavailable) return
    if (tiers.length > 0 && totalQty === 0) return
    // Selection travels as `sel=tierId:qty,tierId:qty` — refresh/share-safe.
    const sel = tiers
      .filter((t) => (tierQty[t.id ?? ""] ?? 0) > 0)
      .map((t) => `${t.id}:${tierQty[t.id ?? ""]}`)
      .join(",")
    const selParam = sel ? `&sel=${encodeURIComponent(sel)}` : ""
    const target = `/checkout?eventId=${event.id}${selParam}`
    if (!isLoggedIn) {
      const params = new URLSearchParams(searchParams?.toString() ?? "")
      params.set("redirect", target)
      router.replace(`${pathname}?${params.toString()}`)
      openModal("login")
      return
    }
    router.push(target)
  }

  const scrollToBooking = () =>
    document.getElementById("booking-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })

  // Sidebar CTA: logged out → login modal; logged in → reveal the tier picker.
  const handleBookCta = () => {
    if (unavailable || allSoldOut || tiers.length === 0) return
    if (!isLoggedIn) {
      openModal("login")
      return
    }
    setShowTiers(true)
    requestAnimationFrame(scrollToBooking)
  }

  const bookCtaLabel = isLoggedIn ? "Book tickets" : "Login to book"
  const canBook = !unavailable && !allSoldOut && tiers.length > 0

  // Dark tag chips under the banner: category + artist genres.
  const tagChips = useMemo(
    () => [...new Set([event.category ?? "", ...genres].map((t) => t.trim()).filter(Boolean))].slice(0, 4),
    [event.category, genres],
  )

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-28 lg:pb-16">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 lg:px-10 lg:pt-10">
        {/* ════ Title row — title left, round share button right ════ */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 font-bricolage text-2xl font-bold leading-tight tracking-tight text-(--brand-navy) [text-wrap:balance] sm:text-3xl lg:text-4xl">
            {event.title}
          </h1>
          <ShareEventButton
            eventId={event.id}
            slug={event.slug}
            title={event.title}
            iconOnly
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--gray-100) text-(--gray-600) transition hover:bg-(--gray-200) hover:text-(--brand-navy) active:scale-95"
          />
        </div>

        {/* ════ Banner + sidebar card ════ */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_1fr] lg:gap-10">
          {/* Banner — wide slot; blurred poster backdrop keeps the portrait art uncropped */}
          <div className="min-w-0">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-(--brand-navy) sm:aspect-[2/1]">
              <Image
                src={coverImageSrc}
                alt=""
                aria-hidden
                fill
                sizes="1px"
                className={`scale-110 object-cover opacity-60 blur-2xl ${unavailable ? "grayscale-[0.35]" : ""}`}
                onError={() => setCoverImageSrc("/an2.png")}
              />
              <Image
                src={coverImageSrc}
                alt={event.title}
                fill
                priority
                sizes="(min-width: 1024px) 900px, 100vw"
                className={`object-contain ${unavailable ? "grayscale-[0.35]" : ""}`}
                onError={() => setCoverImageSrc("/an2.png")}
              />
              {isCancelled ? (
                <span className="absolute left-4 top-4 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  Cancelled
                </span>
              ) : isPast ? (
                <span className="absolute left-4 top-4 rounded-md bg-slate-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                  Event ended
                </span>
              ) : null}
            </div>

            {/* Under the banner: tag chips left, going count right */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {tagChips.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-(--brand-navy) px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {goingCount > 0 ? (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--gray-700)">
                  <Users className="h-4 w-4 text-emerald-600" />
                  {formatCount(goingCount)} going
                </span>
              ) : null}
            </div>
          </div>

          {/* Sidebar — info card + (revealed) tier picker */}
          <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <motion.div
                variants={reduce ? undefined : rise}
                initial="hidden"
                animate="show"
                className="rounded-2xl border border-(--gray-200) bg-white p-5 shadow-[0_10px_40px_-20px_rgba(12,29,55,0.25)]"
              >
                <div className="space-y-3.5">
                  <InfoRow icon={<CalendarDays className="h-4.5 w-4.5" />}>{dateLabel}</InfoRow>
                  <InfoRow icon={<Clock className="h-4.5 w-4.5" />}>{timeLabel}</InfoRow>
                  {durationLabel ? (
                    <InfoRow icon={<Hourglass className="h-4.5 w-4.5" />}>{durationLabel}</InfoRow>
                  ) : null}
                  {genres.length > 0 ? (
                    <InfoRow icon={<Music className="h-4.5 w-4.5" />}>{genres.join(", ")}</InfoRow>
                  ) : null}
                  <InfoRow icon={<MapPin className="h-4.5 w-4.5" />}>
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {event.venue ?? "TBA"}
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Get directions"
                          className="text-(--brand-blue) transition hover:text-(--brand-navy)"
                        >
                          <Navigation className="h-4 w-4" />
                        </a>
                      ) : null}
                    </span>
                  </InfoRow>
                </div>

                <div className="my-4 border-t border-(--gray-200)" />

                {unavailable ? (
                  <div className="flex items-center gap-3">
                    <CalendarX2 className={`h-6 w-6 shrink-0 ${isCancelled ? "text-rose-600" : "text-slate-500"}`} />
                    <div>
                      <p className={`font-poppins text-sm font-bold ${isCancelled ? "text-rose-700" : "text-slate-600"}`}>
                        {isCancelled ? "Event cancelled" : "Event ended"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isCancelled ? "If you booked, you'll be refunded." : "Tickets are no longer available."}
                      </p>
                    </div>
                  </div>
                ) : tiers.length === 0 ? (
                  <p className="text-sm text-(--gray-500)">Tickets for this event aren&rsquo;t on sale yet.</p>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bricolage text-lg font-bold tabular-nums text-(--brand-navy)">
                        {priceDisplay}
                      </p>
                      {allSoldOut ? (
                        <p className="text-sm font-semibold text-rose-600">Sold out</p>
                      ) : (
                        <p className="text-sm font-semibold text-emerald-600">Available</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleBookCta}
                      disabled={!canBook}
                      className="shrink-0 rounded-xl bg-(--brand-navy) px-6 py-3 font-poppins text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(12,29,55,0.6)] transition hover:bg-(--brand-navy)/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {bookCtaLabel}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Tier picker — revealed by the CTA once logged in */}
              {canBook && isLoggedIn && showTiers ? (
                <motion.div
                  variants={reduce ? undefined : rise}
                  initial="hidden"
                  animate="show"
                  id="booking-panel"
                  className="mt-4 scroll-mt-24 overflow-hidden rounded-2xl border border-(--gray-200) bg-white shadow-[0_10px_40px_-20px_rgba(12,29,55,0.25)]"
                >
                  <div className="flex items-center justify-between border-b border-(--gray-100) px-5 py-3.5">
                    <p className="font-poppins text-sm font-bold text-(--brand-navy)">Select tickets</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-(--gray-100) px-2.5 py-1 text-[11px] font-semibold text-(--gray-600)">
                      <Ticket className="h-3.5 w-3.5" />
                      {tiers.length} type{tiers.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="px-3 py-2">
                    {tiers.map((tier) => {
                      const id = tier.id ?? ""
                      const n = tierQty[id] ?? 0
                      const selected = n > 0
                      const left = tierLeft(tier)
                      const soldOut = left !== null && left <= 0
                      const price = Number(tier.price ?? 0)
                      return (
                        <div
                          key={id || tier.name}
                          className={`relative flex items-center justify-between gap-3 rounded-xl px-3 py-4 transition ${
                            selected ? "bg-(--gold-soft-bg)/60" : ""
                          } ${soldOut ? "opacity-55" : ""} [&:not(:last-child)]:border-b [&:not(:last-child)]:border-slate-100`}
                        >
                          {selected ? (
                            <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-(--gold)" />
                          ) : null}
                          <div className="min-w-0 pl-2">
                            <p className="font-semibold text-(--brand-navy)">{tier.name}</p>
                            {tier.description ? (
                              <p className="truncate text-xs text-slate-500">{tier.description}</p>
                            ) : null}
                            <p className="mt-1 text-sm font-bold tabular-nums text-(--brand-navy)">
                              {price === 0 ? "Free" : formatCurrency(price)}
                              {soldOut ? (
                                <span className="ml-2 text-[11px] font-semibold uppercase text-rose-500">Sold out</span>
                              ) : left !== null && left <= 10 ? (
                                <span className="ml-2 text-[11px] font-semibold text-rose-500">only {left} left</span>
                              ) : null}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => adjustTierQty(id, -1, left)}
                              disabled={n === 0}
                              aria-label={`Remove one ${tier.name} ticket`}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-(--brand-navy) transition hover:border-(--brand-navy) active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-5 text-center font-bold tabular-nums text-(--brand-navy)" aria-live="polite">
                              {n}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustTierQty(id, 1, left)}
                              disabled={soldOut || totalQty >= MAX_TICKETS_PER_ORDER || (left !== null && n >= left)}
                              aria-label={`Add one ${tier.name} ticket`}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-bold text-(--brand-navy) transition hover:border-(--brand-navy) active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary + CTA */}
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                    {totalQty > 0 ? (
                      <div className="mb-4 space-y-1.5 text-sm">
                        {tiers
                          .filter((t) => (tierQty[t.id ?? ""] ?? 0) > 0)
                          .map((t) => (
                            <div key={t.id ?? t.name} className="flex justify-between text-slate-600">
                              <span>
                                {t.name} × {tierQty[t.id ?? ""]}
                              </span>
                              <span className="font-medium tabular-nums">
                                {Number(t.price ?? 0) === 0
                                  ? "Free"
                                  : formatCurrency(Number(t.price ?? 0) * (tierQty[t.id ?? ""] ?? 0))}
                              </span>
                            </div>
                          ))}
                        <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-bold text-(--brand-navy)">
                          <span>Total</span>
                          <span className="tabular-nums">{totalPrice === 0 ? "Free" : formatCurrency(totalPrice)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-4 text-center text-xs text-slate-400">
                        Pick your tickets — up to {MAX_TICKETS_PER_ORDER} per booking
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={goToCheckout}
                      disabled={totalQty === 0}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-(--brand-navy) px-6 py-3.5 font-poppins text-base font-bold text-white shadow-[0_18px_40px_-15px_rgba(12,29,55,0.6)] transition hover:bg-(--brand-navy)/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Ticket className="h-5 w-5" />
                      {totalQty === 0 ? "Select tickets" : `Book ${totalQty} ticket${totalQty > 1 ? "s" : ""}`}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="mt-3 text-center text-[11px] text-slate-400">
                      Secure checkout · instant QR tickets · full refund if cancelled
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>

          {/* ════ Body content — flows under the banner, left of the sidebar ════ */}
          <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-2">
            {/* About The Event */}
            {descriptionParas.length > 0 ? (
              <motion.section
                variants={reduce ? undefined : rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="pt-2"
              >
                <SectionHead title="About The Event" />
                {(aboutExpanded ? descriptionParas : descriptionParas.slice(0, 1)).map((para, i) => (
                  <p key={i} className={`mt-4 max-w-[70ch] leading-relaxed text-slate-600 ${aboutExpanded ? "" : "line-clamp-4"}`}>
                    {para}
                  </p>
                ))}
                {aboutLong ? (
                  <button
                    type="button"
                    onClick={() => setAboutExpanded((v) => !v)}
                    className="mt-2 text-sm font-semibold text-(--brand-blue) underline-offset-4 transition hover:underline"
                  >
                    {aboutExpanded ? "Read less" : "Read more"}
                  </button>
                ) : null}
              </motion.section>
            ) : null}

            {/* Lineup — artists with genres */}
            {artists.length > 0 ? (
              <motion.section
                variants={reduce ? undefined : rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="border-t border-(--gray-200) pt-8"
              >
                <SectionHead title="On Stage" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {artists.map((artist) => (
                    <div
                      key={artist.name}
                      className="rounded-2xl border border-(--gray-200) bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(12,29,55,0.35)]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--gold-soft-bg) font-bricolage text-lg font-bold text-(--gold-text)">
                        {artist.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="mt-3 text-sm font-bold leading-snug text-(--brand-navy)">{artist.name}</p>
                      {artist.genre ? (
                        <p className="mt-0.5 text-xs font-medium text-slate-500">{artist.genre}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
                {chiefGuest ? (
                  <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Sparkles className="h-4 w-4 text-(--gold-icon)" />
                    {chiefGuest}
                  </p>
                ) : null}
              </motion.section>
            ) : null}

            {/* Highlights + included-with-ticket perks */}
            {eventHighlights.length > 0 || perks.length > 0 ? (
              <motion.section
                variants={reduce ? undefined : rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="border-t border-(--gray-200) pt-8"
              >
                <SectionHead title="Highlights" />
                {eventHighlights.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {eventHighlights.map((h) => (
                      <span
                        key={h}
                        className="inline-flex items-center gap-1.5 rounded-full border border-(--gold-soft-border) bg-(--gold-soft-bg) px-4 py-2 text-sm font-semibold text-(--gold-text) transition hover:border-(--gold)"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-(--gold-icon)" />
                        {h}
                      </span>
                    ))}
                  </div>
                ) : null}
                {perks.length > 0 ? (
                  <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                      <Gift className="h-4 w-4" /> Included with your ticket
                    </p>
                    <ul className="mt-2.5 space-y-1.5 text-sm text-slate-600">
                      {perks.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </motion.section>
            ) : null}

            {/* Venue & transport */}
            <motion.section
              variants={reduce ? undefined : rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="border-t border-(--gray-200) pt-8"
            >
              <SectionHead title="Venue & Transport" />
              <div className="mt-5 overflow-hidden rounded-2xl border border-(--gray-200) bg-white">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-(--gold-icon)" />
                    <p className="font-semibold text-(--brand-navy)">{event.venue ?? "TBA"}</p>
                  </div>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-(--brand-navy) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(12,29,55,0.5)] transition hover:bg-(--brand-navy)/90 active:scale-[0.98]"
                    >
                      <Navigation className="h-4 w-4" /> Get directions
                    </a>
                  ) : null}
                </div>
                {event.entrySide || transportItems.length > 0 || event.transportToEvent ? (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-(--gray-200) px-5 py-4 text-sm text-slate-600 sm:px-6">
                    {event.entrySide ? (
                      <span className="inline-flex items-center gap-2 font-medium text-(--brand-navy)">
                        <DoorOpen className="h-4 w-4 text-(--gold-icon)" />
                        {event.entrySide}
                      </span>
                    ) : null}
                    {transportItems.map((t) => (
                      <span key={t} className="inline-flex items-center gap-2">
                        <Bus className="h-4 w-4 text-(--gold-icon)" />
                        {t}
                      </span>
                    ))}
                    {event.transportToEvent ? (
                      <span className="inline-flex items-start gap-2">
                        <Bus className="mt-0.5 h-4 w-4 shrink-0 text-(--gold-icon)" />
                        {event.transportToEvent}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.section>

            {/* Sponsors */}
            {sponsorGroups.length > 0 ? (
              <motion.section
                variants={reduce ? undefined : rise}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="border-t border-(--gray-200) pt-8"
              >
                <SectionHead title="Made Possible By" />
                <div className="mt-5 space-y-4">
                  {sponsorGroups.map(([label, names]) => (
                    <div key={label} className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="w-32 shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        {label}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {names.map((sponsor) =>
                          sponsor.website ? (
                            <a
                              key={sponsor.name}
                              href={sponsor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bricolage text-sm font-bold text-(--brand-navy) transition hover:border-(--gold)"
                            >
                              {sponsor.name}
                            </a>
                          ) : (
                            <span
                              key={sponsor.name}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bricolage text-sm font-bold text-(--brand-navy)"
                            >
                              {sponsor.name}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : null}

            {/* Host + request-a-date */}
            <motion.section
              variants={reduce ? undefined : rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="grid gap-4 border-t border-(--gray-200) pt-8 sm:grid-cols-[1.4fr_1fr]"
            >
              {organizerName ? (
                <div className="flex items-center gap-4 rounded-2xl border border-(--gray-200) bg-white p-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-(--brand-navy) font-bricolage text-xl font-bold text-white">
                    {organizerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Hosted by</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-(--brand-navy)">
                      <span className="truncate">{organizerName}</span>
                      <BadgeCheck className="h-4 w-4 shrink-0 text-(--brand-blue)" />
                    </p>
                    <p className="text-xs text-slate-500">Verified organizer</p>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {isLoggedIn ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-dashed border-(--gold-soft-border) bg-transparent p-5 text-left transition hover:border-(--gold) hover:bg-(--gold-soft-bg)/50"
                    >
                      <div>
                        <p className="flex items-center gap-2 text-sm font-bold text-(--brand-navy)">
                          <CalendarPlus className="h-4 w-4 text-(--gold-icon)" />
                          Can&rsquo;t make it?
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Request a different date</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-(--gold-icon) transition-transform group-hover:translate-x-1" />
                    </button>
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
                <button
                  type="button"
                  onClick={() => openModal("register")}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-dashed border-(--gold-soft-border) bg-transparent p-5 text-left transition hover:border-(--gold) hover:bg-(--gold-soft-bg)/50"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-(--brand-navy)">
                      <CalendarPlus className="h-4 w-4 text-(--gold-icon)" />
                      Can&rsquo;t make it?
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Register to request a different date</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-(--gold-icon) transition-transform group-hover:translate-x-1" />
                </button>
              )}
            </motion.section>

            {/* Quick links — refund · guidelines · contact */}
            <motion.section
              variants={reduce ? undefined : rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-(--gray-200) pt-6 text-sm"
            >
              <Link
                href="/refund-policy"
                className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-(--brand-navy)"
              >
                <ShieldCheck className="h-4 w-4 text-(--gold-icon)" /> Refund policy
              </Link>

              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-(--brand-navy)"
                  >
                    <ScrollText className="h-4 w-4 text-(--gold-icon)" /> Guidelines &amp; rules
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
                    className="inline-flex items-center gap-2 font-semibold text-slate-600 transition hover:text-(--brand-navy)"
                  >
                    <Phone className="h-4 w-4 text-(--gold-icon)" /> Contact organizer
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
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-(--brand-blue)"
                      >
                        <Navigation className="h-4 w-4" /> {contact.website}
                      </a>
                    ) : null}
                    {!contact.mobile && !contact.email && !contact.website ? (
                      <p>
                        Reach us at{" "}
                        <a href="mailto:contact-us@baatasari.com" className="font-semibold text-(--brand-blue)">
                          contact-us@baatasari.com
                        </a>
                      </p>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </motion.section>
          </div>
        </div>
      </div>

      {/* ════ Mobile sticky booking bar ════ */}
      {canBook ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-(--gray-200) bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-bricolage text-base font-bold tabular-nums text-(--brand-navy)">{priceDisplay}</p>
              <p className="text-xs font-semibold text-emerald-600">Available</p>
            </div>
            <button
              type="button"
              onClick={handleBookCta}
              className="shrink-0 rounded-xl bg-(--brand-navy) px-7 py-3 font-poppins text-sm font-bold text-white shadow-[0_14px_30px_-14px_rgba(12,29,55,0.6)] transition hover:bg-(--brand-navy)/90 active:scale-[0.98]"
            >
              {bookCtaLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
