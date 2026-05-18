"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Camera, FileBadge2 } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { uploadFile, uploadOrganizerAvatarImage } from "@/lib/api/uploads"
import { ORGANIZER_MIN_AGE } from "@/lib/profile-validation"

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  personalPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10 digit phone number"),
  dob: z.string().min(1, "Select your date of birth"),
  location: z.string().min(2, "Enter your location"),
  gender: z.string().min(1, "Select your gender"),
  profession: z.string().min(2, "Enter your profession"),
  orgName: z.string().min(2, "Enter your organization name"),
  description: z.string().min(20, "Add a stronger organization description"),
  contactEmail: z.string().email("Enter a valid contact email"),
  contactPhone: z.string().min(6, "Enter a valid contact number"),
  primaryContactName: z.string().optional(),
  secondaryContactPhone: z.string().optional(),
  address: z.string().min(4, "Enter your address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().min(4, "Enter your pincode"),
  websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")),
  panNumber: z.string().min(5, "Enter the PAN number"),
  gstNumber: z.string().optional(),
  bankAccountName: z.string().min(2, "Enter the account holder name"),
  bankAccountNumber: z.string().min(6, "Enter a valid account number"),
  bankIfsc: z.string().min(4, "Enter a valid IFSC code"),
})

type Values = z.infer<typeof schema>

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const readOnlyInputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 shadow-sm"

const textareaClassName =
  "mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const stripIndianCode = (value: string | null | undefined) => (value ?? "").replace(/^\+91/, "")

export default function OrganizerProfilePage() {
  const { session, profile, organizerProfile, updateProfile, refreshOrganizerStatus } = useAuth()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [dobOpen, setDobOpen] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [kycFile, setKycFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      personalPhone: "",
      dob: "",
      location: "",
      gender: "",
      profession: "",
      orgName: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      primaryContactName: "",
      secondaryContactPhone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      websiteUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      panNumber: "",
      gstNumber: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankIfsc: "",
    },
  })

  useEffect(() => {
    form.reset({
      fullName: profile?.full_name ?? "",
      personalPhone: stripIndianCode(profile?.phone),
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
      gender: profile?.gender ?? "",
      profession: profile?.profession ?? "",
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? session?.user?.email ?? "",
      contactPhone: organizerProfile?.contactPhone ?? stripIndianCode(profile?.phone),
      primaryContactName: organizerProfile?.primaryContactName ?? "",
      secondaryContactPhone: organizerProfile?.secondaryContactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
      panNumber: organizerProfile?.panNumber ?? "",
      gstNumber: organizerProfile?.gstNumber ?? "",
      bankAccountName: organizerProfile?.bankAccountName ?? "",
      bankAccountNumber: organizerProfile?.bankAccountNumber ?? "",
      bankIfsc: organizerProfile?.bankIfsc ?? "",
    })
  }, [
    form,
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
    profile?.dob,
    profile?.full_name,
    profile?.gender,
    profile?.location,
    profile?.phone,
    profile?.profession,
    session?.user?.email,
  ])

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)

    try {
      let logoUrl = organizerProfile?.logoUrl ?? null
      let logoPublicId = organizerProfile?.logoPublicId ?? null
      let kycDocUrl = organizerProfile?.kycDocUrl ?? null
      let kycDocPublicId = organizerProfile?.kycDocPublicId ?? null

      if (avatarFile) {
        await uploadOrganizerAvatarImage(avatarFile)
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
        fullName: values.fullName.trim(),
        phone: `+91${values.personalPhone.trim()}`,
        dob: values.dob,
        location: values.location.trim(),
        gender: values.gender,
        profession: values.profession.trim(),
      })

      await apiRequest("/organizer/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          entityType: organizerProfile?.entityType ?? "ORGANIZATION",
          orgName:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.orgName.trim() || null,
          description:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.description.trim() || null,
          contactEmail:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.contactEmail.trim() || null,
          contactPhone:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.contactPhone.trim() || null,
          address:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.address.trim() || null,
          city:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.city.trim() || null,
          state:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.state.trim() || null,
          pincode:
            (organizerProfile?.entityType ?? "ORGANIZATION") === "INDIVIDUAL"
              ? null
              : values.pincode.trim() || null,
          panNumber: values.panNumber.trim() || null,
          gstNumber: values.gstNumber?.trim() || null,
          bankAccountName: values.bankAccountName.trim() || null,
          bankAccountNumber: values.bankAccountNumber.trim() || null,
          bankIfsc: values.bankIfsc.trim() || null,
          websiteUrl: values.websiteUrl?.trim() || null,
          instagramUrl: values.instagramUrl?.trim() || null,
          linkedinUrl: values.linkedinUrl?.trim() || null,
          primaryContactName: values.primaryContactName?.trim() || null,
          secondaryContactPhone: values.secondaryContactPhone?.trim() || null,
          logoUrl,
          logoPublicId,
          kycDocUrl,
          kycDocPublicId,
        }),
      })

      await refreshOrganizerStatus()
      setMessage("Organizer profile updated successfully.")
      setAvatarFile(null)
      setLogoFile(null)
      setKycFile(null)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profile update failed.")
    }
  })

  return (
    <ProtectedRoute requireOrganizer allowPendingOrganizer>
      <PageShell
        eyebrow="Organizer profile"
        title="Organizer details"
        description="This profile uses the same fields as organizer onboarding so you can view and update everything in one place."
      >
        <form className="grid gap-6" onSubmit={onSubmit}>
          <SectionCard title="Personal details">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Full name *
                <input className={inputClassName} {...form.register("fullName")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fullName?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Account email
                <input className={readOnlyInputClassName} type="email" value={session?.user?.email ?? ""} readOnly disabled />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Personal phone number *
                <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-brand-900 focus-within:ring-4 focus-within:ring-brand-900/10">
                  <span className="text-sm font-semibold text-slate-500">+91</span>
                  <input
                    className="ml-2 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="10 digit number"
                    inputMode="numeric"
                    maxLength={10}
                    {...form.register("personalPhone")}
                    onChange={(event) => form.setValue("personalPhone", event.target.value.replace(/\D/g, "").slice(0, 10), { shouldValidate: true })}
                  />
                </div>
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.personalPhone?.message ?? ""}</p>
              </label>
              <div className="block text-sm font-semibold text-slate-700">
                Date of birth *
                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`${inputClassName} flex items-center justify-between`}
                    >
                      <span className={form.watch("dob") ? "text-slate-900" : "text-slate-400"}>
                        {form.watch("dob") && !Number.isNaN(new Date(form.watch("dob") + "T00:00:00").getTime())
                          ? format(new Date(form.watch("dob") + "T00:00:00"), "PPP")
                          : "Select date of birth"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        form.watch("dob") && !Number.isNaN(new Date(form.watch("dob") + "T00:00:00").getTime())
                          ? new Date(form.watch("dob") + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          form.setValue("dob", format(date, "yyyy-MM-dd"), { shouldValidate: true })
                          setDobOpen(false)
                        }
                      }}
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear() - 100}
                      toYear={new Date().getFullYear() - ORGANIZER_MIN_AGE}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.dob?.message ?? ""}</p>
              </div>
              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Location *
                <input className={inputClassName} placeholder="City, State" {...form.register("location")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.location?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Gender *
                <select className={inputClassName} {...form.register("gender")}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.gender?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Profession *
                <input className={inputClassName} {...form.register("profession")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.profession?.message ?? ""}</p>
              </label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <Camera className="h-4 w-4 text-brand-900" />
              <span>{avatarFile ? avatarFile.name : "Upload new profile image (optional)"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)} />
            </label>
          </SectionCard>

          <SectionCard title="Organization details">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Organization name *
                <input className={inputClassName} {...form.register("orgName")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.orgName?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Organization description *
                <textarea className={textareaClassName} {...form.register("description")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contact email *
                <input className={inputClassName} {...form.register("contactEmail")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactEmail?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Contact phone *
                <input className={inputClassName} {...form.register("contactPhone")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactPhone?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Primary contact name
                <input className={inputClassName} {...form.register("primaryContactName")} />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Secondary contact phone
                <input className={inputClassName} {...form.register("secondaryContactPhone")} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Address *
                <input className={inputClassName} {...form.register("address")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.address?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                City *
                <input className={inputClassName} {...form.register("city")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.city?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                State *
                <input className={inputClassName} {...form.register("state")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.state?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Pincode *
                <input className={inputClassName} {...form.register("pincode")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.pincode?.message ?? ""}</p>
              </label>
              <div className="hidden md:block" />
              <label className="block text-sm font-semibold text-slate-700">
                Website
                <input className={inputClassName} {...form.register("websiteUrl")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.websiteUrl?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Instagram
                <input className={inputClassName} {...form.register("instagramUrl")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.instagramUrl?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                LinkedIn
                <input className={inputClassName} {...form.register("linkedinUrl")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.linkedinUrl?.message ?? ""}</p>
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Bank and compliance details">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                PAN number *
                <input className={inputClassName} {...form.register("panNumber")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.panNumber?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                GST number
                <input className={inputClassName} {...form.register("gstNumber")} />
              </label>
              <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                Account holder name *
                <input className={inputClassName} {...form.register("bankAccountName")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountName?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Account number *
                <input className={inputClassName} {...form.register("bankAccountNumber")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountNumber?.message ?? ""}</p>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                IFSC code *
                <input className={inputClassName} {...form.register("bankIfsc")} />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankIfsc?.message ?? ""}</p>
              </label>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Camera className="h-4 w-4 text-brand-900" />
                <span>{logoFile ? logoFile.name : "Upload organizer logo (optional)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <FileBadge2 className="h-4 w-4 text-brand-900" />
                <span>{kycFile ? kycFile.name : "Upload KYC PDF (optional)"}</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => setKycFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
          </SectionCard>

          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

          <div className="flex justify-end">
            <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {form.formState.isSubmitting ? "Updating..." : "Update organizer profile"}
            </button>
          </div>
        </form>
      </PageShell>
    </ProtectedRoute>
  )
}
