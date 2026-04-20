"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Landmark, ShieldCheck } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { uploadFile } from "@/lib/api/uploads"

const DRAFT_STORAGE_KEY = "organizer-onboarding-draft-v2"
const DEFAULT_AVATAR = "/avatar.webp"

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
  websiteUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  instagramUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  linkedinUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  panNumber: z.string().min(5, "Enter the PAN number"),
  gstNumber: z.string().optional(),
  bankAccountName: z.string().min(2, "Enter the account holder name"),
  bankAccountNumber: z.string().min(6, "Enter a valid account number"),
  bankIfsc: z.string().min(4, "Enter a valid IFSC code"),
})

type Values = z.infer<typeof schema>

const steps = [
  {
    id: 0,
    title: "Personal Details",
    copy: "Complete your personal profile and organizer information.",
  },
  {
    id: 1,
    title: "Bank Details",
    copy: "Add PAN, GST, and payout details for verification.",
  },
]

const stepOneFields: Array<keyof Values> = [
  "fullName",
  "personalPhone",
  "dob",
  "location",
  "gender",
  "profession",
  "orgName",
  "description",
  "contactEmail",
  "contactPhone",
  "address",
  "city",
  "state",
  "pincode",
]

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const readOnlyInputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-700 shadow-sm"

const textareaClassName =
  "mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"

const getDraft = () => {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { step?: number; values?: Partial<Values> }
  } catch {
    return null
  }
}

const persistDraft = (step: number, values: Partial<Values>) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step, values }))
}

const clearDraft = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DRAFT_STORAGE_KEY)
}

const stripIndianCode = (value: string | null | undefined) => (value ?? "").replace(/^\+91/, "")

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const { session, user, profile, organizerProfile, updateProfile, refreshOrganizerStatus, completeRoleOnboarding } = useAuth()

  const [step, setStep] = useState(0)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(DEFAULT_AVATAR)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 })
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSavingStepOne, setIsSavingStepOne] = useState(false)

  const cropContainerRef = useRef<HTMLDivElement>(null)
  const previewUrlRef = useRef<string | null>(null)

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
    const baseValues: Values = {
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
    }

    const draft = getDraft()
    form.reset({
      ...baseValues,
      ...(draft?.values ?? {}),
    })
    setStep(draft?.step === 1 ? 1 : 0)
    setAvatarPreview(profile?.avatar_url ?? DEFAULT_AVATAR)
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
    profile?.avatar_url,
    profile?.dob,
    profile?.full_name,
    profile?.gender,
    profile?.location,
    profile?.phone,
    profile?.profession,
    session?.user?.email,
  ])

  useEffect(() => {
    const subscription = form.watch((value) => {
      persistDraft(step, value as Partial<Values>)
    })

    return () => subscription.unsubscribe()
  }, [form, step])

  useEffect(() => {
    persistDraft(step, form.getValues())
  }, [form, step])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const getCropMetrics = (zoom: number = cropZoom) => {
    if (!cropImage) return null

    const containerSize = 240
    const baseScale = Math.max(containerSize / cropImage.naturalWidth, containerSize / cropImage.naturalHeight)
    const scaledWidth = cropImage.naturalWidth * baseScale * zoom
    const scaledHeight = cropImage.naturalHeight * baseScale * zoom
    const maxX = Math.max(0, (scaledWidth - containerSize) / 2)
    const maxY = Math.max(0, (scaledHeight - containerSize) / 2)

    return { containerSize, baseScale, scaledWidth, scaledHeight, maxX, maxY }
  }

  const clampOffset = (offset: { x: number; y: number }, zoom: number = cropZoom) => {
    const metrics = getCropMetrics(zoom)
    if (!metrics) return { x: 0, y: 0 }

    return {
      x: Math.min(metrics.maxX, Math.max(-metrics.maxX, offset.x)),
      y: Math.min(metrics.maxY, Math.max(-metrics.maxY, offset.y)),
    }
  }

  const handleAvatarChange = (file: File | null) => {
    setError(null)
    if (!file) return

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG, JPG, or WEBP images are allowed.")
      return
    }

    if (file.size > 200 * 1024) {
      setError("Image must be under 200KB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result) return

      const image = new Image()
      image.onload = () => {
        setCropImage(image)
        setCropSource(result)
        setCropZoom(1)
        setCropOffset({ x: 0, y: 0 })
        setIsCropOpen(true)
      }
      image.src = result
    }
    reader.readAsDataURL(file)
  }

  const closeCrop = () => {
    setIsCropOpen(false)
    setCropSource(null)
    setCropImage(null)
  }

  const applyCrop = async () => {
    if (!cropImage) return
    const metrics = getCropMetrics()
    if (!metrics) return

    const scale = metrics.baseScale * cropZoom
    const sourceSize = metrics.containerSize / scale
    const sourceX = (cropImage.naturalWidth - sourceSize) / 2 - cropOffset.x / scale
    const sourceY = (cropImage.naturalHeight - sourceSize) / 2 - cropOffset.y / scale

    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512

    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(
      cropImage,
      Math.max(0, sourceX),
      Math.max(0, sourceY),
      Math.min(sourceSize, cropImage.naturalWidth),
      Math.min(sourceSize, cropImage.naturalHeight),
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))

    if (!blob || blob.size > 200 * 1024) {
      setError("Cropped image is too large. Try zooming out.")
      return
    }

    const croppedFile = new File([blob], "avatar.webp", { type: "image/webp" })
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    const previewUrl = URL.createObjectURL(croppedFile)
    previewUrlRef.current = previewUrl

    setAvatarPreview(previewUrl)
    setAvatarFile(croppedFile)
    setIsCropOpen(false)
  }

  const uploadAvatarIfNeeded = async () => {
    if (!avatarFile) {
      return profile?.avatar_url ?? null
    }

    const upload = await uploadFile(avatarFile, "avatar")
    setAvatarFile(null)
    setAvatarPreview(upload.secureUrl)
    return upload.secureUrl
  }

  const buildOrganizerPayload = (values: Values) => ({
    orgName: values.orgName.trim(),
    description: values.description.trim(),
    contactEmail: values.contactEmail.trim(),
    contactPhone: values.contactPhone.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    pincode: values.pincode.trim(),
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
    logoUrl: organizerProfile?.logoUrl ?? null,
    logoPublicId: organizerProfile?.logoPublicId ?? null,
    kycDocUrl: organizerProfile?.kycDocUrl ?? null,
    kycDocPublicId: organizerProfile?.kycDocPublicId ?? null,
  })

  const saveStepOne = async () => {
    setNotice(null)
    setError(null)

    const isValid = await form.trigger(stepOneFields)
    if (!isValid) return

    setIsSavingStepOne(true)

    try {
      const values = form.getValues()
      const avatarUrl = await uploadAvatarIfNeeded()

      await updateProfile({
        fullName: values.fullName.trim(),
        phone: `+91${values.personalPhone.trim()}`,
        dob: values.dob,
        location: values.location.trim(),
        gender: values.gender,
        profession: values.profession.trim(),
        avatarUrl,
      })

      await apiRequest("/organizer/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify(buildOrganizerPayload(values)),
      })

      await refreshOrganizerStatus()
      persistDraft(1, values)
      setStep(1)
      setNotice("Step 1 saved. You can continue now or return later from this step.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your progress.")
    } finally {
      setIsSavingStepOne(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setNotice(null)
    setError(null)

    try {
      const avatarUrl = await uploadAvatarIfNeeded()

      await updateProfile({
        fullName: values.fullName.trim(),
        phone: `+91${values.personalPhone.trim()}`,
        dob: values.dob,
        location: values.location.trim(),
        gender: values.gender,
        profession: values.profession.trim(),
        avatarUrl,
      })

      await completeRoleOnboarding("EVENT_ORGANIZER", buildOrganizerPayload(values))
      clearDraft()

      if (user?.emailVerified) {
        router.replace("/organizer/pending")
        return
      }

      router.replace("/organizer/email-verification")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit organizer onboarding.")
    }
  })

  return (
    <ProtectedRoute requireOnboarding={false}>
      <main className="page-x py-6 sm:py-8">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Organizer onboarding</p>
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Complete your organizer setup</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              We will complete your personal profile first, then collect your banking details for review. Your progress is
              saved as you move through the flow, so you can come back and continue later.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {steps.map((item) => {
              const isActive = step === item.id
              const isDone = step > item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 0 || organizerProfile || step > 0) {
                      setStep(item.id)
                    }
                  }}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-brand-900 bg-brand-900/5 shadow-sm"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Step {item.id + 1}</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{item.title}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        isActive
                          ? "bg-brand-900 text-white"
                          : isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isActive ? "Current" : isDone ? "Saved" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.copy}</p>
                </button>
              )
            })}
          </div>

          <form className="mt-6 grid gap-6" onSubmit={onSubmit}>
            {step === 0 ? (
              <>
                <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-slate-50/60 p-5 md:grid-cols-[36%_64%]">
                  <div className="flex h-full flex-col items-center justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                    <div className="w-full">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profile picture</p>
                      <p className="mt-2 text-sm text-slate-500">This also completes your user profile.</p>
                    </div>

                    <div className="relative h-52 w-52 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-[0_12px_22px_rgba(15,23,42,0.08)]">
                      <img src={avatarPreview || DEFAULT_AVATAR} alt="Profile preview" className="h-full w-full object-cover" />
                    </div>

                    <label className="w-full text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Upload image
                      <input
                        className="mt-2 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-900/10 file:px-3 file:py-1.5 file:text-[10px] file:font-semibold file:text-brand-800 hover:file:bg-brand-900/20"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="text-center text-xs text-slate-400">PNG, JPG, or WEBP under 200KB (optional)</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 md:pr-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Full name *
                      <input className={inputClassName} placeholder="Your full name" {...form.register("fullName")} />
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

                    <label className="block text-sm font-semibold text-slate-700">
                      Date of birth *
                      <input type="date" className={inputClassName} {...form.register("dob")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.dob?.message ?? ""}</p>
                    </label>

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
                      <input className={inputClassName} placeholder="Your profession" {...form.register("profession")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.profession?.message ?? ""}</p>
                    </label>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-brand-900/10 p-3 text-brand-900">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-950">Organization details</p>
                      <p className="mt-1 text-sm text-slate-500">These details will be reviewed by our onboarding team.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                      Organization name *
                      <input className={inputClassName} placeholder="Organization name" {...form.register("orgName")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.orgName?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                      Organization description *
                      <textarea className={textareaClassName} placeholder="Tell us about your organization" {...form.register("description")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.description?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Contact email *
                      <input className={inputClassName} placeholder="contact@organization.com" {...form.register("contactEmail")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactEmail?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Contact phone *
                      <input className={inputClassName} placeholder="Organizer contact number" {...form.register("contactPhone")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.contactPhone?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Primary contact name
                      <input className={inputClassName} placeholder="Primary contact person" {...form.register("primaryContactName")} />
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Secondary contact phone
                      <input className={inputClassName} placeholder="Optional backup number" {...form.register("secondaryContactPhone")} />
                    </label>

                    <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                      Address *
                      <input className={inputClassName} placeholder="Street address" {...form.register("address")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.address?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      City *
                      <input className={inputClassName} placeholder="City" {...form.register("city")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.city?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      State *
                      <input className={inputClassName} placeholder="State" {...form.register("state")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.state?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Pincode *
                      <input className={inputClassName} placeholder="Pincode" {...form.register("pincode")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.pincode?.message ?? ""}</p>
                    </label>

                    <div className="hidden md:block" />

                    <label className="block text-sm font-semibold text-slate-700">
                      Website
                      <input className={inputClassName} placeholder="https://your-website.com" {...form.register("websiteUrl")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.websiteUrl?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      Instagram
                      <input className={inputClassName} placeholder="https://instagram.com/your-handle" {...form.register("instagramUrl")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.instagramUrl?.message ?? ""}</p>
                    </label>

                    <label className="block text-sm font-semibold text-slate-700">
                      LinkedIn
                      <input className={inputClassName} placeholder="https://linkedin.com/company/your-page" {...form.register("linkedinUrl")} />
                      <p className="mt-1 text-xs text-rose-600">{form.formState.errors.linkedinUrl?.message ?? ""}</p>
                    </label>
                  </div>
                </section>
              </>
            ) : null}

            {step === 1 ? (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-brand-900/10 p-3 text-brand-900">
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">Bank and tax details</p>
                        <p className="mt-1 text-sm text-slate-500">
                          These details help us validate your organization and prepare payouts.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        PAN number *
                        <input className={inputClassName} placeholder="PAN number" {...form.register("panNumber")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.panNumber?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700">
                        GST number
                        <input className={inputClassName} placeholder="GST number, if applicable" {...form.register("gstNumber")} />
                      </label>

                      <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
                        Account holder name *
                        <input className={inputClassName} placeholder="Name as per bank account" {...form.register("bankAccountName")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountName?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700">
                        Account number *
                        <input className={inputClassName} placeholder="Bank account number" {...form.register("bankAccountNumber")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankAccountNumber?.message ?? ""}</p>
                      </label>

                      <label className="block text-sm font-semibold text-slate-700">
                        IFSC code *
                        <input className={inputClassName} placeholder="IFSC code" {...form.register("bankIfsc")} />
                        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.bankIfsc?.message ?? ""}</p>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">What happens next</p>
                        <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600">
                          <p>Your account will move to email verification right after submit.</p>
                          <p>After verification, you will land on the approval pending page.</p>
                          <p>Our onboarding team will contact you for document verification and organization verification.</p>
                          <p>Please keep your PAN, GST, and organization details ready.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : null}
            {notice ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-2">
              <p className="text-sm text-slate-500">You can leave this flow and come back later. Your latest step is preserved.</p>

              <div className="flex flex-wrap items-center gap-3">
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back
                  </button>
                ) : null}

                {step === 0 ? (
                  <button
                    type="button"
                    onClick={() => void saveStepOne()}
                    disabled={isSavingStepOne}
                    className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {isSavingStepOne ? "Saving..." : "Save & Continue"}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="rounded-full bg-brand-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {form.formState.isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {isCropOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.3)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Adjust image</p>
                  <h2 className="text-xl font-semibold text-slate-900">Set your profile crop</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-50"
                  onClick={closeCrop}
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_190px]">
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div
                    ref={cropContainerRef}
                    className="relative h-60 w-60 overflow-hidden rounded-full border border-slate-200 bg-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId)
                      setDragStart({ x: event.clientX, y: event.clientY })
                      setOffsetStart(cropOffset)
                    }}
                    onPointerMove={(event) => {
                      if (!dragStart) return
                      const next = {
                        x: offsetStart.x + (event.clientX - dragStart.x),
                        y: offsetStart.y + (event.clientY - dragStart.y),
                      }
                      setCropOffset(clampOffset(next))
                    }}
                    onPointerUp={() => setDragStart(null)}
                    onPointerLeave={() => setDragStart(null)}
                  >
                    {cropSource ? (
                      <div
                        className="absolute inset-0 bg-cover bg-no-repeat bg-center"
                        style={{
                          backgroundImage: `url(${cropSource})`,
                          backgroundSize: `${getCropMetrics()?.scaledWidth ?? 240}px ${getCropMetrics()?.scaledHeight ?? 240}px`,
                          backgroundPosition: `calc(50% + ${cropOffset.x}px) calc(50% + ${cropOffset.y}px)`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Zoom</p>
                    <input
                      className="mt-3 w-full accent-brand-900"
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={cropZoom}
                      onChange={(event) => {
                        const nextZoom = Number(event.target.value)
                        setCropZoom(nextZoom)
                        setCropOffset((previous) => clampOffset(previous, nextZoom))
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-500">Drag to reposition.</p>
                  </div>

                  <button
                    type="button"
                    className="w-full rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                    onClick={() => void applyCrop()}
                  >
                    Use this image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </ProtectedRoute>
  )
}
