"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, FileBadge2 } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { uploadFile } from "@/lib/api/uploads"

const schema = z.object({
  orgName: z.string().min(2, "Enter the organizer name"),
  description: z.string().min(20, "Add a stronger description"),
  contactEmail: z.string().email("Enter a valid email"),
  contactPhone: z.string().min(6, "Enter a valid phone number"),
  address: z.string().min(4, "Enter your address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().min(4, "Enter your pincode"),
  websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
})

type Values = z.infer<typeof schema>

export default function OrganizerProfilePage() {
  const { organizerProfile, profile } = useAuth()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [kycFile, setKycFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? "",
      contactPhone: organizerProfile?.contactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      orgName: organizerProfile?.orgName ?? "",
      description: organizerProfile?.description ?? "",
      contactEmail: organizerProfile?.contactEmail ?? "",
      contactPhone: organizerProfile?.contactPhone ?? "",
      address: organizerProfile?.address ?? "",
      city: organizerProfile?.city ?? "",
      state: organizerProfile?.state ?? "",
      pincode: organizerProfile?.pincode ?? "",
      websiteUrl: organizerProfile?.websiteUrl ?? "",
      instagramUrl: organizerProfile?.instagramUrl ?? "",
      linkedinUrl: organizerProfile?.linkedinUrl ?? "",
    })
  }, [
    form,
    organizerProfile?.address,
    organizerProfile?.city,
    organizerProfile?.contactEmail,
    organizerProfile?.contactPhone,
    organizerProfile?.description,
    organizerProfile?.instagramUrl,
    organizerProfile?.linkedinUrl,
    organizerProfile?.orgName,
    organizerProfile?.pincode,
    organizerProfile?.state,
    organizerProfile?.websiteUrl,
  ])

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)

    try {
      let logoUrl = organizerProfile?.logoUrl ?? null
      let logoPublicId = organizerProfile?.logoPublicId ?? null
      let kycDocUrl = organizerProfile?.kycDocUrl ?? null
      let kycDocPublicId = organizerProfile?.kycDocPublicId ?? null

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

      await apiRequest("/organizer/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          orgName: values.orgName,
          description: values.description,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          address: values.address,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          panNumber: organizerProfile?.panNumber ?? null,
          gstNumber: organizerProfile?.gstNumber ?? null,
          bankAccountName: organizerProfile?.bankAccountName ?? null,
          bankAccountNumber: organizerProfile?.bankAccountNumber ?? null,
          bankIfsc: organizerProfile?.bankIfsc ?? null,
          websiteUrl: values.websiteUrl || null,
          instagramUrl: values.instagramUrl || null,
          linkedinUrl: values.linkedinUrl || null,
          primaryContactName: organizerProfile?.primaryContactName ?? null,
          secondaryContactPhone: organizerProfile?.secondaryContactPhone ?? null,
          logoUrl,
          logoPublicId,
          kycDocUrl,
          kycDocPublicId,
        }),
      })

      setMessage("Organizer profile updated.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profile update failed.")
    }
  })

  return (
    <ProtectedRoute requireOrganizer allowPendingOrganizer>
      <PageShell eyebrow="Organizer profile" title="Keep your organizer identity current" description="This page stays available after email verification so you can review and update the same organizer details you shared during onboarding.">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Organizer details">
            <form className="grid gap-5" onSubmit={onSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Organizer name</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("orgName")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Contact email</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("contactEmail")} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("description")} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("contactPhone")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" {...form.register("address")} />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="City" {...form.register("city")} /></div>
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="State" {...form.register("state")} /></div>
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Pincode" {...form.register("pincode")} /></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Website URL" {...form.register("websiteUrl")} /></div>
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="Instagram URL" {...form.register("instagramUrl")} /></div>
                <div><input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" placeholder="LinkedIn URL" {...form.register("linkedinUrl")} /></div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Camera className="h-4 w-4 text-brand-900" />
                <span>{logoFile ? logoFile.name : "Upload a new organizer logo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <FileBadge2 className="h-4 w-4 text-brand-900" />
                <span>{kycFile ? kycFile.name : "Upload KYC replacement PDF"}</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => setKycFile(event.target.files?.[0] ?? null)} />
              </label>

              {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {message ? <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

              <button type="submit" disabled={form.formState.isSubmitting} className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {form.formState.isSubmitting ? "Saving..." : "Save organizer profile"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Onboarding summary">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                <p className="font-semibold text-slate-900">Personal details</p>
                <p className="mt-1">Name: {profile?.full_name ?? "Not added yet"}</p>
                <p>Phone: {profile?.phone ?? "Not added yet"}</p>
                <p>Location: {profile?.location ?? "Not added yet"}</p>
                <p>Profession: {profile?.profession ?? "Not added yet"}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Updated brand and document assets help moderation and verification stay consistent while your organizer account is pending approval.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
