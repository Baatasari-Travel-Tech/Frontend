"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, FileBadge2 } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { uploadFile } from "@/lib/api/uploads"

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  dob: z.string().min(1, "Select your date of birth"),
  location: z.string().min(2, "Enter your location"),
  orgName: z.string().min(2, "Enter your organization name"),
  description: z.string().min(20, "Add a stronger organizer description"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().min(6, "Enter a valid contact number"),
  address: z.string().min(4, "Enter your address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().min(4, "Enter your pincode"),
  panNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  primaryContactName: z.string().optional(),
  secondaryContactPhone: z.string().optional(),
})

type Values = z.infer<typeof schema>

const steps = [
  { id: 0, title: "Brand", copy: "Who you are and what you organize." },
  { id: 1, title: "Operations", copy: "Where and how the organization operates." },
  { id: 2, title: "Compliance", copy: "Tax and banking details for business readiness." },
  { id: 3, title: "Identity", copy: "Upload your logo and KYC assets." },
]

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const { session, profile, organizerProfile, updateProfile, completeRoleOnboarding } = useAuth()
  const [step, setStep] = useState(0)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [kycFile, setKycFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? session?.user?.email ?? "",
      contactPhone: organizerProfile?.contactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      panNumber: organizerProfile?.panNumber ?? "",
      gstNumber: organizerProfile?.gstNumber ?? "",
      bankAccountName: organizerProfile?.bankAccountName ?? "",
      bankAccountNumber: organizerProfile?.bankAccountNumber ?? "",
      bankIfsc: organizerProfile?.bankIfsc ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
      primaryContactName: organizerProfile?.primaryContactName ?? "",
      secondaryContactPhone: organizerProfile?.secondaryContactPhone ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      fullName: profile?.full_name ?? "",
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? session?.user?.email ?? "",
      contactPhone: organizerProfile?.contactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      panNumber: organizerProfile?.panNumber ?? "",
      gstNumber: organizerProfile?.gstNumber ?? "",
      bankAccountName: organizerProfile?.bankAccountName ?? "",
      bankAccountNumber: organizerProfile?.bankAccountNumber ?? "",
      bankIfsc: organizerProfile?.bankIfsc ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
      primaryContactName: organizerProfile?.primaryContactName ?? "",
      secondaryContactPhone: organizerProfile?.secondaryContactPhone ?? "",
    })
  }, [
    form,
    profile?.dob,
    profile?.full_name,
    profile?.location,
    organizerProfile?.address,
    organizerProfile?.bankAccountName,
    organizerProfile?.bankAccountNumber,
    organizerProfile?.bankIfsc,
    organizerProfile?.city,
    organizerProfile?.contactEmail,
    organizerProfile?.contactPhone,
    organizerProfile?.description,
    organizerProfile?.gstNumber,
    organizerProfile?.instagramUrl,
    organizerProfile?.linkedinUrl,
    organizerProfile?.orgName,
    organizerProfile?.panNumber,
    organizerProfile?.pincode,
    organizerProfile?.primaryContactName,
    organizerProfile?.secondaryContactPhone,
    organizerProfile?.state,
    organizerProfile?.websiteUrl,
    session?.user?.email,
  ])

  const handleNext = async () => {
    const fieldsByStep: Array<Array<keyof Values>> = [
      ["fullName", "dob", "location", "orgName", "description", "contactEmail", "contactPhone"],
      ["address", "city", "state", "pincode", "websiteUrl", "instagramUrl", "linkedinUrl"],
      ["panNumber", "gstNumber", "bankAccountName", "bankAccountNumber", "bankIfsc", "primaryContactName", "secondaryContactPhone"],
      [],
    ]

    const fields = fieldsByStep[step]
    if (fields.length === 0 || (await form.trigger(fields))) {
      setStep((current) => Math.min(current + 1, steps.length - 1))
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)

    try {
      let avatarUrl = profile?.avatar_url ?? null
      let logoUrl = organizerProfile?.logoUrl ?? null
      let logoPublicId = organizerProfile?.logoPublicId ?? null
      let kycDocUrl = organizerProfile?.kycDocUrl ?? null
      let kycDocPublicId = organizerProfile?.kycDocPublicId ?? null

      if (avatarFile) {
        const upload = await uploadFile(avatarFile, "avatar")
        avatarUrl = upload.secureUrl
      }

      if (logoFile) {
        const upload = await uploadFile(logoFile, "organizerLogo")
        logoUrl = upload.secureUrl
        logoPublicId = upload.publicId
      }

      if (kycFile) {
        const upload = await uploadFile(kycFile, "organizerKycPdf")
        kycDocUrl = upload.secureUrl
        kycDocPublicId = upload.publicId
      }

      await updateProfile({
        fullName: values.fullName,
        phone: values.contactPhone,
        dob: values.dob,
        location: values.location,
        avatarUrl,
      })

      await completeRoleOnboarding("EVENT_ORGANIZER", {
        orgName: values.orgName,
        description: values.description,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        address: values.address,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        websiteUrl: values.websiteUrl || null,
        instagramUrl: values.instagramUrl || null,
        linkedinUrl: values.linkedinUrl || null,
        panNumber: values.panNumber || null,
        gstNumber: values.gstNumber || null,
        bankAccountName: values.bankAccountName || null,
        bankAccountNumber: values.bankAccountNumber || null,
        bankIfsc: values.bankIfsc || null,
        primaryContactName: values.primaryContactName || null,
        secondaryContactPhone: values.secondaryContactPhone || null,
        logoUrl,
        logoPublicId,
        kycDocUrl,
        kycDocPublicId,
      })

      setMessage("Organizer onboarding completed successfully.")
      router.push("/organizer/email-verification")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Organizer onboarding failed.")
    }
  })

  return (
    <ProtectedRoute requireOnboarding={false}>
      <PageShell
        eyebrow="Organizer onboarding"
        title="Complete the four-step organizer setup"
        description="This flow also completes the user onboarding fields so verified organizers can switch into user mode immediately."
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Progress">
            <div className="grid gap-3">
              {steps.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`rounded-[1.25rem] border px-4 py-4 text-left transition ${
                    step === item.id ? "border-brand-900 bg-brand-900/5" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Step {item.id + 1}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={steps[step].title} description={steps[step].copy}>
            <form className="grid gap-5" onSubmit={onSubmit}>
              {step === 0 ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Full name</label>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("fullName")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fullName?.message ?? ""}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Organization name</label>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("orgName")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.orgName?.message ?? ""}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("description")} />
                    <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message ?? ""}</p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Date of birth</label>
                      <input type="date" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("dob")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.dob?.message ?? ""}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Location</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("location")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.location?.message ?? ""}</p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Contact email</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("contactEmail")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Contact phone</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("contactPhone")} />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <Camera className="h-4 w-4 text-brand-900" />
                    <span>{avatarFile ? avatarFile.name : "Upload profile avatar (optional)"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
                  </label>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Address</label>
                    <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("address")} />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">City</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("city")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">State</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("state")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Pincode</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("pincode")} />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Website</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("websiteUrl")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Instagram</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("instagramUrl")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">LinkedIn</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("linkedinUrl")} />
                    </div>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">PAN number</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("panNumber")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">GST number</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("gstNumber")} />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Account name</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("bankAccountName")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Account number</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("bankAccountNumber")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">IFSC</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("bankIfsc")} />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-slate-700">Primary contact</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("primaryContactName")} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700">Secondary contact phone</label>
                      <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("secondaryContactPhone")} />
                    </div>
                  </div>
                </>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4">
                  <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <Camera className="h-4 w-4 text-brand-900" />
                    <span>{logoFile ? logoFile.name : "Upload organizer logo"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <FileBadge2 className="h-4 w-4 text-brand-900" />
                    <span>{kycFile ? kycFile.name : "Upload KYC PDF document"}</span>
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => setKycFile(event.target.files?.[0] ?? null)} />
                  </label>
                </div>
              ) : null}

              {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {message ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

              <div className="flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Back
                </button>
                {step < steps.length - 1 ? (
                  <button type="button" onClick={() => void handleNext()} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white">
                    Continue
                  </button>
                ) : (
                  <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {form.formState.isSubmitting ? "Submitting..." : "Complete organizer onboarding"}
                  </button>
                )}
              </div>
            </form>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
