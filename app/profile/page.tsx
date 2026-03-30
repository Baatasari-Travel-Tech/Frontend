"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { PageShell, SectionCard } from "@/components/platform/page-shell"
import { useAuth } from "@/app/providers"
import { uploadFile } from "@/lib/api/uploads"

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(6, "Enter a valid phone number"),
  dob: z.string().optional(),
  location: z.string().min(2, "Enter your location"),
})

type Values = z.infer<typeof schema>

export default function ProfilePage() {
  const { profile, session, updateProfile } = useAuth()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
    },
  })

  useEffect(() => {
    form.reset({
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      dob: profile?.dob ?? "",
      location: profile?.location ?? "",
    })
  }, [form, profile?.dob, profile?.full_name, profile?.location, profile?.phone])

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage(null)
    setError(null)

    try {
      let avatarUrl = profile?.avatar_url ?? null
      if (avatarFile) {
        const upload = await uploadFile(avatarFile, "avatar")
        avatarUrl = upload.secureUrl
      }

      await updateProfile({
        fullName: values.fullName,
        phone: values.phone,
        dob: values.dob || null,
        location: values.location,
        avatarUrl,
      })

      setMessage("Profile updated successfully.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profile could not be updated.")
    }
  })

  return (
    <ProtectedRoute>
      <PageShell
        eyebrow="Account profile"
        title="Manage your details"
        description="Keep your identity, contact information, and avatar in sync with the backend."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="Profile form">
            <form className="grid gap-5" onSubmit={onSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Full name</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...form.register("fullName")}
                  />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.fullName?.message ?? ""}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    disabled
                    value={session?.user?.email ?? ""}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...form.register("phone")}
                  />
                  <p className="mt-1 text-xs text-rose-600">{form.formState.errors.phone?.message ?? ""}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Date of birth</label>
                  <input
                    type="date"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                    {...form.register("dob")}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Location</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
                  {...form.register("location")}
                />
                <p className="mt-1 text-xs text-rose-600">{form.formState.errors.location?.message ?? ""}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Avatar</label>
                <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <Camera className="h-4 w-4 text-brand-900" />
                  <span>{avatarFile ? avatarFile.name : "Upload a new avatar"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {error ? <p className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
              {message ? (
                <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {form.formState.isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Why this matters">
            <div className="grid gap-3 text-sm leading-6 text-slate-600">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Ticket purchases can prefill from this profile to reduce friction at checkout.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Your access token remains in memory only, so sensitive auth state is never persisted in browser storage.
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                Refresh token handling stays cookie-based and automatically refreshes when a protected request expires.
              </div>
            </div>
          </SectionCard>
        </div>
      </PageShell>
    </ProtectedRoute>
  )
}
