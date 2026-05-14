"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  MapPin,
  CalendarX2,
  CalendarPlus,
  HelpCircle,
  Footprints,
  Car,
  Bus,
  Flag,
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { useAuthModal } from "@/components/auth/auth-modal-context"
import { apiRequest } from "@/lib/api/client"
import { getEventCoverImageUrl } from "@/lib/event-cover"
import { formatCurrency, formatDate } from "@/lib/format"
import { loadRazorpayScript } from "@/lib/payments/razorpay"
import type { ApiError, EventDetail } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type CreateOrderResponse = {
  orderId: string
  orderNumber: string
  providerOrderId: string
  providerKeyId: string
  eventId: string
  breakdown: {
    subtotal: number
    taxAmount: number
    platformFee: number
    totalAmount: number
    currency: string
  }
  ticket?: { id: string }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean) : []

export default function EventDetailClient({ event }: { event: EventDetail }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, user, profile } = useAuth()
  const { open, openModal } = useAuthModal()

  const [guestName, setGuestName] = useState(profile?.full_name ?? "")
  const [guestPhone, setGuestPhone] = useState(profile?.phone ?? "")

  useEffect(() => {
    if (profile?.full_name) setGuestName((prev) => prev || profile.full_name!)
    if (profile?.phone) setGuestPhone((prev) => prev || profile.phone!)
  }, [profile?.full_name, profile?.phone])
  const [quantity, setQuantity] = useState(1)
  const [selectedTierId, setSelectedTierId] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)
  const [coverImageSrc, setCoverImageSrc] = useState(getEventCoverImageUrl(event.id, event.updatedAt))

  const isLoggedIn = Boolean(session?.user)
  const guestEmail = session?.user?.email ?? ""

  const openBookingAuthModal = (mode: "login" | "register") => {
    const params = new URLSearchParams(searchParams.toString())
    if (params.get("redirect") !== pathname) {
      params.set("redirect", pathname)
      const nextHref = params.size ? `${pathname}?${params.toString()}` : pathname
      router.replace(nextHref, { scroll: false })
    }
    openModal(mode)
  }

  useEffect(() => {
    if (open || isLoggedIn) return
    if (searchParams.get("redirect") !== pathname) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete("redirect")
    const nextHref = params.size ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextHref, { scroll: false })
  }, [isLoggedIn, open, pathname, router, searchParams])

  const tiers = event.ticketTiers ?? []
  const isFreeEvent = tiers.length > 0 && tiers.every((t) => Number(t.price) === 0)

  const selectedTier = useMemo(() => {
    if (tiers.length === 0) return undefined
    if (!selectedTierId) return tiers[0]
    return tiers.find((tier) => tier.id === selectedTierId) ?? tiers[0]
  }, [tiers, selectedTierId])

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

  const effectiveTierId = selectedTier?.id ?? selectedTierId
  const tierPrice = Number(selectedTier?.price ?? 0)
  const subtotal = useMemo(() => Number((tierPrice * quantity).toFixed(2)), [quantity, tierPrice])
  const PLATFORM_FEE_PER_TICKET = 10
  const platformFee = useMemo(() => (isFreeEvent ? 0 : PLATFORM_FEE_PER_TICKET * quantity), [isFreeEvent, quantity])
  const gatewayFee = useMemo(() => (isFreeEvent ? 0 : Number((subtotal * 0.02 * 1.18).toFixed(2))), [isFreeEvent, subtotal])
  const totalAmount = useMemo(() => Number((subtotal + platformFee + gatewayFee).toFixed(2)), [gatewayFee, platformFee, subtotal])

  const handleCheckout = async (eventDetail: EventDetail) => {
    if (!isLoggedIn) {
      setCheckoutError("Please register or login first.")
      openBookingAuthModal("register")
      return
    }

    if (!effectiveTierId) {
      setCheckoutError("No ticket tier available for this event.")
      return
    }

    if (!guestName.trim()) {
      setCheckoutError("Please enter your full name.")
      return
    }

    if (!guestPhone.trim()) {
      setCheckoutError("Please enter your phone number.")
      return
    }

    if (!termsAccepted) {
      setCheckoutError("Please accept terms and conditions to continue.")
      return
    }

    setCheckoutError(null)
    setCheckoutSuccess(null)
    setCheckoutLoading(true)

    try {
      const orderResponse = await apiRequest<{ data: { order: CreateOrderResponse } }>(`/events/${event.id}/orders`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          ticketTierId: effectiveTierId,
          quantity,
          guestName: guestName.trim(),
          guestEmail,
          guestPhone: guestPhone.trim(),
        }),
      })

      const order = orderResponse.data.order

      if (isFreeEvent || order.breakdown.totalAmount === 0) {
        setCheckoutSuccess("Your free ticket has been confirmed!")
        const ticketHref = order.ticket?.id ? `/history/${order.ticket.id}` : "/history"
        if (user?.onboardingStatus !== "COMPLETED") {
          router.push(`/onboarding?next=${encodeURIComponent(ticketHref)}`)
          return
        }
        router.push(ticketHref)
        return
      }

      await loadRazorpayScript()
      const Razorpay = window.Razorpay

      if (!Razorpay) {
        throw new Error("Razorpay failed to load.")
      }

      const razorpay = new Razorpay({
        key: order.providerKeyId,
        amount: Math.round(order.breakdown.totalAmount * 100),
        currency: order.breakdown.currency,
        name: "Baatasari",
        description: eventDetail.title,
        order_id: order.providerOrderId,
        prefill: {
          name: guestName.trim(),
          email: guestEmail,
          contact: guestPhone.trim(),
        },
        theme: { color: "#0c1d37" },
        handler: async (payment: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verifyResponse = await apiRequest<{ data: { result: { ticket?: { id?: string } } } }>(
            "/payments/razorpay/verify",
            {
              method: "POST",
              auth: true,
              body: JSON.stringify({
                orderId: order.orderId,
                razorpayOrderId: payment.razorpay_order_id,
                razorpayPaymentId: payment.razorpay_payment_id,
                razorpaySignature: payment.razorpay_signature,
              }),
            }
          )

          setCheckoutSuccess("Payment verified successfully.")

          const ticketId = verifyResponse.data.result.ticket?.id
          const ticketHref = ticketId ? `/history/${ticketId}` : "/history"

          if (user?.onboardingStatus !== "COMPLETED") {
            router.push(`/onboarding?next=${encodeURIComponent(ticketHref)}`)
            return
          }

          router.push(ticketHref)
        },
      })

      razorpay.open()
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const apiError = error as ApiError
        setCheckoutError(apiError.message)
      } else {
        setCheckoutError(error instanceof Error ? error.message : "Payment could not be started.")
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-(--white) flex flex-col items-center justify-center">
      <main className="flex-1 w-full px-4 py-8 md:py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-12 items-stretch mb-12 w-full min-h-[calc(100dvh-9rem)]">
          <div className="space-y-6 sm:space-y-8">
            <div className="relative overflow-hidden rounded-2xl shadow-lg h-[calc(100dvh-9rem)] w-full">
              <Image
                src={coverImageSrc}
                alt={event.title}
                fill
                className="object-cover object-center"
                priority
                unoptimized
                onError={() => setCoverImageSrc("/e1.png")}
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#0C1D37]/70 to-transparent" />
            </div>
          </div>

          <div className="lg:sticky lg:top-4 self-start">
            <h1 className="text-3xl md:text-4xl font-bold text-(--brand-blue) mb-6 text-left font-bricolage">
              {event.title}
            </h1>

            <div className="bg-(--white) rounded-2xl shadow-xl overflow-hidden border border-(--gray-200) h-fit relative">
              <div
                className={`p-2 sm:p-4 lg:p-8 h-auto lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto ${
                  !isLoggedIn ? "blur-sm pointer-events-none select-none" : ""
                }`}
                style={{ scrollbarWidth: "thin", scrollbarColor: "#0C1D37 transparent" }}
              >
                <form
                  className="space-y-4 sm:space-y-6"
                  onSubmit={(formEvent) => {
                    formEvent.preventDefault()
                    void handleCheckout(event)
                  }}
                >
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-[#0C1D37] pb-2 border-b border-(--gray-200)">
                      Personal Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-(--gray-700) mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          id="name"
                          placeholder="Enter your full name"
                          value={guestName}
                          onChange={(inputEvent) => setGuestName(inputEvent.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-(--gray-300) rounded-lg focus-visible:ring-2 focus-visible:ring-[#0C1D37] focus-visible:border-transparent transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-(--gray-700) mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          id="email"
                          value={guestEmail}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-(--gray-300) rounded-lg bg-slate-50 text-sm sm:text-base"
                          disabled
                        />
                      </div>

                      <div>
                        <label htmlFor="mobile" className="block text-xs sm:text-sm font-medium text-(--gray-700) mb-2">
                          Mobile Number *
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-(--gray-500) text-xs sm:text-sm">
                            +91
                          </span>
                          <Input
                            type="tel"
                            id="mobile"
                            placeholder="Enter your 10-digit mobile number"
                            value={guestPhone}
                            onChange={(inputEvent) => {
                              const value = inputEvent.target.value.replace(/\D/g, "")
                              if (value.length <= 10) setGuestPhone(value)
                            }}
                            inputMode="numeric"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-(--gray-300) rounded-lg focus-visible:ring-2 focus-visible:ring-[#0C1D37] focus-visible:border-transparent transition-all duration-200 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-[#0C1D37] pb-2 border-b border-(--gray-200)">
                      Booking Details
                    </h3>

                    {tiers.length > 1 ? (
                      <div>
                        <label htmlFor="tier" className="block text-xs sm:text-sm font-medium text-(--gray-700) mb-2">
                          Ticket Type *
                        </label>
                        <select
                          id="tier"
                          value={effectiveTierId}
                          onChange={(selectEvent) => setSelectedTierId(selectEvent.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-(--gray-300) rounded-lg focus-visible:ring-2 focus-visible:ring-[#0C1D37] focus-visible:border-transparent transition-all duration-200 text-sm sm:text-base bg-white"
                        >
                          {tiers.map((tier) => (
                            <option key={tier.id ?? tier.name} value={tier.id}>
                              {tier.name} — {Number(tier.price) === 0 ? "Free" : formatCurrency(Number(tier.price))}
                            </option>
                          ))}
                        </select>
                        {selectedTier?.description ? (
                          <p className="mt-1.5 text-xs text-(--gray-500)">{selectedTier.description}</p>
                        ) : null}
                      </div>
                    ) : tiers.length === 1 ? (
                      <div className="rounded-lg border border-(--gray-200) bg-(--gray-50) px-4 py-3">
                        <p className="text-sm font-semibold text-[#0C1D37]">{tiers[0]?.name}</p>
                        {tiers[0]?.description ? (
                          <p className="mt-0.5 text-xs text-(--gray-500)">{tiers[0].description}</p>
                        ) : null}
                      </div>
                    ) : null}

                    <div>
                      <label htmlFor="tickets" className="block text-xs sm:text-sm font-medium text-(--gray-700) mb-2">
                        No. of Tickets * <span className="text-xs font-normal text-(--gray-400)">(max 10)</span>
                      </label>
                      <Input
                        type="number"
                        id="tickets"
                        min={1}
                        max={10}
                        value={quantity}
                        onChange={(inputEvent) => {
                          const nextValue = Number(inputEvent.target.value)
                          if (!Number.isNaN(nextValue)) setQuantity(Math.max(1, Math.min(10, nextValue)))
                        }}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-(--gray-300) rounded-lg focus-visible:ring-2 focus-visible:ring-[#0C1D37] focus-visible:border-transparent transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="bg-(--white) p-4 rounded-2xl border-2 border-[#0C1D37] shadow-lg">
                    <h3 className="text-xl font-bold text-center text-[#0C1D37] mb-4">Order Summary</h3>
                    {isFreeEvent ? (
                      <div className="text-center py-2">
                        <span className="text-3xl font-bold text-emerald-600">Free</span>
                        <p className="text-sm text-(--gray-500) mt-1">No charges — this is a free event</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-(--gray-600)">
                            {selectedTier?.name} ({formatCurrency(tierPrice)} × {quantity}):
                          </span>
                          <span className="font-medium text-(--gray-800)">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-(--gray-600)">Platform Fee (₹10 × {quantity}):</span>
                          <span className="font-medium text-(--gray-800)">+ {formatCurrency(platformFee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-(--gray-600)">Payment Gateway (2% + GST):</span>
                          <span className="font-medium text-(--gray-800)">+ {formatCurrency(gatewayFee)}</span>
                        </div>
                        <div className="border-t-2 border-dashed border-(--gray-300) my-3" />
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-[#0C1D37]">Total Amount:</span>
                          <span className="text-2xl font-bold text-[#0C1D37]">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(inputEvent) => setTermsAccepted(inputEvent.target.checked)}
                        className="w-4 sm:w-5 h-4 sm:h-5 text-[#0C1D37] rounded focus:ring-[#0C1D37] focus:ring-2 mt-0.5 border-(--gray-300)"
                      />
                      <span className="text-xs sm:text-sm text-(--gray-700)">
                        I accept the{" "}
                        <a href="/terms&conditions" className="text-[#0C1D37] hover:underline font-medium">
                          terms and conditions
                        </a>
                      </span>
                    </label>
                  </div>

                  {checkoutError ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{checkoutError}</p>
                  ) : null}
                  {checkoutSuccess ? (
                    <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{checkoutSuccess}</p>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={checkoutLoading || !tiers.length}
                    className="w-full bg-[#0C1D37] hover:bg-[#0A172C] text-(--white) py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60"
                  >
                    {checkoutLoading ? "Processing..." : isFreeEvent ? "Get Free Ticket" : "Pay"}
                  </Button>
                </form>
              </div>

              {!isLoggedIn ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/45 backdrop-blur-[2px] p-5">
                  <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Continue Booking</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">Login or create an account</h3>
                      <p className="mt-2 text-sm text-slate-600">Use your account to unlock the ticket checkout form.</p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        onClick={() => openBookingAuthModal("login")}
                        className="rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      >
                        Login
                      </Button>
                      <Button
                        type="button"
                        onClick={() => openBookingAuthModal("register")}
                        className="rounded-xl bg-brand-900 text-white hover:bg-brand-800"
                      >
                        Register
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12 mb-12 w-full">
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">Date: {formatDate(event.date)}</p>
          </div>
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">
              Time: {event.startTime ?? "8 AM"} {event.endTime ? `- ${event.endTime}` : "Onwards"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">
              Venue: <span className="underline decoration-1 underline-offset-4">{event.venue}</span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">
              {(() => {
                const range = event.audienceRange as { min?: number; max?: number } | null | undefined
                if (range && typeof range.min === "number" && typeof range.max === "number") {
                  return `Age Eligibility: ${range.min}–${range.max} Years`
                }
                return "Age Eligibility: All Ages"
              })()}
            </p>
          </div>
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">
              Tickets:{" "}
              {tiers.length > 0
                ? tiers.map((t) => `${t.name} (${Number(t.price) === 0 ? "Free" : formatCurrency(Number(t.price))})`).join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-(--black) text-lg mb-1">Entry Time: {event.startTime ?? "As per event"}</p>
          </div>
        </div>

        <div className="space-y-8 w-full">
          <div className="border border-(--gray-200) rounded-xl p-8 bg-(--white) shadow-sm">
            <h3 className="font-bold text-lg text-(--black) mb-4">About the Event</h3>
            <p className="text-(--gray-600) mb-6 leading-relaxed">{event.description}</p>

            <h3 className="font-bold text-lg text-(--black) mb-4">Event Highlights</h3>
            <ul className="list-disc pl-5 space-y-2 text-(--gray-600)">
              {event.tagline ? <li>{event.tagline}</li> : null}
              {eventHighlights.length > 0
                ? eventHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)
                : <li>{event.category ?? "Live Event"}</li>}
              {event.transportToEvent ? <li>{event.transportToEvent}</li> : null}
            </ul>
          </div>

          <div className="border border-(--gray-200) rounded-xl p-8 bg-(--white) shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <CalendarX2 className="h-10 w-10 text-(--black)" />
            </div>
            <h3 className="font-bold text-lg text-(--black) mb-2">Can&apos;t make it this time?</h3>
            <p className="text-(--gray-600) mb-6 max-w-lg mx-auto">
              Can&apos;t attend on the scheduled date? You can request a different day that suits you and also view how many
              others are interested in the same.
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-brand-900 text-(--white) hover:bg-(--black)/90 rounded-full px-6">
                  <CalendarPlus className="h-4 w-4 mr-2" /> Request a New Date
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden w-[95vw] max-w-5xl rounded-3xl bg-(--white) border-0 max-h-[85vh] flex flex-col items-center justify-center">
                <VisuallyHidden>
                  <DialogTitle>Select Date and View Reviews</DialogTitle>
                </VisuallyHidden>
                <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex items-center justify-center">
                  <DateReviewsSection eventId={event.id} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border border-(--gray-200) rounded-xl bg-(--white) px-6 data-[state=open]:pb-4 last:border-b">
                <AccordionTrigger className="hover:no-underline font-bold text-(--black) text-lg py-6">
                  Terms & Conditions
                </AccordionTrigger>
                <AccordionContent className="text-(--gray-600)">
                  <ul className="list-disc pl-5 space-y-2">
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

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-2" className="border border-(--gray-200) rounded-xl bg-(--white) px-6 data-[state=open]:pb-4 last:border-b">
                <AccordionTrigger className="hover:no-underline font-bold text-(--black) text-lg py-6">
                  <span className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5" />
                    How to Get Here
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-(--gray-600)">
                  <div className="space-y-6 pt-2">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-brand-900 font-medium border-b border-(--gray-100) pb-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-(--gray-400)" />
                        <span>Venue: {event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bus className="h-4 w-4 text-(--gray-400)" />
                        <span>{event.transportToEvent || "Travel details will be shared by organizer."}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-(--gray-400)" />
                        <span>{event.entrySide || "Entry gate details shared before the event."}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="rounded-xl overflow-hidden min-h-75 relative bg-(--slate-100) border border-(--slate-200)">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-(--slate-400) gap-2">
                          <MapPin className="h-8 w-8 opacity-50" />
                          <span className="text-sm font-medium">Map View</span>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <h4 className="font-bold text-(--black) mb-3 text-base">First time this way?</h4>
                          <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                            <li>Ola/Uber autos and bikes are available in most areas.</li>
                            <li>Use nearby landmarks if drivers are unsure.</li>
                          </ul>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                              <Footprints className="h-4 w-4" /> By Foot
                            </h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                              <li>Walk from the nearest stop using venue signage.</li>
                              <li>Entry gate details are shared at check-in.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                              <Car className="h-4 w-4" /> By Car
                            </h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                              <li>Use Google Maps for the most accurate route.</li>
                              <li>Parking availability depends on venue capacity.</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-bold text-(--black) mb-2 text-base flex items-center gap-2">
                              <Bus className="h-4 w-4" /> By Bus
                            </h4>
                            <ul className="list-disc pl-5 space-y-1.5 text-sm text-(--gray-600)">
                              <li>Use the nearest city bus route to the venue area.</li>
                              <li>Walk a short distance from the last stop.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  )
}
