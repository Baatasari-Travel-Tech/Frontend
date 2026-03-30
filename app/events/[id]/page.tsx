"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, MapPin, ShieldCheck, Ticket } from "lucide-react"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format"
import { loadRazorpayScript } from "@/lib/payments/razorpay"
import type { ApiError, EventDetail } from "@/types/api"
import { SectionCard } from "@/components/platform/page-shell"
import { SkeletonGrid, StateBlock } from "@/components/platform/state-block"

const checkoutSchema = z.object({
  ticketTierId: z.string().min(1, "Select a ticket tier"),
  quantity: z.coerce.number().int().min(1).max(20),
  guestName: z.string().min(2, "Enter your full name"),
  guestEmail: z.string().email("Enter a valid email"),
  guestPhone: z.string().min(6, "Enter a valid phone number"),
})

const authSchemas = {
  login: z.object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
  register: z
    .object({
      email: z.string().email("Enter a valid email"),
      password: z.string().min(8, "Use at least 8 characters"),
      confirmPassword: z.string().min(8, "Confirm your password"),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
}

type CheckoutValues = z.infer<typeof checkoutSchema>
type LoginValues = z.infer<(typeof authSchemas)["login"]>
type RegisterValues = z.infer<(typeof authSchemas)["register"]>

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
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { session, user, profile, login, register } = useAuth()
  const [authMode, setAuthMode] = useState<"login" | "register">("register")
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)

  const eventQuery = useQuery({
    queryKey: ["public-event", params.id],
    queryFn: async () => {
      const response = await apiRequest<{ data: { event: EventDetail } }>(`/events/${params.id}`)
      return response.data.event
    },
  })

  const checkoutForm = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      ticketTierId: "",
      quantity: 1,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
    },
  })

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(authSchemas.login),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(authSchemas.register),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  useEffect(() => {
    const primaryTier = eventQuery.data?.ticketTiers[0]
    if (!primaryTier) return

    checkoutForm.reset({
      ticketTierId: primaryTier.id ?? "",
      quantity: checkoutForm.getValues("quantity") || 1,
      guestName: profile?.full_name ?? "",
      guestEmail: session?.user?.email ?? "",
      guestPhone: profile?.phone ?? "",
    })
  }, [checkoutForm, eventQuery.data?.ticketTiers, profile?.full_name, profile?.phone, session?.user?.email])

  const selectedTierId = checkoutForm.watch("ticketTierId")
  const quantity = checkoutForm.watch("quantity")

  const selectedTier = useMemo(
    () => eventQuery.data?.ticketTiers.find((tier) => tier.id === selectedTierId),
    [eventQuery.data?.ticketTiers, selectedTierId]
  )

  const summary = useMemo(() => {
    if (!selectedTier) {
      return { subtotal: 0, taxAmount: 0, platformFee: 0, totalAmount: 0 }
    }

    const subtotal = Number((selectedTier.price * quantity).toFixed(2))
    const taxAmount = Number((subtotal * 0.18).toFixed(2))
    const platformFee = Number((subtotal * 0.02).toFixed(2))
    const totalAmount = Number((subtotal + taxAmount + platformFee).toFixed(2))
    return { subtotal, taxAmount, platformFee, totalAmount }
  }, [quantity, selectedTier])

  const mapApiErrors = (error: ApiError, setError: (field: string, message: string) => void) => {
    error.errors?.forEach((entry) => {
      const segments = entry.field.split(".")
      setError(segments[segments.length - 1], entry.message)
    })
  }

  const handleInlineAuth = async () => {
    setAuthMessage(null)

    try {
      if (authMode === "login") {
        const isValid = await loginForm.trigger()
        if (!isValid) return
        await login(loginForm.getValues())
        setAuthMessage("Signed in. You can continue to payment now.")
        return
      }

      const isValid = await registerForm.trigger()
      if (!isValid) return
      const values = registerForm.getValues()
      await register({
        email: values.email,
        password: values.password,
        role: "USER",
      })
      setAuthMessage("Account created. Finish checkout and we’ll take you into onboarding after purchase.")
    } catch (error) {
      if (error && typeof error === "object" && "code" in error) {
        const apiError = error as ApiError
        mapApiErrors(apiError, (field, message) => {
          if (authMode === "login") {
            loginForm.setError(field as keyof LoginValues, { message })
          } else {
            registerForm.setError(field as keyof RegisterValues, { message })
          }
        })
        setAuthMessage(apiError.message)
        return
      }

      setAuthMessage(error instanceof Error ? error.message : "Authentication failed.")
    }
  }

  const handleCheckout = checkoutForm.handleSubmit(async (values) => {
    if (!session?.user) {
      setCheckoutError("Create an account or sign in to continue with ticket purchase.")
      return
    }

    setCheckoutError(null)
    setCheckoutSuccess(null)

    try {
      const orderResponse = await apiRequest<{ data: { order: CreateOrderResponse } }>(`/events/${params.id}/orders`, {
        method: "POST",
        auth: true,
        body: JSON.stringify(values),
      })

      await loadRazorpayScript()

      const order = orderResponse.data.order
      const Razorpay = window.Razorpay
      if (!Razorpay) {
        throw new Error("Razorpay failed to load.")
      }

      const razorpay = new Razorpay({
        key: order.providerKeyId,
        amount: Math.round(order.breakdown.totalAmount * 100),
        currency: order.breakdown.currency,
        name: "Baatasari",
        description: eventQuery.data?.title ?? "Event booking",
        order_id: order.providerOrderId,
        prefill: {
          name: values.guestName,
          email: values.guestEmail,
          contact: values.guestPhone,
        },
        theme: {
          color: "#0c1d37",
        },
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

          const ticketId = verifyResponse.data.result.ticket?.id
          const nextHref = ticketId ? `/history/${ticketId}` : "/history"
          setCheckoutSuccess("Payment verified successfully.")

          if (user?.onboardingStatus !== "COMPLETED") {
            router.push(`/onboarding?next=${encodeURIComponent(nextHref)}`)
            return
          }

          router.push(nextHref)
        },
      })

      razorpay.open()
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Payment could not be started.")
    }
  })

  if (eventQuery.isLoading) {
    return (
      <main className="page-x py-10">
        <SkeletonGrid />
      </main>
    )
  }

  if (eventQuery.isError || !eventQuery.data) {
    return (
      <main className="page-x py-10">
        <StateBlock
          tone="error"
          title="Event unavailable"
          description="This event could not be loaded from the public API. It may have been unpublished or the request failed."
        />
      </main>
    )
  }

  return (
    <main className="page-x py-8 sm:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(12,29,55,0.06)]">
            <div className="bg-[linear-gradient(135deg,_rgba(12,29,55,0.96),_rgba(59,95,143,0.86))] p-7 text-white sm:p-10">
              <p className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/80">
                {eventQuery.data.category ?? "Live event"}
              </p>
              <h1 className="mt-5 font-bricolage text-4xl leading-tight sm:text-5xl">{eventQuery.data.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78 sm:text-base">{eventQuery.data.description}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    <CalendarDays className="h-4 w-4" />
                    <span>{formatDateTime(eventQuery.data.date)}</span>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    <MapPin className="h-4 w-4" />
                    <span>{eventQuery.data.venue}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-5 p-6 sm:p-8 lg:grid-cols-2">
              <SectionCard title="Event snapshot">
                <div className="grid gap-4 text-sm text-slate-600">
                  <div>
                    <p className="font-medium text-slate-900">Date</p>
                    <p className="mt-1">{formatDate(eventQuery.data.date)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Venue</p>
                    <p className="mt-1">{eventQuery.data.venue}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Capacity</p>
                    <p className="mt-1">{eventQuery.data.capacity} attendees</p>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="What to expect">
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    {eventQuery.data.tagline ?? "A polished, ticketed event experience with backend-sourced availability."}
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                    {eventQuery.data.transportToEvent ?? "Transport guidance will appear here when the organizer adds it."}
                  </div>
                </div>
              </SectionCard>
            </div>
          </section>

          <SectionCard
            title="Available ticket tiers"
            description="Choose the tier that fits your plan. Pricing and final totals are confirmed by the backend during order creation."
          >
            <div className="grid gap-4">
              {eventQuery.data.ticketTiers.map((tier) => (
                <button
                  key={tier.id ?? tier.name}
                  type="button"
                  onClick={() => checkoutForm.setValue("ticketTierId", tier.id ?? "")}
                    className={`rounded-[1.5rem] border p-5 text-left transition ${
                    selectedTierId === tier.id
                      ? "border-brand-900 bg-brand-900/5"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{tier.name}</h2>
                      {tier.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{tier.description}</p> : null}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-semibold text-slate-950">{formatCurrency(tier.price)}</p>
                      <p className="mt-1 text-sm text-slate-500">{tier.quantity} total seats</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(12,29,55,0.06)] sm:p-7">
            {!session?.user ? (
              <SectionCard
                title="Sign up to continue"
                description="This route stays public for discovery, but ticket purchase requires an account so we can attach the ticket to your journey."
              >
                <div className="flex gap-2">
                  {(["register", "login"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setAuthMode(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        authMode === mode ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {mode === "register" ? "Create account" : "Login"}
                    </button>
                  ))}
                </div>

                <form
                  className="mt-5 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleInlineAuth()
                  }}
                >
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                      {...(authMode === "login" ? loginForm.register("email") : registerForm.register("email"))}
                    />
                    <p className="mt-1 text-xs text-rose-600">
                      {(authMode === "login"
                        ? loginForm.formState.errors.email?.message
                        : registerForm.formState.errors.email?.message) ?? ""}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                      {...(authMode === "login" ? loginForm.register("password") : registerForm.register("password"))}
                    />
                    <p className="mt-1 text-xs text-rose-600">
                      {(authMode === "login"
                        ? loginForm.formState.errors.password?.message
                        : registerForm.formState.errors.password?.message) ?? ""}
                    </p>
                  </div>

                  {authMode === "register" ? (
                    <div>
                      <label className="text-sm font-medium text-slate-700">Confirm password</label>
                      <input
                        type="password"
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                        {...registerForm.register("confirmPassword")}
                      />
                      <p className="mt-1 text-xs text-rose-600">{registerForm.formState.errors.confirmPassword?.message ?? ""}</p>
                    </div>
                  ) : null}

                  {authMessage ? (
                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {authMessage}
                    </div>
                  ) : null}

                  <button className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white">
                    {authMode === "register" ? "Create account" : "Login"}
                  </button>
                </form>
              </SectionCard>
            ) : null}

            <SectionCard
              title="Book your ticket"
              description={
                user?.onboardingStatus === "COMPLETED"
                  ? "Your ticket will be available in history immediately after successful payment."
                  : "You can complete payment now. We’ll send you into onboarding before you view the ticket."
              }
            >
              <form className="grid gap-4" onSubmit={(event) => void handleCheckout(event)}>
                <div>
                  <label className="text-sm font-medium text-slate-700">Ticket tier</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...checkoutForm.register("ticketTierId")}
                  >
                    {eventQuery.data.ticketTiers.map((tier) => (
                      <option key={tier.id ?? tier.name} value={tier.id}>
                        {tier.name} · {formatCurrency(tier.price)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-rose-600">{checkoutForm.formState.errors.ticketTierId?.message ?? ""}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                      {...checkoutForm.register("quantity", { valueAsNumber: true })}
                    />
                    <p className="mt-1 text-xs text-rose-600">{checkoutForm.formState.errors.quantity?.message ?? ""}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Starts at</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{formatCurrency(selectedTier?.price ?? 0)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Full name</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...checkoutForm.register("guestName")}
                  />
                  <p className="mt-1 text-xs text-rose-600">{checkoutForm.formState.errors.guestName?.message ?? ""}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...checkoutForm.register("guestEmail")}
                  />
                  <p className="mt-1 text-xs text-rose-600">{checkoutForm.formState.errors.guestEmail?.message ?? ""}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...checkoutForm.register("guestPhone")}
                  />
                  <p className="mt-1 text-xs text-rose-600">{checkoutForm.formState.errors.guestPhone?.message ?? ""}</p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-900" />
                    <div>
                      <p className="font-medium text-slate-900">Secure checkout</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Final totals are confirmed by the backend, and payment verification happens server-side before
                        the ticket is issued.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(summary.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Tax</span>
                    <span>{formatCurrency(summary.taxAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                    <span>Platform fee</span>
                    <span>{formatCurrency(summary.platformFee)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
                    <span>Total</span>
                    <span>{formatCurrency(summary.totalAmount)}</span>
                  </div>
                </div>

                {checkoutError ? (
                  <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {checkoutError}
                  </div>
                ) : null}
                {checkoutSuccess ? (
                  <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {checkoutSuccess}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={checkoutForm.formState.isSubmitting || !session?.user}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Ticket className="h-4 w-4" />
                  {session?.user ? "Continue to payment" : "Sign up to pay"}
                </button>
              </form>
            </SectionCard>

            <p className="text-center text-xs text-slate-500">
              By continuing you agree to the{" "}
              <Link href="/terms&conditions" className="font-semibold text-brand-900">
                Terms & Conditions
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
