"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Gift,
  Lock,
  LogIn,
  Mail,
  MapPin,
  ShieldCheck,
  Ticket,
  User,
  UserPlus,
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
import { TermsDialog } from "@/components/common/terms-dialog"

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

export default function CheckoutClient({ event }: { event: EventDetail }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { session, user, profile } = useAuth()
  const { open, openModal } = useAuthModal()

  const isLoggedIn = Boolean(session?.user)
  const accountEmail = session?.user?.email ?? ""

  const lockedTierId = searchParams.get("tierId") ?? ""

  const [bookingFor, setBookingFor] = useState<"self" | "other">("self")
  const [guestName, setGuestName] = useState(profile?.full_name ?? "")
  const [guestPhone, setGuestPhone] = useState(profile?.phone ?? "")
  const [guestEmail, setGuestEmail] = useState(accountEmail)
  const [sendCopyToMe, setSendCopyToMe] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedTierId, setSelectedTierId] = useState(lockedTierId)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)
  const [coverImageSrc, setCoverImageSrc] = useState(getEventCoverImageUrl(event.id, event.updatedAt))

  useEffect(() => {
    if (bookingFor !== "self") return
    if (profile?.full_name) setGuestName((prev) => prev || profile.full_name!)
    if (profile?.phone) setGuestPhone((prev) => prev || profile.phone!)
    if (accountEmail) setGuestEmail((prev) => prev || accountEmail)
  }, [profile?.full_name, profile?.phone, accountEmail, bookingFor])

  const switchBookingFor = (next: "self" | "other") => {
    if (next === bookingFor) return
    setBookingFor(next)
    setCheckoutError(null)
    if (next === "other") {
      setGuestName("")
      setGuestPhone("")
      setGuestEmail("")
      setSendCopyToMe(true)
    } else {
      setGuestName(profile?.full_name ?? "")
      setGuestPhone(profile?.phone ?? "")
      setGuestEmail(accountEmail)
      setSendCopyToMe(false)
    }
  }

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

  const selectedTier = useMemo(() => {
    if (tiers.length === 0) return undefined
    if (!selectedTierId) return tiers[0]
    return tiers.find((tier) => tier.id === selectedTierId) ?? tiers[0]
  }, [tiers, selectedTierId])

  const effectiveTierId = selectedTier?.id ?? selectedTierId
  const tierPrice = Number(selectedTier?.price ?? 0)
  const isFreeEvent = tierPrice === 0
  const subtotal = useMemo(() => Number((tierPrice * quantity).toFixed(2)), [quantity, tierPrice])
  const PLATFORM_FEE_PER_TICKET = 10
  const platformFee = useMemo(
    () => (isFreeEvent ? 0 : PLATFORM_FEE_PER_TICKET * quantity),
    [isFreeEvent, quantity]
  )
  const gatewayFee = useMemo(
    () => (isFreeEvent ? 0 : Number((subtotal * 0.02 * 1.18).toFixed(2))),
    [isFreeEvent, subtotal]
  )
  const totalAmount = useMemo(
    () => Number((subtotal + platformFee + gatewayFee).toFixed(2)),
    [gatewayFee, platformFee, subtotal]
  )

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      setCheckoutError("Please login to continue.")
      openBookingAuthModal("login")
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
    if (bookingFor === "other") {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())
      if (!emailOk) {
        setCheckoutError("Please enter a valid email for the attendee.")
        return
      }
    }
    if (!termsAccepted) {
      setCheckoutError("Please accept terms and conditions to continue.")
      return
    }

    setCheckoutError(null)
    setCheckoutSuccess(null)
    setCheckoutLoading(true)

    try {
      const orderResponse = await apiRequest<{ data: { order: CreateOrderResponse } }>(
        `/events/${event.id}/orders`,
        {
          method: "POST",
          auth: true,
          body: JSON.stringify({
            ticketTierId: effectiveTierId,
            quantity,
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim(),
            guestPhone: guestPhone.trim(),
            bookingFor,
            sendCopyToBooker: bookingFor === "other" ? sendCopyToMe : false,
          }),
        }
      )

      const order = orderResponse.data.order

      if (isFreeEvent || order.breakdown.totalAmount === 0) {
        setCheckoutSuccess("Your free ticket has been confirmed!")
        const ticketHref = order.ticket?.id ? `/order-confirmed/${order.ticket.id}` : "/history"
        if (user?.onboardingStatus !== "COMPLETED") {
          router.push(`/onboarding?next=${encodeURIComponent(ticketHref)}`)
          return
        }
        router.push(ticketHref)
        return
      }

      await loadRazorpayScript()
      const Razorpay = window.Razorpay
      if (!Razorpay) throw new Error("Razorpay failed to load.")

      const razorpay = new Razorpay({
        key: order.providerKeyId,
        amount: Math.round(order.breakdown.totalAmount * 100),
        currency: order.breakdown.currency,
        name: "Baatasari",
        description: event.title,
        order_id: order.providerOrderId,
        prefill: {
          name: guestName.trim(),
          email: guestEmail.trim(),
          contact: guestPhone.trim(),
        },
        theme: { color: "#0c1d37" },
        handler: async (payment: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
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
            const ticketHref = ticketId ? `/order-confirmed/${ticketId}` : "/history"

            if (user?.onboardingStatus !== "COMPLETED") {
              router.push(`/onboarding?next=${encodeURIComponent(ticketHref)}`)
              return
            }
            router.push(ticketHref)
          } catch (verifyError) {
            setCheckoutError(
              verifyError instanceof Error
                ? verifyError.message
                : "Payment was received but verification failed. Please contact support."
            )
          }
        },
        modal: {
          ondismiss: () => setCheckoutLoading(false),
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
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-(--brand-navy) via-[#142a4f] to-[#1a3a6b]">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-(--royal-blue)/35 blur-[140px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -right-40 h-[40rem] w-[40rem] rounded-full bg-sky-400/25 blur-[140px]"
        />
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 h-[50rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,rgba(255,255,255,0.06),transparent_30%,rgba(186,215,255,0.08),transparent_70%)] blur-2xl"
        />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 pt-8 pb-4 md:px-6 md:pt-12 lg:px-10">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 md:py-12 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-6xl"
          >
            <h1 className="font-bricolage text-3xl font-bold text-white md:text-5xl">
              Complete your booking
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70 md:text-base">
              Review your details and confirm your tickets for{" "}
              <span className="font-semibold text-white">{event.title}</span>.
            </p>
          </motion.div>

          <div className="mx-auto mt-8 max-w-6xl space-y-6">
            {/* TOP — Event summary card */}
            <motion.aside
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col md:flex-row">
                  <div className="relative h-44 w-full overflow-hidden md:h-auto md:w-72 md:shrink-0">
                    <Image
                      src={coverImageSrc}
                      alt={event.title}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() => setCoverImageSrc("/e1.png")}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#0C1D37]/80 to-transparent md:bg-linear-to-r" />
                    <div className="absolute inset-x-0 bottom-0 p-4 md:hidden">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/90">
                        You&apos;re booking
                      </p>
                      <h3 className="font-bricolage text-lg font-bold leading-tight text-white">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex-1 p-5 md:p-6">
                    <div className="hidden md:block">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-200/90">
                        You&apos;re booking
                      </p>
                      <h3 className="mt-1 font-bricolage text-xl font-bold leading-tight text-white">
                        {event.title}
                      </h3>
                    </div>

                    <div className="grid gap-3 text-sm text-white/90 md:mt-4 md:grid-cols-3">
                      <div className="flex items-start gap-3">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                            Date & Time
                          </p>
                          <p className="font-semibold">
                            {formatDate(event.date)} · {event.startTime ?? "8 AM"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                            Venue
                          </p>
                          <p className="font-semibold">{event.venue ?? "TBA"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                            Ticket
                          </p>
                          <p className="font-semibold">{selectedTier?.name ?? "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isFreeEvent || isLoggedIn ? (
                    <div className="border-t border-white/10 bg-white/5 p-5 md:flex md:flex-col md:items-center md:justify-center md:border-l md:border-t-0 md:px-8">
                      <span className="text-xs uppercase tracking-wider text-white/60">Ticket price</span>
                      <span className="font-bricolage text-2xl font-bold text-white">
                        {isFreeEvent ? "Free" : formatCurrency(subtotal)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-white/60">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                256-bit SSL encryption · PCI compliant
              </p>
            </motion.aside>

            {/* Form (foggy when not logged in) */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className={`relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] p-1 shadow-2xl backdrop-blur-xl`}
              >
                <div
                  className={`rounded-[1.4rem] bg-white p-6 md:p-8 transition-all duration-500 ${
                    !isLoggedIn ? "pointer-events-none select-none blur-[14px]" : ""
                  }`}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void handleCheckout()
                    }}
                    className="space-y-7"
                  >
                    {/* Personal */}
                    <section className="space-y-4">
                      <div className="flex flex-col gap-3 border-b border-(--gray-200) pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-base font-semibold text-[#0C1D37] sm:text-lg">
                          Personal Details
                        </h3>

                        {/* For myself / For another Baatasari toggle */}
                        <div className="inline-flex rounded-full border border-(--gray-200) bg-(--gray-50) p-1 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => switchBookingFor("self")}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                              bookingFor === "self"
                                ? "bg-(--brand-navy) text-white shadow-sm"
                                : "text-(--gray-600) hover:text-(--brand-navy)"
                            }`}
                          >
                            <User className="h-3.5 w-3.5" />
                            For myself
                          </button>
                          <button
                            type="button"
                            onClick={() => switchBookingFor("other")}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all ${
                              bookingFor === "other"
                                ? "bg-(--brand-navy) text-white shadow-sm"
                                : "text-(--gray-600) hover:text-(--brand-navy)"
                            }`}
                          >
                            <Gift className="h-3.5 w-3.5" />
                            For another Baatasari
                          </button>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {bookingFor === "other" ? (
                          <motion.div
                            key="other-hint"
                            initial={{ opacity: 0, y: -6, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -6, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="flex items-start gap-3 rounded-2xl border border-(--blue-100) bg-(--blue-50)/60 px-4 py-3 text-xs text-(--brand-blue)">
                              <Gift className="mt-0.5 h-4 w-4 shrink-0" />
                              <p>
                                Booking on behalf of someone? Enter their details below — the ticket will be issued in their name.
                              </p>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      <div>
                        <label htmlFor="name" className="mb-2 block text-xs font-medium text-(--gray-700) sm:text-sm">
                          {bookingFor === "other" ? "Attendee's Full Name *" : "Full Name *"}
                        </label>
                        <Input
                          id="name"
                          type="text"
                          placeholder={bookingFor === "other" ? "Enter attendee's full name" : "Enter your full name"}
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value)
                            setCheckoutError(null)
                          }}
                          className="w-full rounded-lg border border-(--gray-300) px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-2 block text-xs font-medium text-(--gray-700) sm:text-sm">
                          {bookingFor === "other" ? "Attendee's Email *" : "Email *"}
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={guestEmail}
                          placeholder={bookingFor === "other" ? "attendee@example.com" : ""}
                          disabled={bookingFor === "self"}
                          onChange={(e) => {
                            setGuestEmail(e.target.value)
                            setCheckoutError(null)
                          }}
                          className={`w-full rounded-lg border border-(--gray-300) px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base ${
                            bookingFor === "self" ? "bg-slate-50" : "bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label htmlFor="mobile" className="mb-2 block text-xs font-medium text-(--gray-700) sm:text-sm">
                          {bookingFor === "other" ? "Attendee's Mobile Number *" : "Mobile Number *"}
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-(--gray-500) sm:text-sm">
                            +91
                          </span>
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="10-digit mobile number"
                            value={guestPhone}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "")
                              if (v.length <= 10) setGuestPhone(v)
                              setCheckoutError(null)
                            }}
                            inputMode="numeric"
                            className="w-full rounded-lg border border-(--gray-300) py-2 pl-10 pr-3 text-sm sm:py-3 sm:pl-12 sm:pr-4 sm:text-base"
                          />
                        </div>
                      </div>

                      {/* Send a copy to my email */}
                      <AnimatePresence>
                        {bookingFor === "other" ? (
                          <motion.label
                            key="send-copy"
                            initial={{ opacity: 0, y: -4, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -4, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-(--gray-200) bg-white p-4 transition-colors hover:border-(--brand-navy)/40"
                          >
                            <input
                              type="checkbox"
                              checked={sendCopyToMe}
                              onChange={(e) => setSendCopyToMe(e.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-(--gray-300) text-[#0C1D37] focus:ring-2 focus:ring-[#0C1D37]"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#0C1D37]">
                                <Mail className="h-4 w-4" />
                                Send a copy to my email too
                              </div>
                              <p className="mt-0.5 text-xs text-(--gray-500)">
                                Confirmation will also be sent to{" "}
                                <span className="font-medium text-(--brand-navy)">{accountEmail || "your account email"}</span>
                              </p>
                            </div>
                          </motion.label>
                        ) : null}
                      </AnimatePresence>
                    </section>

                    {/* Booking */}
                    <section className="space-y-4">
                      <h3 className="border-b border-(--gray-200) pb-2 text-base font-semibold text-[#0C1D37] sm:text-lg">
                        Booking Details
                      </h3>

                      {selectedTier ? (
                        <div>
                          <p className="mb-2 block text-xs font-medium text-(--gray-700) sm:text-sm">
                            Ticket Type
                          </p>
                          <div className="flex items-center justify-between rounded-lg border border-(--gray-200) bg-(--gray-50) px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0C1D37]">{selectedTier.name}</p>
                              {selectedTier.description ? (
                                <p className="mt-0.5 text-xs text-(--gray-500)">{selectedTier.description}</p>
                              ) : null}
                            </div>
                            <p className="ml-3 shrink-0 text-sm font-bold text-[#0C1D37]">
                              {tierPrice === 0 ? "Free" : formatCurrency(tierPrice)}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <div>
                        <label htmlFor="tickets" className="mb-2 block text-xs font-medium text-(--gray-700) sm:text-sm">
                          No. of Tickets *{" "}
                          <span className="text-xs font-normal text-(--gray-400)">(max 10)</span>
                        </label>
                        <Input
                          id="tickets"
                          type="number"
                          min={1}
                          max={10}
                          value={quantity}
                          onChange={(e) => {
                            const n = Number(e.target.value)
                            if (!Number.isNaN(n)) setQuantity(Math.max(1, Math.min(10, n)))
                          }}
                          className="w-full rounded-lg border border-(--gray-300) px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base"
                        />
                      </div>
                    </section>

                    {/* Order summary card */}
                    <div className="rounded-2xl border-2 border-[#0C1D37] bg-(--white) p-4 shadow-lg">
                      <h3 className="mb-4 text-center text-xl font-bold text-[#0C1D37]">Order Summary</h3>
                      {isFreeEvent ? (
                        <div className="py-2 text-center">
                          <span className="text-3xl font-bold text-emerald-600">Free</span>
                          <p className="mt-1 text-sm text-(--gray-500)">No charges — this is a free event</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--gray-600)">
                              {selectedTier?.name} ({formatCurrency(tierPrice)} × {quantity})
                            </span>
                            <span className="font-medium text-(--gray-800)">{formatCurrency(subtotal)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--gray-600)">Platform Fee (₹10 × {quantity})</span>
                            <span className="font-medium text-(--gray-800)">+ {formatCurrency(platformFee)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-(--gray-600)">Payment Gateway (2% + GST)</span>
                            <span className="font-medium text-(--gray-800)">+ {formatCurrency(gatewayFee)}</span>
                          </div>
                          <div className="my-3 border-t-2 border-dashed border-(--gray-300)" />
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-[#0C1D37]">Total Amount</span>
                            <span className="text-2xl font-bold text-[#0C1D37]">{formatCurrency(totalAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms */}
                    <label className="flex cursor-pointer items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-(--gray-300) text-[#0C1D37] focus:ring-2 focus:ring-[#0C1D37] sm:h-5 sm:w-5"
                      />
                      <span className="text-xs text-(--gray-700) sm:text-sm">
                        I accept the{" "}
                        <TermsDialog>
                          <button
                            type="button"
                            className="font-medium text-[#0C1D37] underline-offset-2 hover:underline"
                          >
                            terms and conditions
                          </button>
                        </TermsDialog>
                      </span>
                    </label>

                    {checkoutError ? (
                      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
                        {checkoutError}
                      </p>
                    ) : null}
                    {checkoutSuccess ? (
                      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {checkoutSuccess}
                      </p>
                    ) : null}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={checkoutLoading || !tiers.length}
                      className="w-full rounded-xl bg-[#0C1D37] px-4 py-3 text-base font-semibold text-(--white) shadow-lg transition-all hover:bg-[#0A172C] hover:shadow-xl disabled:opacity-60 sm:px-6 sm:py-4 sm:text-lg"
                    >
                      {checkoutLoading ? "Processing..." : isFreeEvent ? "Get Free Ticket" : "Pay Now"}
                    </motion.button>
                  </form>
                </div>
              </motion.div>

              {/* Fog overlay + login card */}
              <AnimatePresence>
                {!isLoggedIn ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl"
                  >
                    {/* Extra fog layers */}
                    <div className="absolute inset-0 rounded-3xl bg-white/30 backdrop-blur-2xl" />
                    <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-white/30 via-white/10 to-white/40" />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="relative mx-4 w-full max-w-md rounded-3xl border border-white/30 bg-white/95 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--brand-navy) text-white shadow-lg shadow-(--brand-navy)/30">
                        <Lock className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                        Login required
                      </p>
                      <h3 className="mt-2 text-center font-bricolage text-2xl font-bold text-slate-900">
                        Sign in to checkout
                      </h3>
                      <p className="mt-2 text-center text-sm text-slate-600">
                        Securely complete your booking for{" "}
                        <span className="font-semibold text-slate-800">{event.title}</span>.
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          onClick={() => openBookingAuthModal("login")}
                          className="rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          Login
                        </Button>
                        <Button
                          type="button"
                          onClick={() => openBookingAuthModal("register")}
                          className="rounded-xl bg-(--brand-navy) text-white hover:bg-(--brand-navy)/90"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Register
                        </Button>
                      </div>

                      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Your information is encrypted end-to-end.
                      </div>
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
