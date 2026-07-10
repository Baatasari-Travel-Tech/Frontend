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
  MapPin,
  Navigation,
  Phone,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Ticket,
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

// Max tickets per booking — mirrors the server-side per-identity cap (A9).
const MAX_TICKETS_PER_ORDER = 6

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
}

// Section heading: gold kicker + display title (the redesign's rhythm device).
function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-(--gold-text)">{kicker}</p>
      <h2 className="mt-1 font-bricolage text-2xl font-bold tracking-tight text-(--brand-navy)">{title}</h2>
    </>
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
  const priceDisplay = isFreeEvent ? "Free" : minPrice !== null ? formatCurrency(minPrice) : "—"

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
      ["Media partners", (s.mediaPartners ?? []).filter((x) => x.name?.trim())],
    ]
    return groups.filter(([, names]) => names.length > 0)
  }, [event.sponsors])

  const targetAudienceList = useMemo(
    () =>
      Object.entries(event.targetAudience ?? {})
        .filter(([, on]) => on === true)
        .map(([key]) => humanize(key))
        .slice(0, 8),
    [event.targetAudience],
  )

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

  const dateLabel = (() => {
    const start = formatDate(event.date)
    if (!event.endDate) return start
    const end = formatDate(event.endDate)
    return end !== start ? `${start} – ${end}` : start
  })()
  const timeLabel = `${event.startTime ?? "TBA"}${event.endTime ? ` – ${event.endTime}` : ""}`
  const contact = (event.contactInfo ?? {}) as { mobile?: string; email?: string; website?: string }
  const organizerName = event.organizerDisplayName ?? null
  const mapsUrl = event.googleMapsUrl

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

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-16">
      {/* ════ HERO — editorial split: poster as a framed object ════ */}
      <header className="relative py-6 lg:py-8">
        <div className="mx-auto w-full max-w-[1680px] px-4 lg:px-10">
          <div className="relative rounded-[2rem] border border-(--gold-bar-border) bg-(--gold-bar-bg) p-6 sm:p-9 lg:p-12">
            {/* Mobile: share pinned to the card's top-right */}
            <ShareEventButton
              eventId={event.id}
              slug={event.slug}
              title={event.title}
              iconOnly
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border-2 border-(--gold) bg-white text-(--gold) shadow-sm transition hover:bg-(--gold) hover:text-white active:scale-95 lg:hidden"
            />

            <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:gap-14">
              <div className="order-2 min-w-0 lg:order-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  {event.category ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-(--gold-soft-border) bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--gold-text)">
                      <Sparkles className="h-3.5 w-3.5" />
                      {event.category}
                    </span>
                  ) : null}
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Cancelled
                    </span>
                  ) : isPast ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      Event ended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                      Booking open
                    </span>
                  )}
                </div>

                <h1 className="mt-4 font-bricolage text-3xl font-bold leading-[1.06] tracking-tight text-(--brand-navy) [text-wrap:balance] sm:text-4xl lg:text-[3.4rem]">
                  {event.title}
                </h1>
                {event.tagline ? (
                  <p className="mt-3 max-w-xl text-base text-slate-600">{event.tagline}</p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-(--gold-icon)" />
                    <span className="font-semibold text-(--brand-navy)">{dateLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-(--gold-icon)" />
                    {timeLabel}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-(--gold-icon)" />
                    {event.venue ?? "TBA"}
                  </span>
                </div>

                {unavailable ? (
                  <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5">
                    <CalendarX2 className={`h-5 w-5 ${isCancelled ? "text-rose-600" : "text-slate-500"}`} />
                    <div>
                      <p className={`font-poppins text-sm font-bold ${isCancelled ? "text-rose-700" : "text-slate-600"}`}>
                        {isCancelled ? "Event cancelled" : "Event ended"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isCancelled ? "If you booked, you'll be refunded." : "Tickets are no longer available."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={scrollToBooking}
                      className="inline-flex items-center gap-2 rounded-full bg-(--brand-navy) px-7 py-3.5 font-poppins text-sm font-bold text-white shadow-[0_18px_40px_-15px_rgba(12,29,55,0.55)] transition hover:bg-(--brand-navy)/90 active:scale-[0.98]"
                    >
                      <Ticket className="h-4 w-4" /> Book tickets
                    </button>
                    {tiers.length > 0 ? (
                      <span className="text-sm font-semibold text-slate-500">
                        From{" "}
                        <span className="font-bricolage text-lg font-bold text-(--brand-navy)">
                          {priceDisplay}
                        </span>
                      </span>
                    ) : null}
                    <ShareEventButton
                      eventId={event.id}
                      slug={event.slug}
                      title={event.title}
                      iconOnly
                      className="hidden h-11 w-11 items-center justify-center rounded-full border-2 border-(--gold) bg-white text-(--gold) shadow-sm transition hover:bg-(--gold) hover:text-white active:scale-95 lg:flex"
                    />
                  </div>
                )}
              </div>

              {/* Poster — contract-locked 2:3 (1000×1500), shown as a framed object */}
              <div className="order-1 mx-auto mt-10 w-56 max-w-full sm:w-64 lg:order-2 lg:mt-0 lg:w-full">
                <div className="relative aspect-[2/3] rotate-[1.5deg] overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_35px_80px_-25px_rgba(12,29,55,0.45)] transition-transform duration-500 hover:rotate-0">
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                      src={coverImageSrc}
                      alt={event.title}
                      fill
                      priority
                      sizes="(min-width: 1024px) 340px, 256px"
                      className={`object-cover ${unavailable ? "grayscale-[0.35]" : ""}`}
                      onError={() => setCoverImageSrc("/an2.png")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════ BODY — content flows left, booking commands right ════ */}
      <main className="mx-auto mt-8 grid w-full max-w-[1680px] grid-cols-[minmax(0,1fr)] gap-10 px-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-14 lg:px-10">
        {/* ── Left: the story ── */}
        <div className="min-w-0 space-y-12 lg:px-2">
          {/* About */}
          {descriptionParas.length > 0 ? (
            <motion.section
              variants={reduce ? undefined : rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <SectionHead kicker="About" title="What's happening" />
              {(aboutExpanded ? descriptionParas : descriptionParas.slice(0, 1)).map((para, i) => (
                <p key={i} className={`mt-4 max-w-[65ch] leading-relaxed text-slate-600 ${aboutExpanded ? "" : "line-clamp-4"}`}>
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
            >
              <SectionHead kicker="Lineup" title="On stage" />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {artists.map((artist) => (
                  <div
                    key={artist.name}
                    className="group rounded-2xl bg-white p-4 shadow-[0_14px_40px_-24px_rgba(12,29,55,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-24px_rgba(12,29,55,0.45)]"
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
            >
              <SectionHead kicker="Highlights" title="Worth staying for" />
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
          >
            <SectionHead kicker="Getting there" title="Venue & transport" />
            <div className="mt-5 overflow-hidden rounded-3xl border border-(--gold-bar-border) bg-(--gold-bar-bg)">
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
                <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-(--gold-bar-border) px-5 py-4 text-sm text-slate-600 sm:px-6">
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
            {/* Who it's for */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-500">Great for:</span>
              {targetAudienceList.map((a) => (
                <span key={a} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  {a}
                </span>
              ))}
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                {ageRange}
              </span>
            </div>
          </motion.section>

          {/* Sponsors */}
          {sponsorGroups.length > 0 ? (
            <motion.section
              variants={reduce ? undefined : rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <SectionHead kicker="Sponsors" title="Made possible by" />
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
            className="grid gap-4 sm:grid-cols-[1.4fr_1fr]"
          >
            {organizerName ? (
              <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_18px_50px_-25px_rgba(12,29,55,0.25)]">
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
                    className="group flex items-center justify-between gap-3 rounded-3xl border border-dashed border-(--gold-soft-border) bg-transparent p-5 text-left transition hover:border-(--gold) hover:bg-(--gold-soft-bg)/50"
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
                className="group flex items-center justify-between gap-3 rounded-3xl border border-dashed border-(--gold-soft-border) bg-transparent p-5 text-left transition hover:border-(--gold) hover:bg-(--gold-soft-bg)/50"
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
            className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-(--gold-bar-border) pt-6 text-sm"
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

        {/* ── Right: the booking panel ── */}
        <motion.aside
          variants={reduce ? undefined : rise}
          initial="hidden"
          animate="show"
          id="booking-panel"
          className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
        >
          <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_35px_90px_-30px_rgba(12,29,55,0.4)]">
            {/* Panel header */}
            <div className="flex items-end justify-between bg-(--brand-navy) px-6 py-5 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                  {isFreeEvent ? "Entry" : "Tickets from"}
                </p>
                <p className="font-bricolage text-3xl font-bold tabular-nums">{priceDisplay}</p>
              </div>
              {tiers.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/85">
                  <Ticket className="h-3.5 w-3.5" />
                  {tiers.length} type{tiers.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {unavailable ? (
              <div className="px-6 py-8 text-center">
                <CalendarX2 className={`mx-auto h-8 w-8 ${isCancelled ? "text-rose-500" : "text-slate-400"}`} />
                <p className={`mt-3 font-poppins text-base font-bold ${isCancelled ? "text-rose-700" : "text-slate-600"}`}>
                  {isCancelled ? "Event cancelled" : "Event ended"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isCancelled ? "If you booked, you'll be refunded." : "Tickets are no longer available."}
                </p>
              </div>
            ) : tiers.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-slate-500">
                Tickets for this event aren&rsquo;t on sale yet.
              </div>
            ) : (
              <>
                {/* Tier rows — hairline-separated, gold marker on selection */}
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
                        className={`relative flex items-center justify-between gap-3 rounded-2xl px-3 py-4 transition ${
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
                <div className="border-t border-slate-100 px-6 pb-6 pt-4">
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
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-(--brand-navy) px-6 py-4 font-poppins text-base font-bold text-white shadow-[0_18px_40px_-15px_rgba(12,29,55,0.6)] transition hover:bg-(--brand-navy)/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Ticket className="h-5 w-5" />
                    {totalQty === 0 ? "Select tickets" : `Book ${totalQty} ticket${totalQty > 1 ? "s" : ""}`}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Secure checkout · instant QR tickets · full refund if cancelled
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.aside>
      </main>
    </div>
  )
}
