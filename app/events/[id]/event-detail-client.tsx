"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  Users,
  Sparkles,
  CalendarX2,
  CalendarPlus,
  ArrowRight,
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { useAuthModal } from "@/components/auth/auth-modal-context"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventDetail } from "@/types/api"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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

export default function EventDetailClient({ event }: { event: EventDetail }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { openModal } = useAuthModal()
  const isLoggedIn = Boolean(session?.user)

  const [coverImageSrc, setCoverImageSrc] = useState(getEventCoverImageUrl(event.id, event.updatedAt))

  const tiers = event.ticketTiers ?? []
  const [selectedTierId, setSelectedTierId] = useState<string>(() => tiers[0]?.id ?? "")
  const isFreeEvent = tiers.length > 0 && tiers.every((t) => Number(t.price) === 0)
  const minPrice = useMemo(() => {
    if (tiers.length === 0) return null
    return Math.min(...tiers.map((t) => Number(t.price ?? 0)))
  }, [tiers])

  const eventHighlights = useMemo(() => {
    const requirements = asRecord(event.requirements)
    const requirementHighlights = asStringArray(requirements.highlights)
    const artistHighlights = (event.artists ?? []).map((artist) => artist.name).filter(Boolean)
    const combined = [...requirementHighlights, ...artistHighlights]
    return [...new Set(combined)].slice(0, 6)
  }, [event])

  const guidelineItems = useMemo(() => {
    const guidelines = asRecord(event.guidelines)
    const text = typeof guidelines.text === "string" ? guidelines.text.trim() : ""
    if (!text) return []
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  }, [event])

  type TimeSlot = { name: string; startTime: string; endTime: string }
  const timeSlots = useMemo(() => {
    const requirements = asRecord(event.requirements)
    const slots = requirements.timeSlots
    if (!Array.isArray(slots)) return []
    return slots.filter((s): s is TimeSlot => s && typeof s === "object" && typeof s.name === "string")
  }, [event])

  const ageRange = (() => {
    const range = event.audienceRange
    if (range && typeof range.min === "number" && typeof range.max === "number") {
      return `${range.min}–${range.max} yrs`
    }
    return "All ages"
  })()

  const summaryItems: Array<{ icon: React.ReactNode; label: string; value: string }> = [
    { icon: <CalendarDays className="h-4 w-4" />, label: "Date", value: formatDate(event.date) },
    {
      icon: <Clock className="h-4 w-4" />,
      label: "Time",
      value: `${event.startTime ?? "8 AM"}${event.endTime ? ` – ${event.endTime}` : " Onwards"}`,
    },
    { icon: <MapPin className="h-4 w-4" />, label: "Venue", value: event.venue ?? "TBA" },
    { icon: <Users className="h-4 w-4" />, label: "Audience", value: ageRange },
  ]

  const goToCheckout = () => {
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

  return (
    <div className="min-h-screen bg-linear-to-b from-(--white) via-(--blue-50)/30 to-(--white)">
      <main className="flex-1 w-full px-4 py-8 md:py-12 max-w-6xl mx-auto">
        {/* Image + Right card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-stretch mb-12 w-full">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl h-[calc(100dvh-9rem)] w-full group">
              <Image
                src={coverImageSrc}
                alt={event.title}
                fill
                className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                priority
                onError={() => setCoverImageSrc("/e1.png")}
              />
              <div className="absolute inset-0 bg-linear-to-t from-(--brand-navy)/85 via-(--brand-navy)/20 to-transparent" />

              {/* Floating category chip */}
              {event.category ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-5 left-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {event.category}
                </motion.div>
              ) : null}

              {/* Bottom title */}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-200/90"
                >
                  Live Event
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="mt-2 font-bricolage text-2xl font-bold leading-tight text-white md:text-3xl"
                >
                  {event.title}
                </motion.h2>
              </div>
            </div>
          </motion.div>

          {/* Right card — details + Get Tickets */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-4 self-start"
          >
            <h1 className="mb-6 text-left font-bricolage text-3xl font-bold text-(--brand-blue) md:text-4xl">
              {event.title}
            </h1>

            <div className="relative overflow-hidden rounded-3xl border border-(--gray-200) bg-white shadow-xl">
              {/* Soft top gradient */}
              <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-(--blue-100)/60 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-(--blue-50) blur-3xl" />

              <div className="relative p-6 md:p-8">
                {/* Price block */}
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--gray-400)">
                      Starts from
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-bricolage text-4xl font-bold text-(--brand-navy)">
                        {isFreeEvent
                          ? "Free"
                          : minPrice !== null
                            ? formatCurrency(minPrice)
                            : "—"}
                      </span>
                      {!isFreeEvent && minPrice !== null ? (
                        <span className="text-sm font-medium text-(--gray-500)">/ ticket</span>
                      ) : null}
                    </div>
                  </div>
                  {tiers.length > 0 ? (
                    <div className="flex items-center gap-1.5 rounded-full border border-(--blue-100) bg-(--blue-50) px-3 py-1 text-[11px] font-semibold text-(--brand-blue)">
                      <Ticket className="h-3.5 w-3.5" />
                      {tiers.length} tier{tiers.length > 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>

                {/* Summary grid */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
                  }}
                  className="mb-7 grid grid-cols-2 gap-3"
                >
                  {summaryItems.map((item) => (
                    <motion.div
                      key={item.label}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        show: { opacity: 1, y: 0 },
                      }}
                      className="rounded-2xl border border-(--gray-100) bg-(--gray-50)/60 p-3 transition-colors hover:border-(--blue-200) hover:bg-(--blue-50)/50"
                    >
                      <div className="flex items-center gap-2 text-(--gray-500)">
                        {item.icon}
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-semibold text-(--brand-navy)">
                        {item.value}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Tier list — selectable */}
                {tiers.length > 0 ? (
                  <div className="mb-7 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--gray-400)">
                      Pick your ticket
                    </p>
                    <div className="space-y-2">
                      {tiers.slice(0, 3).map((tier) => {
                        const isSelected = tier.id === selectedTierId
                        return (
                          <button
                            type="button"
                            key={tier.id ?? tier.name}
                            onClick={() => setSelectedTierId(tier.id ?? "")}
                            aria-pressed={isSelected}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${
                              isSelected
                                ? "border-(--brand-navy) bg-(--brand-navy)/5 ring-2 ring-(--brand-navy)/30"
                                : "border-(--gray-100) bg-white hover:border-(--brand-blue)/40 hover:bg-(--blue-50)/40"
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
                  </div>
                ) : null}

                {/* Get Tickets CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goToCheckout}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-(--brand-navy) px-6 py-4 font-poppins text-base font-bold text-white shadow-lg shadow-(--brand-navy)/20 transition-all hover:shadow-xl"
                >
                  <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Ticket className="relative h-5 w-5" />
                  <span className="relative">Get Tickets</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>

                <p className="mt-3 text-center text-[11px] text-(--gray-500)">
                  Secure checkout · Instant e-tickets
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 grid w-full grid-cols-1 gap-y-6 gap-x-12 md:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">Date: {formatDate(event.date)}</p>
          </div>
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">
              Time: {event.startTime ?? "8 AM"} {event.endTime ? `- ${event.endTime}` : "Onwards"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">
              Venue: <span className="underline decoration-1 underline-offset-4">{event.venue}</span>
            </p>
          </div>
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">Age Eligibility: {ageRange}</p>
          </div>
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">
              Tickets:{" "}
              {tiers.length > 0
                ? tiers
                    .map((t) => `${t.name} (${Number(t.price) === 0 ? "Free" : formatCurrency(Number(t.price))})`)
                    .join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-lg font-semibold text-(--black)">
              Entry Time: {event.startTime ?? "As per event"}
            </p>
          </div>
        </motion.div>

        {/* About / Highlights */}
        <div className="w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-(--gray-200) bg-(--white) p-8 shadow-sm"
          >
            <h3 className="mb-4 text-lg font-bold text-(--black)">About the Event</h3>
            <p className="mb-6 leading-relaxed text-(--gray-600)">{event.description}</p>

            {timeSlots.length > 0 ? (
              <>
                <h3 className="mb-3 text-lg font-bold text-(--black)">Event Schedule</h3>
                <div className="mb-6 flex flex-col gap-2">
                  {timeSlots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-(--gray-200) bg-(--gray-50) px-4 py-2.5">
                      <span className="min-w-36 shrink-0 text-sm font-semibold text-(--brand-blue)">
                        {slot.startTime} – {slot.endTime}
                      </span>
                      <span className="text-sm text-(--gray-700)">{slot.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <h3 className="mb-4 text-lg font-bold text-(--black)">Event Highlights</h3>
            <ul className="list-disc space-y-2 pl-5 text-(--gray-600)">
              {event.tagline ? <li>{event.tagline}</li> : null}
              {eventHighlights.length > 0 ? (
                eventHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)
              ) : (
                <li>{event.category ?? "Live Event"}</li>
              )}
              {event.transportToEvent ? <li>{event.transportToEvent}</li> : null}
            </ul>
          </motion.div>

          {isLoggedIn ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-(--gray-200) bg-(--white) p-8 text-center shadow-sm"
            >
              <div className="mb-4 flex justify-center">
                <CalendarX2 className="h-10 w-10 text-(--black)" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-(--black)">Can&apos;t make it this time?</h3>
              <p className="mx-auto mb-6 max-w-lg text-(--gray-600)">
                It would have been better to have this event some other time of the year
              </p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full bg-brand-900 px-6 text-(--white) hover:bg-(--black)/90">
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
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="item-1"
                className="rounded-xl border border-(--gray-200) bg-(--white) px-6 last:border-b data-[state=open]:pb-4"
              >
                <AccordionTrigger className="py-6 text-lg font-bold text-(--black) hover:no-underline">
                  Terms & Conditions
                </AccordionTrigger>
                <AccordionContent className="text-(--gray-600)">
                  <ul className="list-disc space-y-2 pl-5">
                    {guidelineItems.length > 0 ? (
                      guidelineItems.map((item) => <li key={item}>{item}</li>)
                    ) : (
                      <>
                        <li>Tickets once booked cannot be exchanged or refunded.</li>
                        <li>An internet handling fee per ticket may be levied. Please check the final amount before payment.</li>
                        <li>We recommend arriving at least 20 minutes before event start time.</li>
                        <li>Rights of admission reserved.</li>
                      </>
                    )}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
