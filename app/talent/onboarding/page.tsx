"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { formatCurrency } from "@/lib/format"
import { loadRazorpayScript } from "@/lib/payments/razorpay"

const schema = z.object({
  stageName: z.string().min(2, "Enter your stage name"),
  mainSkill: z.string().min(2, "Enter your main skill"),
  experienceLevel: z.string().min(2, "Select your experience level"),
  yearsOfExperience: z.string().min(1, "Enter your experience"),
  bio: z.string().min(20, "Tell us a bit more about your work"),
  preferredSlots: z.string().min(1, "Add at least one preferred slot"),
  availableFor: z.string().min(1, "Add at least one work type"),
  location: z.string().min(2, "Enter your location"),
  expectedPriceBand: z.string().min(1, "Enter your expected price band"),
  portfolioLinks: z.string().optional(),
})

type Values = z.infer<typeof schema>

type TalentOrderResponse = {
  providerKeyId: string
  providerOrderId: string
  amount: number
  currency: string
}

export default function TalentOnboardingPage() {
  const router = useRouter()
  const { talentProfile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      stageName: talentProfile?.stageName ?? "",
      mainSkill: talentProfile?.mainSkill ?? "",
      experienceLevel: talentProfile?.experienceLevel ?? "",
      yearsOfExperience: talentProfile?.yearsOfExperience ?? "",
      bio: talentProfile?.bio ?? "",
      preferredSlots: talentProfile?.preferredSlots.join(", ") ?? "",
      availableFor: talentProfile?.availableFor.join(", ") ?? "",
      location: talentProfile?.location ?? "",
      expectedPriceBand: talentProfile?.expectedPriceBand ?? "",
      portfolioLinks: talentProfile?.portfolioLinks.join(", ") ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      stageName: talentProfile?.stageName ?? "",
      mainSkill: talentProfile?.mainSkill ?? "",
      experienceLevel: talentProfile?.experienceLevel ?? "",
      yearsOfExperience: talentProfile?.yearsOfExperience ?? "",
      bio: talentProfile?.bio ?? "",
      preferredSlots: talentProfile?.preferredSlots.join(", ") ?? "",
      availableFor: talentProfile?.availableFor.join(", ") ?? "",
      location: talentProfile?.location ?? "",
      expectedPriceBand: talentProfile?.expectedPriceBand ?? "",
      portfolioLinks: talentProfile?.portfolioLinks.join(", ") ?? "",
    })
  }, [
    form,
    talentProfile?.availableFor,
    talentProfile?.bio,
    talentProfile?.experienceLevel,
    talentProfile?.expectedPriceBand,
    talentProfile?.location,
    talentProfile?.mainSkill,
    talentProfile?.portfolioLinks,
    talentProfile?.preferredSlots,
    talentProfile?.stageName,
    talentProfile?.yearsOfExperience,
  ])

  const feeLabel = useMemo(() => formatCurrency(249), [])

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    setSuccess(null)

    try {
      const orderId = crypto.randomUUID()
      const orderResponse = await apiRequest<{ data: { order: TalentOrderResponse } }>("/talent/onboarding/order", {
        method: "POST",
        auth: true,
      })

      await loadRazorpayScript()

      const order = orderResponse.data.order
      const Razorpay = window.Razorpay
      if (!Razorpay) {
        throw new Error("Razorpay failed to load.")
      }

      const razorpay = new Razorpay({
        key: order.providerKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "Baatasari Talent",
        description: "Talent onboarding fee",
        order_id: order.providerOrderId,
        theme: { color: "#0c1d37" },
        handler: async (payment: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          await apiRequest("/talent/onboarding/complete", {
            method: "POST",
            auth: true,
            body: JSON.stringify({
              orderId,
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
              stageName: values.stageName,
              mainSkill: values.mainSkill,
              experienceLevel: values.experienceLevel,
              yearsOfExperience: values.yearsOfExperience,
              bio: values.bio,
              preferredSlots: values.preferredSlots.split(",").map((item) => item.trim()).filter(Boolean),
              availableFor: values.availableFor.split(",").map((item) => item.trim()).filter(Boolean),
              location: values.location,
              expectedPriceBand: values.expectedPriceBand,
              portfolioLinks: values.portfolioLinks?.split(",").map((item) => item.trim()).filter(Boolean) ?? [],
            }),
          })

          setSuccess("Talent onboarding completed successfully.")
          router.push("/talent/dashboard")
        },
      })

      razorpay.open()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Talent onboarding failed.")
    }
  })

  return (
    <ProtectedRoute>
      <PageShell
        eyebrow="Talent onboarding"
        title="Complete your talent setup"
        description="Fill in your creative profile, then complete the fixed onboarding payment to activate the talent dashboard."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Profile and payment">
            <form className="grid gap-5" onSubmit={onSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Stage name</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("stageName")} />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.stageName?.message ?? ""}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Main skill</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("mainSkill")} />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.mainSkill?.message ?? ""}</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Experience level</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("experienceLevel")} />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.experienceLevel?.message ?? ""}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Years of experience</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("yearsOfExperience")} />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.yearsOfExperience?.message ?? ""}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("bio")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bio?.message ?? ""}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Preferred slots</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Evenings, weekends" {...form.register("preferredSlots")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Available for</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Live shows, hosting" {...form.register("availableFor")} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("location")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Expected price band</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="INR 5k - 15k" {...form.register("expectedPriceBand")} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Portfolio links</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Comma-separated URLs" {...form.register("portfolioLinks")} />
              </div>

              {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {success ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {form.formState.isSubmitting ? "Processing..." : `Pay ${feeLabel} and activate`}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="What happens after payment">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Payment is collected with Razorpay and only trusted after backend signature verification.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Your completed profile becomes the source of truth for the talent dashboard immediately afterward.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                This is a user capability, not a new primary backend role, so your normal user experience remains intact.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
