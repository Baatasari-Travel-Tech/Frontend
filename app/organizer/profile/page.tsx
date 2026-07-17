"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { FormProvider, useForm, useFormContext, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, ArrowRight, Building2, Camera, Globe, Instagram, Linkedin, MapPin, ShieldCheck } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { uploadFile, uploadOrganizerAvatarImage } from "@/lib/api/uploads"
import { getDobDateBounds, isDobWithinBounds, ORGANIZER_MIN_AGE } from "@/lib/profile-validation"

const EASE = [0.22, 1, 0.36, 1] as const

// Computed once per module load. The organizer floor is 18, so `max` is the
// newest DOB that still satisfies it; the date input and the schema both use
// these bounds, so the constraint holds whether the user picks or pastes.
const DOB_BOUNDS = getDobDateBounds(new Date(), ORGANIZER_MIN_AGE)

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  personalPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10 digit phone number"),
  dob: z
    .string()
    .min(1, "Select your date of birth")
    .refine((value) => isDobWithinBounds(value, DOB_BOUNDS), `You must be at least ${ORGANIZER_MIN_AGE} years old`),
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

const EMPTY_VALUES: Values = {
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
}

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"]

const stripIndianCode = (value: string | null | undefined) => (value ?? "").replace(/^\+91/, "")

/**
 * Baseline rule instead of a box. Darkens to navy on focus. Rules are tinted
 * with the navy foreground rather than cool slate, so they sit correctly on the
 * warm cream --background instead of reading blue against it.
 */
const quietInput =
  "w-full border-b border-slate-900/15 bg-transparent px-0 py-1.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-500 hover:border-slate-900/30 focus:border-brand-900"

/**
 * Steps drive the rail, the scroll-spy targets and the completion meter.
 * `required` lists only the fields that gate payouts, which is why Social has
 * none.
 */
const CHAPTERS = [
  {
    id: "personal",
    title: "Personal",
    short: "Personal",
    standfirst: "Who we contact about this account. Never shown to attendees.",
    required: ["fullName", "personalPhone", "dob", "location", "gender", "profession"],
  },
  {
    id: "organization",
    title: "Organization",
    short: "Organization",
    standfirst: "How your brand reads on event pages and in confirmation emails.",
    required: ["orgName", "description", "contactEmail", "contactPhone"],
  },
  {
    id: "address",
    title: "Address",
    short: "Address",
    standfirst: "Your registered address, used on invoices and tax filings.",
    required: ["address", "city", "state", "pincode"],
  },
  {
    id: "links",
    title: "Social",
    short: "Social",
    standfirst: "Optional. Attendees check these before they buy.",
    required: [],
  },
  {
    id: "bank",
    title: "Bank and compliance",
    // The stepper label is nav, not a heading. The card itself still carries the
    // full name, so the label can be short enough to sit under a 28px circle.
    short: "Compliance",
    standfirst: "Encrypted at rest. Changing these pauses payouts for 24 hours while we re-verify.",
    required: ["panNumber", "bankAccountName", "bankAccountNumber", "bankIfsc"],
  },
] as const satisfies ReadonlyArray<{
  id: string
  title: string
  short: string
  standfirst: string
  required: ReadonlyArray<keyof Values>
}>

/** Fields that must be filled before payouts unlock. Drives the meter. */
const REQUIRED_FIELDS = CHAPTERS.flatMap((chapter) => chapter.required) as (keyof Values)[]

function completionOf(values: Partial<Values>) {
  const filled = REQUIRED_FIELDS.filter((key) => (values[key] ?? "").toString().trim().length > 0)
  return { filled: filled.length, total: REQUIRED_FIELDS.length, percent: (filled.length / REQUIRED_FIELDS.length) * 100 }
}

/* ---------------------------------------------------------------- primitives */

function Field({
  label,
  name,
  required,
  hint,
  className,
  children,
}: {
  label: string
  name?: keyof Values
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  const { formState } = useFormContext<Values>()
  const error = name ? formState.errors[name]?.message : undefined
  return (
    <div className={className}>
      <label className="text-[13px] font-medium text-slate-500">
        {label}
        {required ? <span className="ml-0.5 text-slate-300">*</span> : null}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{String(error)}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

function Chapter({
  chapter,
  className,
  children,
}: {
  chapter: (typeof CHAPTERS)[number]
  /** Mobile wizard hides every step but the active one; desktop shows them all. */
  className?: string
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      id={chapter.id}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: EASE }}
      className={`scroll-mt-32 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-25px_rgba(12,29,55,0.2)] sm:p-7 md:p-8 ${className ?? ""}`}
    >
      <div className="max-w-[54ch]">
        <h2 className="font-bricolage text-2xl font-bold tracking-tight text-slate-900">{chapter.title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{chapter.standfirst}</p>
      </div>
      <div className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-2">{children}</div>
    </motion.section>
  )
}

/* ------------------------------------------------------------ preview card */

/** The public organizer card as attendees see it, bound to live form values. */
function PublicPreview({ logoUrl, onLogoPick }: { logoUrl: string | null; onLogoPick: (file: File | null) => void }) {
  const logoInputRef = useRef<HTMLInputElement>(null)
  const { control } = useFormContext<Values>()
  const orgName = useWatch({ control, name: "orgName" })
  const description = useWatch({ control, name: "description" })
  const city = useWatch({ control, name: "city" })
  const state = useWatch({ control, name: "state" })
  const websiteUrl = useWatch({ control, name: "websiteUrl" })
  const instagramUrl = useWatch({ control, name: "instagramUrl" })
  const linkedinUrl = useWatch({ control, name: "linkedinUrl" })
  const place = [city, state].filter(Boolean).join(", ")

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_-25px_rgba(12,29,55,0.2)]">
      <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Attendees see</p>

      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          aria-label="Change organization logo"
          className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-brand-900"
        >
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-slate-300">
              <Building2 className="h-4 w-4" />
            </span>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-900/70 opacity-0 transition group-hover:opacity-100">
            <Camera className="h-3.5 w-3.5 text-white" />
          </span>
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            onLogoPick(event.target.files?.[0] ?? null)
            event.target.value = ""
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-bricolage text-sm font-bold text-slate-900">
              {orgName || "Your organization"}
            </h3>
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />
          </div>
          {place ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-3 w-3" />
              {place}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] italic text-slate-300">Add a city</p>
          )}
        </div>
      </div>

      {description ? (
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">{description}</p>
      ) : (
        <p className="mt-3 text-xs italic leading-5 text-slate-300">
          Your description appears here. Attendees read this before they buy.
        </p>
      )}

      <div className="mt-3.5 flex items-center gap-1.5">
        {[
          { url: websiteUrl, icon: Globe, label: "Website" },
          { url: instagramUrl, icon: Instagram, label: "Instagram" },
          { url: linkedinUrl, icon: Linkedin, label: "LinkedIn" },
        ].map((link) => (
          <span
            key={link.label}
            aria-label={link.label}
            className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
              link.url ? "border-slate-200 text-slate-500" : "border-dashed border-slate-200 text-slate-200"
            }`}
          >
            <link.icon className="h-3 w-3" />
          </span>
        ))}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- page */

export default function OrganizerProfilePage() {
  const { session, profile, organizerProfile, updateProfile, refreshOrganizerStatus } = useAuth()
  const reduce = useReducedMotion()

  const [activeId, setActiveId] = useState<string>("personal")
  const [error, setError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const formRef = useRef<HTMLFormElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const logoPreviewRef = useRef<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: EMPTY_VALUES,
  })
  const { register, setValue, control } = form

  const values = useWatch({ control }) as Partial<Values>
  const completion = useMemo(() => completionOf(values), [values])
  const description = values.description ?? ""

  // Picking a file does not touch form state, so fold it into the dirty check or
  // the Save control would never appear for an image-only change.
  const isDirty = form.formState.isDirty || Boolean(avatarFile) || Boolean(logoFile)

  const activeIndex = Math.max(
    0,
    CHAPTERS.findIndex((chapter) => chapter.id === activeId),
  )

  // Hydrate from the loaded profile. Depends on individual fields rather than the
  // object identities: a refresh that returns an equal-but-new object would
  // otherwise reset() over whatever the user is currently typing.
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

  // Revoke the object URL on unmount so the picked-logo blob is not leaked.
  useEffect(() => {
    return () => {
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current)
    }
  }, [])

  // Description grows to fit its text rather than scrolling inside a fixed box.
  // Height is reset to auto first so the box can shrink as well as grow.
  // `activeId` is a dependency because a hidden step (display:none) reports a
  // scrollHeight of 0, so the measurement has to be retaken once it is shown.
  useEffect(() => {
    const node = descriptionRef.current
    if (!node || node.offsetParent === null) return
    node.style.height = "auto"
    node.style.height = `${node.scrollHeight}px`
  }, [description, activeId])

  // Scroll-spy for the desktop rail. IntersectionObserver rather than a scroll
  // handler, so nothing runs per frame.
  useEffect(() => {
    const root = formRef.current
    if (!root) return
    const targets = CHAPTERS.map((chapter) => root.querySelector(`#${chapter.id}`)).filter(
      (node): node is Element => Boolean(node),
    )
    if (targets.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])

  const pickLogo = (file: File | null) => {
    if (!file) return
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current)
    const url = URL.createObjectURL(file)
    logoPreviewRef.current = url
    setLogoPreview(url)
    setLogoFile(file)
  }

  const discard = () => {
    form.reset()
    setAvatarFile(null)
    setLogoFile(null)
    if (logoPreviewRef.current) {
      URL.revokeObjectURL(logoPreviewRef.current)
      logoPreviewRef.current = null
    }
    setLogoPreview(null)
    setError(null)
  }

  const onSubmit = form.handleSubmit(async (submitted) => {
    setError(null)
    try {
      let logoUrl = organizerProfile?.logoUrl ?? null
      let logoPublicId = organizerProfile?.logoPublicId ?? null

      if (avatarFile) {
        await uploadOrganizerAvatarImage(avatarFile)
      }

      if (logoFile) {
        const upload = await uploadFile(logoFile, "organizerLogo")
        logoUrl = upload.secureUrl
        logoPublicId = upload.publicId
      }

      await updateProfile({
        fullName: submitted.fullName.trim(),
        phone: `+91${submitted.personalPhone.trim()}`,
        dob: submitted.dob,
        location: submitted.location.trim(),
        gender: submitted.gender,
        profession: submitted.profession.trim(),
      })

      const entityType = organizerProfile?.entityType ?? "ORGANIZATION"
      const orgOnly = <T,>(value: T) => (entityType === "INDIVIDUAL" ? null : value)

      await apiRequest("/organizer/profile", {
        method: "PUT",
        auth: true,
        body: JSON.stringify({
          entityType,
          orgName: orgOnly(submitted.orgName.trim() || null),
          description: orgOnly(submitted.description.trim() || null),
          contactEmail: orgOnly(submitted.contactEmail.trim() || null),
          contactPhone: orgOnly(submitted.contactPhone.trim() || null),
          address: orgOnly(submitted.address.trim() || null),
          city: orgOnly(submitted.city.trim() || null),
          state: orgOnly(submitted.state.trim() || null),
          pincode: orgOnly(submitted.pincode.trim() || null),
          panNumber: submitted.panNumber.trim() || null,
          gstNumber: submitted.gstNumber?.trim() || null,
          bankAccountName: submitted.bankAccountName.trim() || null,
          bankAccountNumber: submitted.bankAccountNumber.trim() || null,
          bankIfsc: submitted.bankIfsc.trim() || null,
          websiteUrl: submitted.websiteUrl?.trim() || null,
          instagramUrl: submitted.instagramUrl?.trim() || null,
          linkedinUrl: submitted.linkedinUrl?.trim() || null,
          primaryContactName: submitted.primaryContactName?.trim() || null,
          secondaryContactPhone: submitted.secondaryContactPhone?.trim() || null,
          logoUrl,
          logoPublicId,
          // KYC is captured in /organizer/document-upload, not here. Send the
          // stored values straight back so saving this form cannot wipe them.
          kycDocUrl: organizerProfile?.kycDocUrl ?? null,
          kycDocPublicId: organizerProfile?.kycDocPublicId ?? null,
        }),
      })

      await refreshOrganizerStatus()
      setAvatarFile(null)
      setLogoFile(null)
      // reset() re-baselines the form as clean, which drops isDirty and swaps the
      // controls back to Back/Next. That swap is the confirmation.
      form.reset(submitted)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profile update failed.")
    }
  })

  /**
   * Mobile step change. Scrolls to the top of the content column, NOT the top of
   * the page: the page top is the preview card, which would leave the user above
   * the form having to scroll down to the step they just picked.
   */
  const goToStep = (index: number) => {
    const next = CHAPTERS[index]
    if (!next) return
    setActiveId(next.id)
    contentRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }

  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!document.getElementById(id)) return
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    window.history.replaceState(null, "", `#${id}`)
  }

  /** Mobile shows one step; `lg:block` puts every card back on desktop. */
  const stepClass = (id: string) => (activeId === id ? "" : "hidden lg:block")

  const displayLogo = logoPreview ?? organizerProfile?.logoUrl ?? null

  return (
    <ProtectedRoute requireOrganizer allowPendingOrganizer>
      <FormProvider {...form}>
        <div className="min-h-[100dvh] bg-background">
          <div className="mx-auto w-full max-w-[1280px] px-5 pb-32 pt-8 md:px-10 md:pt-12">
            <motion.header
              initial={reduce ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="pb-8 md:pb-12"
            >
              <Link
                href="/organizer/dashboard"
                className="group -ml-1 mb-6 inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[13px] font-medium text-slate-500 transition hover:text-slate-900"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-900/15 bg-white transition group-hover:border-brand-900 group-hover:bg-brand-900 group-hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" />
                </span>
                Back to dashboard
              </Link>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Organizer profile</p>
              <h1 className="mt-4 max-w-[16ch] font-bricolage text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-[3.25rem]">
                {values.orgName || "Your organization"}
              </h1>
            </motion.header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
              {/* RAIL */}
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <PublicPreview logoUrl={displayLogo} onLogoPick={pickLogo} />

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-25px_rgba(12,29,55,0.2)]">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Completion</p>
                    <p className="font-mono text-[11px] tabular-nums text-slate-400">
                      {completion.filled}/{completion.total}
                    </p>
                  </div>
                  <div className="mt-2.5 h-px w-full bg-slate-900/15">
                    <motion.div
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: completion.percent / 100 }}
                      transition={{ duration: 0.9, ease: EASE }}
                      style={{ transformOrigin: "left" }}
                      className="h-px bg-brand-900"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {completion.filled === completion.total
                      ? "Payout ready."
                      : `${completion.total - completion.filled} required ${
                          completion.total - completion.filled === 1 ? "field" : "fields"
                        } left.`}
                  </p>

                  {/* Steps, desktop. Vertical, with a navy rule marking position. */}
                  <nav className="mt-5 hidden border-t border-slate-100 pt-4 lg:block">
                    {CHAPTERS.map((chapter) => {
                      const active = activeId === chapter.id
                      return (
                        <a
                          key={chapter.id}
                          href={`#${chapter.id}`}
                          onClick={(event) => scrollToSection(event, chapter.id)}
                          className={`flex items-center gap-3 border-l-2 py-2.5 pl-4 text-[13px] transition ${
                            active
                              ? "border-brand-900 font-semibold text-slate-900"
                              : "border-slate-900/10 text-slate-500 hover:border-slate-900/30 hover:text-slate-900"
                          }`}
                        >
                          <span className="flex-1">{chapter.title}</span>
                        </a>
                      )
                    })}
                  </nav>
                </div>
              </aside>

              {/* CONTENT */}
              {/* scroll-mt clears the sticky site header when goToStep lands here. */}
              <div ref={contentRef} className="min-w-0 scroll-mt-[4.5rem]">
                {/* Steps, mobile. A numbered stepper, and only the active step's
                    card renders below it, so a phone shows one step at a time. */}
                <nav
                  aria-label="Profile steps"
                  className="sticky top-[4.5rem] z-30 -mx-5 mb-6 border-b border-slate-900/10 bg-background/90 px-4 py-3 backdrop-blur-lg lg:hidden"
                >
                  <ol className="grid grid-cols-5">
                    {CHAPTERS.map((chapter, index) => {
                      const active = activeId === chapter.id
                      // Steps behind you read as navy; ahead of you, grey.
                      const passed = index < activeIndex
                      return (
                        <li key={chapter.id} className="relative flex flex-col items-center gap-1.5">
                          {/* Connector runs from the previous circle's centre to
                              this one: the cell is 1/5 wide, so -50% to +50% of
                              it spans exactly centre to centre. */}
                          {index > 0 ? (
                            <span
                              aria-hidden
                              className={`absolute left-[-50%] top-[13px] h-0.5 w-full transition-colors ${
                                index <= activeIndex ? "bg-brand-900" : "bg-slate-900/15"
                              }`}
                            />
                          ) : null}
                          {/* Display only. Steps are moved through with Back/Next,
                              so a step can never be skipped past unsaved changes. */}
                          <span
                            aria-current={active ? "step" : undefined}
                            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition ${
                              active
                                ? "border-brand-900 bg-brand-900 text-white"
                                : passed
                                  ? "border-brand-900 bg-white text-brand-900"
                                  : "border-slate-900/20 bg-white text-slate-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span
                            className={`text-center text-[9px] font-semibold leading-tight transition-colors ${
                              active ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {chapter.short}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </nav>

                <form ref={formRef} onSubmit={onSubmit} className="space-y-5">
                  <Chapter chapter={CHAPTERS[0]} className={stepClass(CHAPTERS[0].id)}>
                    <Field label="Full name" name="fullName" required>
                      <input className={quietInput} {...register("fullName")} />
                    </Field>
                    <Field label="Account email" hint="Locked to your login.">
                      <input className={`${quietInput} text-slate-400`} value={session?.user?.email ?? ""} readOnly />
                    </Field>
                    <Field label="Phone" name="personalPhone" required>
                      <div className="flex items-baseline gap-2 border-b border-slate-900/15 transition focus-within:border-brand-900 hover:border-slate-900/30">
                        <span className="text-[15px] text-slate-500">+91</span>
                        <input
                          className="w-full bg-transparent py-1.5 text-[15px] text-slate-900 outline-none placeholder:text-slate-500"
                          placeholder="10 digit number"
                          inputMode="numeric"
                          maxLength={10}
                          {...register("personalPhone")}
                          onChange={(event) =>
                            setValue("personalPhone", event.target.value.replace(/\D/g, "").slice(0, 10), {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        />
                      </div>
                    </Field>
                    <Field label="Date of birth" name="dob" required hint={`You must be ${ORGANIZER_MIN_AGE} or older.`}>
                      <input
                        type="date"
                        min={DOB_BOUNDS.min}
                        max={DOB_BOUNDS.max}
                        className={quietInput}
                        {...register("dob")}
                      />
                    </Field>
                    <Field label="Location" name="location" required>
                      <input className={quietInput} placeholder="City, State" {...register("location")} />
                    </Field>
                    <Field label="Gender" name="gender" required>
                      <select className={quietInput} {...register("gender")}>
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Profession" name="profession" required>
                      <input className={quietInput} {...register("profession")} />
                    </Field>
                    <Field label="Profile photo" hint="Optional. Uploads when you save.">
                      <label className="group inline-flex w-full cursor-pointer items-center gap-2 border-b border-slate-900/15 py-1.5 text-[15px] text-slate-500 transition hover:border-slate-900/30 hover:text-slate-900">
                        <Camera className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{avatarFile ? avatarFile.name : "Upload new photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                        />
                      </label>
                    </Field>
                  </Chapter>

                  <Chapter chapter={CHAPTERS[1]} className={stepClass(CHAPTERS[1].id)}>
                    <Field label="Organization name" name="orgName" required className="sm:col-span-2">
                      <input className={quietInput} {...register("orgName")} />
                    </Field>
                    <Field
                      label="Description"
                      name="description"
                      required
                      className="sm:col-span-2"
                      hint={`${description.length} characters. Minimum 20. The preview trims after three lines.`}
                    >
                      {(() => {
                        // react-hook-form owns the ref, so take it and forward the
                        // node to both it and the auto-grow measurement.
                        const { ref: registerRef, ...field } = register("description")
                        return (
                          <textarea
                            {...field}
                            ref={(node) => {
                              registerRef(node)
                              descriptionRef.current = node
                            }}
                            rows={2}
                            className={`${quietInput} resize-none overflow-hidden leading-7`}
                          />
                        )
                      })()}
                    </Field>
                    <Field label="Contact email" name="contactEmail" required>
                      <input className={quietInput} {...register("contactEmail")} />
                    </Field>
                    <Field label="Contact phone" name="contactPhone" required>
                      <input className={quietInput} {...register("contactPhone")} />
                    </Field>
                    <Field label="Primary contact" name="primaryContactName">
                      <input className={quietInput} placeholder="Optional" {...register("primaryContactName")} />
                    </Field>
                    <Field label="Secondary phone" name="secondaryContactPhone">
                      <input className={quietInput} placeholder="Optional" {...register("secondaryContactPhone")} />
                    </Field>
                  </Chapter>

                  <Chapter chapter={CHAPTERS[2]} className={stepClass(CHAPTERS[2].id)}>
                    <Field label="Street" name="address" required className="sm:col-span-2">
                      <input className={quietInput} {...register("address")} />
                    </Field>
                    <Field label="City" name="city" required>
                      <input className={quietInput} {...register("city")} />
                    </Field>
                    <Field label="State" name="state" required>
                      <input className={quietInput} {...register("state")} />
                    </Field>
                    <Field label="Pincode" name="pincode" required>
                      <input className={`${quietInput} font-mono`} inputMode="numeric" {...register("pincode")} />
                    </Field>
                  </Chapter>

                  <Chapter chapter={CHAPTERS[3]} className={stepClass(CHAPTERS[3].id)}>
                    <Field label="Website" name="websiteUrl">
                      <input className={quietInput} placeholder="https://" {...register("websiteUrl")} />
                    </Field>
                    <Field label="Instagram" name="instagramUrl">
                      <input className={quietInput} placeholder="https://" {...register("instagramUrl")} />
                    </Field>
                    <Field label="LinkedIn" name="linkedinUrl">
                      <input className={quietInput} placeholder="https://" {...register("linkedinUrl")} />
                    </Field>
                  </Chapter>

                  <Chapter chapter={CHAPTERS[4]} className={stepClass(CHAPTERS[4].id)}>
                    <Field label="PAN number" name="panNumber" required>
                      <input className={`${quietInput} font-mono uppercase`} {...register("panNumber")} />
                    </Field>
                    <Field label="GST number" name="gstNumber" hint="Leave blank if you are not GST registered.">
                      <input className={`${quietInput} font-mono uppercase`} {...register("gstNumber")} />
                    </Field>
                    <Field label="Account holder" name="bankAccountName" required className="sm:col-span-2">
                      <input className={quietInput} {...register("bankAccountName")} />
                    </Field>
                    <Field label="Account number" name="bankAccountNumber" required>
                      <input
                        className={`${quietInput} font-mono`}
                        inputMode="numeric"
                        {...register("bankAccountNumber")}
                      />
                    </Field>
                    <Field label="IFSC code" name="bankIfsc" required>
                      <input className={`${quietInput} font-mono uppercase`} {...register("bankIfsc")} />
                    </Field>
                  </Chapter>

                  {error ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </p>
                  ) : null}

                  {/* Step controls, mobile only. Desktop scrolls the full stack and
                      saves from the sticky bar.
                      Clean step: Back / Next moves you along.
                      Edited step: the same two slots become Cancel / Save, so the
                      only ways out of a step are saving or discarding. */}
                  <div className="flex items-center gap-3 lg:hidden">
                    {isDirty ? (
                      <>
                        <button
                          type="button"
                          onClick={discard}
                          disabled={form.formState.isSubmitting}
                          className="rounded-full border border-slate-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition disabled:opacity-40"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={form.formState.isSubmitting}
                          className="flex flex-1 items-center justify-center rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 active:translate-y-px disabled:opacity-60"
                        >
                          {form.formState.isSubmitting ? "Saving..." : "Save"}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Hidden rather than disabled at the ends of the run:
                            there is no first-step Back or last-step Next. */}
                        {activeIndex > 0 ? (
                          <button
                            type="button"
                            onClick={() => goToStep(activeIndex - 1)}
                            className="flex items-center gap-1.5 rounded-full border border-slate-900/15 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                          </button>
                        ) : null}
                        {activeIndex < CHAPTERS.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => goToStep(activeIndex + 1)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 active:translate-y-px"
                          >
                            Next
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Quiet sticky bar. Desktop only: on mobile the step controls already
              carry Cancel/Save, so this would be a duplicate. */}
          {isDirty ? (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-slate-900/10 bg-background/90 backdrop-blur-lg lg:block"
            >
              <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-5 py-3 md:px-10">
                <p className="flex-1 text-xs text-slate-500">Unsaved changes</p>
                <button
                  type="button"
                  onClick={discard}
                  className="text-xs font-semibold text-slate-400 transition hover:text-slate-900"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => void onSubmit()}
                  disabled={form.formState.isSubmitting}
                  className="rounded-full bg-brand-900 px-5 py-2 text-xs font-bold text-white transition hover:bg-brand-800 active:translate-y-px disabled:opacity-60"
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </FormProvider>
    </ProtectedRoute>
  )
}
