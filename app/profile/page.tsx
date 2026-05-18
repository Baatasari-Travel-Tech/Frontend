"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { format } from "date-fns"
import {
  Briefcase,
  CalendarIcon,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Heart,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Trash2,
  User as UserIcon,
} from "lucide-react"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/app/providers"
import { uploadUserAvatarImage } from "@/lib/api/uploads"
import { DEFAULT_AVATAR_IMAGE, getAvatarImageUrl } from "@/lib/avatar"
import { USER_MIN_AGE } from "@/lib/profile-validation"
import {
  type PreferenceCategory,
  type Preferences,
  PREFERENCE_OPTIONS,
  TAB_TITLES,
  CATEGORY_ORDER,
  MIN_REQUIRED,
} from "@/lib/preferences-data"

const SECTION_NAV: { id: AccountSection; label: string; icon: typeof UserIcon }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "preferences", label: "Preferences", icon: Heart },
  { id: "security", label: "Security", icon: Shield },
  { id: "help", label: "Help & support", icon: HelpCircle },
]

type AccountSection =
  | "profile"
  | "security"
  | "preferences"
  | "help"

export default function ProfilePage() {
  const {
    profile,
    session,
    updateProfile,
    user,
    logout,
    refreshProfile,
    userPreferences,
    updateUserPreferences,
    isLoadingPreferences,
  } = useAuth()
  const [activeSection, setActiveSection] = useState<AccountSection>("profile")
  // Mobile-only: "menu" shows the sidebar, "section" shows the chosen section content full-width.
  // On lg+ this state is ignored — both panels are always visible.
  const [mobileView, setMobileView] = useState<"menu" | "section">("menu")

  const goToSection = (id: AccountSection) => {
    setActiveSection(id)
    setMobileView("section")
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // interests (UI-only)
  const ALL_INTERESTS = [
    "Music", "Comedy", "Workshops", "Festivals", "Movies", "Theatre",
    "Food", "Sports", "Tech", "Art", "Networking", "Wellness",
  ]
  const [interests, setInterests] = useState<string[]>([])
  const toggleInterest = (name: string) => {
    setInterests((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))
  }

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [dobOpen, setDobOpen] = useState(false)
  const [location, setLocation] = useState("")
  const [gender, setGender] = useState("")
  const [profession, setProfession] = useState("")

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [cropSource, setCropSource] = useState<string | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [cropZoom, setCropZoom] = useState(1)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 })
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null)

  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [prefs, setPrefs] = useState<Preferences>({
    travel: [],
    interests: [],
    food: [],
    emotional: [],
    logistics: [],
  })
  const [prefSaving, setPrefSaving] = useState(false)
  const [prefMsg, setPrefMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  const cropContainerRef = useRef<HTMLDivElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)

  const greetingName = useMemo(() => {
    const full = (name || profile?.full_name || "").trim()
    if (full) return full.split(/\s+/)[0]
    const e = email || session?.user?.email || ""
    return e.split("@")[0] || "there"
  }, [name, profile?.full_name, email, session?.user?.email])

  useEffect(() => {
    setEmail(session?.user?.email ?? profile?.email ?? "")
    setName(profile?.full_name ?? "")
    setPhone((profile?.phone ?? "").replace(/^\+91/, ""))
    setDob(profile?.dob ?? "")
    setLocation(profile?.location ?? "")
    setGender(profile?.gender ?? "")
    setProfession(profile?.profession ?? "")
    setAvatarPreview(profile?.avatar_url ?? DEFAULT_AVATAR_IMAGE)
  }, [profile, session?.user?.email])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!userPreferences) return
    setPrefs({
      travel: userPreferences.travel ?? [],
      interests: userPreferences.interests ?? [],
      food: userPreferences.food ?? [],
      emotional: userPreferences.emotional ?? [],
      logistics: userPreferences.logistics ?? [],
    })
  }, [userPreferences])

  const togglePref = (cat: PreferenceCategory, opt: string) => {
    setPrefMsg(null)
    setPrefs((prev) => {
      const current = prev[cat]
      return {
        ...prev,
        [cat]: current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt],
      }
    })
  }

  const prefCompletion = useMemo(() => {
    const map = {} as Record<PreferenceCategory, { count: number; done: boolean }>
    for (const c of CATEGORY_ORDER) {
      const count = prefs[c].length
      map[c] = { count, done: count >= MIN_REQUIRED }
    }
    return map
  }, [prefs])

  const prefDone = useMemo(
    () => CATEGORY_ORDER.filter((c) => prefCompletion[c].done).length,
    [prefCompletion],
  )
  const prefPercent = Math.round((prefDone / CATEGORY_ORDER.length) * 100)

  const savePrefs = async () => {
    setPrefMsg(null)
    setPrefSaving(true)
    try {
      await updateUserPreferences(prefs)
      setPrefMsg({ type: "ok", text: "Preferences saved." })
    } catch (e) {
      setPrefMsg({
        type: "err",
        text: e instanceof Error ? e.message : "Could not save preferences.",
      })
    } finally {
      setPrefSaving(false)
    }
  }

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
    setMessage(null)
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PNG, JPG, or WEBP images are allowed.")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be 5MB or less.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (!result) return

      const img = new Image()
      img.onload = () => {
        setCropImage(img)
        setCropSource(result)
        setCropZoom(1)
        setCropOffset({ x: 0, y: 0 })
        setIsCropOpen(true)
      }
      img.src = result
    }
    reader.readAsDataURL(file)
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
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(
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

    if (!blob || blob.size > MAX_FILE_SIZE) {
      setError("Cropped image is too large. Try zooming out.")
      return
    }

    const croppedFile = new File([blob], "avatar.webp", { type: "image/webp" })

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const previewUrl = URL.createObjectURL(croppedFile)
    previewUrlRef.current = previewUrl

    setAvatarPreview(previewUrl)
    setAvatarFile(croppedFile)
    setIsCropOpen(false)

    // Upload immediately — independent of the rest of the profile form.
    setError(null)
    setMessage(null)
    setAvatarUploading(true)
    try {
      const upload = await uploadUserAvatarImage(croppedFile)
      const fallback = user?.id ? getAvatarImageUrl("users", user.id, upload.version) : null
      const nextUrl = upload.publicUrl ?? fallback
      if (nextUrl) setAvatarPreview(nextUrl)
      setAvatarFile(null)
      // Refresh global auth profile so the navbar/dropdown avatar picks up the new image
      try {
        await refreshProfile()
      } catch {
        // non-fatal — local preview still updates immediately
      }
      setMessage("Profile photo updated.")
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload photo.")
    } finally {
      setAvatarUploading(false)
    }
  }

  const closeCrop = () => {
    setIsCropOpen(false)
    setCropSource(null)
    setCropImage(null)
  }

  const { completedFields, totalFields, completionPercent } = useMemo(() => {
    const fields = [name, phone, dob, location, gender, profession]
    const filled = fields.filter((v) => v && String(v).trim().length > 0).length
    const total = fields.length
    return {
      completedFields: filled,
      totalFields: total,
      completionPercent: Math.round((filled / total) * 100),
    }
  }, [name, phone, dob, location, gender, profession])

  // All required text fields filled (excludes email which is locked)
  const allRequiredFilled = useMemo(
    () =>
      [name, phone, dob, location, gender, profession].every(
        (v) => v && String(v).trim().length > 0,
      ),
    [name, phone, dob, location, gender, profession],
  )

  // Dirty check — compare current form values to the loaded profile (normalized to match useEffect's seeding).
  const isFormDirty = useMemo(() => {
    const orig = {
      name: (profile?.full_name ?? "").trim(),
      phone: (profile?.phone ?? "").replace(/^\+91/, "").trim(),
      dob: profile?.dob ?? "",
      location: (profile?.location ?? "").trim(),
      gender: profile?.gender ?? "",
      profession: (profile?.profession ?? "").trim(),
    }
    return (
      name.trim() !== orig.name ||
      phone.trim() !== orig.phone ||
      dob !== orig.dob ||
      location.trim() !== orig.location ||
      gender !== orig.gender ||
      profession.trim() !== orig.profession
    )
  }, [
    name,
    phone,
    dob,
    location,
    gender,
    profession,
    profile?.full_name,
    profile?.phone,
    profile?.dob,
    profile?.location,
    profile?.gender,
    profile?.profession,
  ])

  const canSubmit = allRequiredFilled && isFormDirty && !loading

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!name.trim() || !phone.trim() || !dob.trim() || !location.trim() || !gender.trim() || !profession.trim()) {
      setError("Please fill in all required fields. Marked with *")
      setLoading(false)
      return
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits.")
      setLoading(false)
      return
    }

    try {
      await updateProfile({
        fullName: name.trim(),
        phone: `+91${phone.trim()}`,
        dob: dob.trim(),
        location: location.trim(),
        gender: gender.trim(),
        profession: profession.trim(),
      })

      setMessage("Profile updated successfully.")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Profile could not be updated.")
    } finally {
      setLoading(false)
    }
  }

  const preferencesContent = (
    <div className="space-y-5">
      <SectionHeader
        icon={Heart}
        title="Preferences"
        subtitle="Tell us what you love. We'll surface events you'll actually enjoy."
      />

      {/* Overall progress */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Overall progress
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {prefDone} of {CATEGORY_ORDER.length} sections complete
            </p>
          </div>
          <span className="font-bricolage text-2xl font-bold text-(--brand-navy)">
            {prefPercent}%
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-(--brand-blue) via-(--brand-navy) to-emerald-500 transition-[width] duration-700"
            style={{ width: `${prefPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Pick at least {MIN_REQUIRED} per section.
        </p>
      </div>

      {/* Category sections */}
      {CATEGORY_ORDER.map((cat) => {
        const { count, done } = prefCompletion[cat]
        const options = PREFERENCE_OPTIONS[cat]
        return (
          <div
            key={cat}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-bricolage text-base font-bold text-slate-900 md:text-lg">
                  {TAB_TITLES[cat]}
                </h4>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{count}</span>
                  <span>
                    {" "}
                    / {options.length} picked
                  </span>
                  <span className="ml-1 text-slate-400">· need {MIN_REQUIRED}</span>
                </p>
              </div>
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Done
                </span>
              ) : count > 0 ? (
                <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  In progress
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Get started
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const selected = prefs[cat].includes(opt)
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => togglePref(cat, opt)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition md:text-sm ${
                      selected
                        ? "border-(--brand-navy) bg-(--brand-navy) text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Save footer */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center md:p-6">
        <div className="min-w-0 text-xs text-slate-600 sm:text-sm">
          {prefMsg ? (
            prefMsg.type === "ok" ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {prefMsg.text}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {prefMsg.text}
              </span>
            )
          ) : isLoadingPreferences ? (
            <span className="text-slate-500">Loading your preferences…</span>
          ) : prefDone === CATEGORY_ORDER.length ? (
            <span>All sections complete. Save to update your recommendations.</span>
          ) : (
            <span>
              {prefDone} of {CATEGORY_ORDER.length} sections complete.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={savePrefs}
          disabled={prefSaving || isLoadingPreferences}
          className="w-full rounded-full bg-(--brand-navy) px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-(--brand-navy)/20 transition hover:bg-(--brand-navy)/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {prefSaving ? "Saving…" : "Save preferences"}
        </button>
      </div>
    </div>
  )

  const menuListContent = (
    <>
      <ul className="grid gap-0.5 p-2">
        {SECTION_NAV.map((item) => {
          const active = activeSection === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => goToSection(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${
                  active ? "lg:bg-(--brand-navy) lg:text-white lg:shadow-sm lg:hover:bg-(--brand-navy)" : ""
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ${
                    active ? "lg:bg-white/15 lg:text-white" : ""
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{item.label}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500 ${
                    active ? "lg:text-white/70 lg:group-hover:text-white/70" : ""
                  }`}
                />
              </button>
            </li>
          )
        })}
      </ul>
      <div className="border-t border-slate-100 p-2">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
            <LogOut className="h-3.5 w-3.5" />
          </span>
          Log out
        </button>
      </div>
    </>
  )

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen bg-slate-50">
        {/* Subtle ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-(--blue-100)/40 blur-3xl" />
          <div className="absolute -top-16 right-0 h-[24rem] w-[24rem] rounded-full bg-(--blue-50) blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-[1400px] px-4 pt-8 pb-16 md:px-8 md:pt-12 lg:px-10">
          <div className="mx-auto grid w-full grid-cols-1 gap-6 lg:grid-cols-[20rem_minmax(0,1fr)] xl:gap-8">
            {/* LEFT SIDEBAR — compact identity + nav + slim completion */}
            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 lg:sticky lg:top-6 lg:self-start"
            >
              {/* Compact identity strip */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-25px_rgba(12,29,55,0.2)]">
                <div className="relative h-14 bg-linear-to-r from-(--brand-navy) via-(--brand-blue) to-sky-700">
                  <motion.div
                    animate={{ x: ["-30%", "130%"] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-white/20 to-transparent"
                  />
                </div>
                <div className="-mt-8 flex items-center gap-3 px-4 pb-4">
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    aria-label="Change profile photo"
                    disabled={avatarUploading}
                    className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md transition hover:ring-2 hover:ring-(--brand-blue)/40 disabled:cursor-wait"
                  >
                    <img
                      src={avatarPreview || DEFAULT_AVATAR_IMAGE}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = DEFAULT_AVATAR_IMAGE
                      }}
                    />
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-linear-to-t from-black/70 to-transparent pb-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {avatarUploading ? "Uploading…" : "Edit"}
                    </span>
                  </button>
                  <div className="min-w-0 flex-1 pt-7">
                    <h2 className="truncate font-bricolage text-base font-bold text-slate-900">
                      {name || profile?.full_name || "Add your name"}
                    </h2>
                    <p className="truncate text-xs text-slate-500">{email || "—"}</p>
                  </div>
                </div>

                {/* Hidden file input — triggered by clicking the avatar */}
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    handleAvatarChange(event.target.files?.[0] ?? null)
                    event.target.value = ""
                  }}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2.5">
                  {profession ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-900/8 px-2 py-0.5 text-[10px] font-semibold text-brand-900">
                      <Briefcase className="h-3 w-3" />
                      {profession}
                    </span>
                  ) : null}
                  {location ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                  ) : null}
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Primary navigation — the Account container stays in place;
                  its inside swaps from options list ↔ section content on mobile. */}
              <nav className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_-25px_rgba(12,29,55,0.2)]">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                    {mobileView === "section" ? SECTION_NAV.find((s) => s.id === activeSection)?.label : "Account"}
                  </p>
                  {mobileView === "section" ? (
                    <button
                      type="button"
                      onClick={() => setMobileView("menu")}
                      className="inline-flex items-center gap-1 rounded-full border border-transparent bg-(--brand-navy) px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-(--brand-navy)/90 lg:hidden"
                    >
                      <ChevronRight className="h-3 w-3 rotate-180" />
                      Back
                    </button>
                  ) : null}
                </div>
                {/* Desktop: menu list + logout always visible */}
                <div className="hidden lg:block">{menuListContent}</div>

                {/* Mobile: animated swap between menu and section content */}
                <div className="lg:hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    {mobileView === "menu" ? (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                      >
                        {menuListContent}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="section"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-5 border-t border-slate-100 p-4"
                      >
              {activeSection === "profile" ? (
              <>
                {/* Single cohesive profile card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-25px_rgba(12,29,55,0.18)]">
                  {/* Sub-section: Identity */}
                  <FormSection
                    icon={UserIcon}
                    title="Identity"
                    description="Basic info that appears across Baatasari."
                    accent="navy"
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FieldShell label="Full name" required>
                        <FieldInput
                          icon={UserIcon}
                          placeholder="Your name"
                          value={name}
                          onChange={(v) => setName(v)}
                          hint="As it should appear on tickets."
                        />
                      </FieldShell>

                      <FieldShell label="Email" hint="To change your email, contact support.">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <input
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                            type="email"
                            value={email}
                            readOnly
                            disabled
                          />
                          {user?.emailVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Verified" />
                          ) : null}
                        </div>
                      </FieldShell>

                      <FieldShell label="Phone number" required>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-(--brand-navy) focus-within:ring-4 focus-within:ring-(--brand-navy)/10">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-500">+91</span>
                          <input
                            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder="10 digit number"
                            inputMode="numeric"
                            maxLength={10}
                            value={phone}
                            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                          />
                        </div>
                      </FieldShell>

                      <FieldShell label="Date of birth" required hint="You must be 13+ to use Baatasari.">
                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-(--brand-navy) focus:outline-none focus:ring-4 focus:ring-(--brand-navy)/10"
                            >
                              <span className={dob ? "text-slate-900" : "text-slate-400"}>
                                {dob ? format(new Date(dob + "T00:00:00"), "PPP") : "Select date of birth"}
                              </span>
                              <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dob ? new Date(dob + "T00:00:00") : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setDob(format(date, "yyyy-MM-dd"))
                                  setDobOpen(false)
                                }
                              }}
                              captionLayout="dropdown"
                              fromYear={new Date().getFullYear() - 100}
                              toYear={new Date().getFullYear() - USER_MIN_AGE}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FieldShell>
                    </div>
                  </FormSection>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Sub-section: About you */}
                  <FormSection
                    icon={Sparkles}
                    title="About you"
                    description="Helps us recommend events you'll actually love."
                    accent="emerald"
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FieldShell label="Location" required>
                        <FieldInput
                          icon={MapPin}
                          placeholder="City, State"
                          value={location}
                          onChange={(v) => setLocation(v)}
                        />
                      </FieldShell>

                      <FieldShell label="Gender" required>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-(--brand-navy) focus:outline-none focus:ring-4 focus:ring-(--brand-navy)/10"
                          value={gender}
                          onChange={(event) => setGender(event.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </FieldShell>

                      <FieldShell label="Profession" required>
                        <FieldInput
                          icon={Briefcase}
                          placeholder="Student, Designer, Engineer..."
                          value={profession}
                          onChange={(v) => setProfession(v)}
                        />
                      </FieldShell>
                    </div>
                  </FormSection>

                  {/* Footer with status + save */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
                    <div className="min-w-0 text-xs text-slate-500">
                      {error ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-rose-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {error}
                        </span>
                      ) : message ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {message}
                        </span>
                      ) : (
                        <span>
                          {completionPercent === 100
                            ? "Your profile is fully set up."
                            : `${completedFields}/${totalFields} required fields filled.`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={canSubmit ? { scale: 1.02 } : undefined}
                        whileTap={canSubmit ? { scale: 0.97 } : undefined}
                        className="group relative overflow-hidden rounded-full bg-(--brand-navy) px-7 py-2 text-sm font-semibold text-white shadow-lg shadow-(--brand-navy)/20 transition hover:bg-(--brand-navy)/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        onClick={handleSave}
                        disabled={!canSubmit}
                      >
                        {canSubmit ? (
                          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        ) : null}
                        <span className="relative">{loading ? "Saving..." : "Save"}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
              ) : null}

              {activeSection === "security" ? (
                <div className="space-y-5">
                  <SectionHeader icon={Shield} title="Security" subtitle="Protect your account." />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoCard
                      icon={Mail}
                      label="Email"
                      value={email}
                      pill={user?.emailVerified ? "Verified" : "Unverified"}
                      pillTone={user?.emailVerified ? "emerald" : "amber"}
                    />
                    <InfoCard
                      icon={KeyRound}
                      label="Password"
                      value="Last changed —"
                      action={
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-(--brand-blue) hover:underline"
                        >
                          Change
                        </Link>
                      }
                    />
                    <InfoCard
                      icon={Smartphone}
                      label="Phone"
                      value={phone ? `+91 ${phone}` : "Not set"}
                      pill={phone ? "Not linked" : "Add number"}
                      pillTone="amber"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">Two-factor authentication</p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Coming soon
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Add an extra layer of security at sign-in.</p>
                      </div>
                    </div>
                  </div>

                  <DangerZone
                    title="Delete account"
                    description="Permanently delete your account and all associated tickets and history. This action is irreversible."
                    actionLabel="Request deletion"
                  />
                </div>
              ) : null}

              {activeSection === "preferences" ? preferencesContent : null}

              {activeSection === "help" ? (
                <div className="space-y-5">
                  <SectionHeader icon={HelpCircle} title="Help & support" subtitle="We&apos;re here to help." />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <Link href="/contact-us" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Mail className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Contact us</p>
                      <p className="mt-1 text-xs text-slate-500">Reach out for support. We reply within 24 hours.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                    <Link href="/terms&conditions" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Shield className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Terms &amp; policies</p>
                      <p className="mt-1 text-xs text-slate-500">Read our terms of service and acceptable-use policy.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                    <Link href="/privacy-policy" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Lock className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Privacy policy</p>
                      <p className="mt-1 text-xs text-slate-500">How we collect, use, and protect your data.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-(--brand-navy) to-(--brand-blue) p-6 text-white shadow-lg">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">App version</p>
                    <p className="mt-1 text-lg font-semibold">Baatasari · v1.0</p>
                    <p className="mt-1 text-xs text-white/70">Built for personalized experiences in Vizag.</p>
                  </div>
                </div>
              ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

            </motion.aside>

            {/* RIGHT — section content (desktop only; mobile renders it inside the Account container) */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="hidden space-y-5 lg:block"
            >
              {activeSection === "profile" ? (
              <>
                {/* Single cohesive profile card */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-25px_rgba(12,29,55,0.18)]">
                  {/* Sub-section: Identity */}
                  <FormSection
                    icon={UserIcon}
                    title="Identity"
                    description="Basic info that appears across Baatasari."
                    accent="navy"
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FieldShell label="Full name" required>
                        <FieldInput
                          icon={UserIcon}
                          placeholder="Your name"
                          value={name}
                          onChange={(v) => setName(v)}
                          hint="As it should appear on tickets."
                        />
                      </FieldShell>

                      <FieldShell label="Email" hint="To change your email, contact support.">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-sm">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <input
                            className="w-full bg-transparent text-sm text-slate-900 outline-none"
                            type="email"
                            value={email}
                            readOnly
                            disabled
                          />
                          {user?.emailVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Verified" />
                          ) : null}
                        </div>
                      </FieldShell>

                      <FieldShell label="Phone number" required>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-(--brand-navy) focus-within:ring-4 focus-within:ring-(--brand-navy)/10">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-500">+91</span>
                          <input
                            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                            placeholder="10 digit number"
                            inputMode="numeric"
                            maxLength={10}
                            value={phone}
                            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                          />
                        </div>
                      </FieldShell>

                      <FieldShell label="Date of birth" required hint="You must be 13+ to use Baatasari.">
                        <Popover open={dobOpen} onOpenChange={setDobOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-(--brand-navy) focus:outline-none focus:ring-4 focus:ring-(--brand-navy)/10"
                            >
                              <span className={dob ? "text-slate-900" : "text-slate-400"}>
                                {dob ? format(new Date(dob + "T00:00:00"), "PPP") : "Select date of birth"}
                              </span>
                              <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dob ? new Date(dob + "T00:00:00") : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setDob(format(date, "yyyy-MM-dd"))
                                  setDobOpen(false)
                                }
                              }}
                              captionLayout="dropdown"
                              fromYear={new Date().getFullYear() - 100}
                              toYear={new Date().getFullYear() - USER_MIN_AGE}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </FieldShell>
                    </div>
                  </FormSection>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Sub-section: About you */}
                  <FormSection
                    icon={Sparkles}
                    title="About you"
                    description="Helps us recommend events you'll actually love."
                    accent="emerald"
                  >
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <FieldShell label="Location" required>
                        <FieldInput
                          icon={MapPin}
                          placeholder="City, State"
                          value={location}
                          onChange={(v) => setLocation(v)}
                        />
                      </FieldShell>

                      <FieldShell label="Gender" required>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-(--brand-navy) focus:outline-none focus:ring-4 focus:ring-(--brand-navy)/10"
                          value={gender}
                          onChange={(event) => setGender(event.target.value)}
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </FieldShell>

                      <FieldShell label="Profession" required>
                        <FieldInput
                          icon={Briefcase}
                          placeholder="Student, Designer, Engineer..."
                          value={profession}
                          onChange={(v) => setProfession(v)}
                        />
                      </FieldShell>
                    </div>
                  </FormSection>

                  {/* Footer with status + save */}
                  <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
                    <div className="min-w-0 text-xs text-slate-500">
                      {error ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-rose-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          {error}
                        </span>
                      ) : message ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {message}
                        </span>
                      ) : (
                        <span>
                          {completionPercent === 100
                            ? "Your profile is fully set up."
                            : `${completedFields}/${totalFields} required fields filled.`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={canSubmit ? { scale: 1.02 } : undefined}
                        whileTap={canSubmit ? { scale: 0.97 } : undefined}
                        className="group relative overflow-hidden rounded-full bg-(--brand-navy) px-7 py-2 text-sm font-semibold text-white shadow-lg shadow-(--brand-navy)/20 transition hover:bg-(--brand-navy)/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                        onClick={handleSave}
                        disabled={!canSubmit}
                      >
                        {canSubmit ? (
                          <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        ) : null}
                        <span className="relative">{loading ? "Saving..." : "Save"}</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </>
              ) : null}

              {activeSection === "security" ? (
                <div className="space-y-5">
                  <SectionHeader icon={Shield} title="Security" subtitle="Protect your account." />

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <InfoCard
                      icon={Mail}
                      label="Email"
                      value={email}
                      pill={user?.emailVerified ? "Verified" : "Unverified"}
                      pillTone={user?.emailVerified ? "emerald" : "amber"}
                    />
                    <InfoCard
                      icon={KeyRound}
                      label="Password"
                      value="Last changed —"
                      action={
                        <Link
                          href="/forgot-password"
                          className="text-xs font-semibold text-(--brand-blue) hover:underline"
                        >
                          Change
                        </Link>
                      }
                    />
                    <InfoCard
                      icon={Smartphone}
                      label="Phone"
                      value={phone ? `+91 ${phone}` : "Not set"}
                      pill={phone ? "Not linked" : "Add number"}
                      pillTone="amber"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">Two-factor authentication</p>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                            Coming soon
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">Add an extra layer of security at sign-in.</p>
                      </div>
                    </div>
                  </div>

                  <DangerZone
                    title="Delete account"
                    description="Permanently delete your account and all associated tickets and history. This action is irreversible."
                    actionLabel="Request deletion"
                  />
                </div>
              ) : null}

              {activeSection === "preferences" ? preferencesContent : null}

              {activeSection === "help" ? (
                <div className="space-y-5">
                  <SectionHeader icon={HelpCircle} title="Help & support" subtitle="We&apos;re here to help." />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <Link href="/contact-us" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Mail className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Contact us</p>
                      <p className="mt-1 text-xs text-slate-500">Reach out for support. We reply within 24 hours.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                    <Link href="/terms&conditions" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Shield className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Terms &amp; policies</p>
                      <p className="mt-1 text-xs text-slate-500">Read our terms of service and acceptable-use policy.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                    <Link href="/privacy-policy" className="group block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                      <Lock className="h-5 w-5 text-(--brand-blue)" />
                      <p className="mt-3 text-sm font-semibold text-slate-900">Privacy policy</p>
                      <p className="mt-1 text-xs text-slate-500">How we collect, use, and protect your data.</p>
                      <p className="mt-3 inline-flex items-center text-xs font-semibold text-(--brand-blue) group-hover:underline">
                        Open <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </p>
                    </Link>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-(--brand-navy) to-(--brand-blue) p-6 text-white shadow-lg">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">App version</p>
                    <p className="mt-1 text-lg font-semibold">Baatasari · v1.0</p>
                    <p className="mt-1 text-xs text-white/70">Built for personalized experiences in Vizag.</p>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>

        {isCropOpen ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white p-5 shadow-[0_30px_70px_rgba(15,23,42,0.3)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Adjust image</p>
                  <h3 className="text-xl font-semibold text-slate-900">Set your profile crop</h3>
                </div>
                <button
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
                        setCropOffset((prev) => clampOffset(prev, nextZoom))
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-500">Drag to reposition.</p>
                  </div>

                  <button
                    className="w-full rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                    onClick={applyCrop}
                  >
                    Use this image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}

// ─── Section helpers ─────────────────────────────────────────────────────

type LucideIcon = typeof UserIcon

function FormSection({
  icon: Icon,
  title,
  description,
  accent = "navy",
  children,
}: {
  icon: LucideIcon
  title: string
  description?: string
  accent?: "navy" | "emerald" | "blue"
  children: React.ReactNode
}) {
  const tones: Record<string, string> = {
    navy: "bg-(--brand-navy)/8 text-(--brand-navy)",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-(--blue-50) text-(--brand-blue)",
  }
  return (
    <div className="p-6 md:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[accent]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {children}
    </div>
  )
}

function FieldShell({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  )
}

function FieldInput({
  icon: Icon,
  placeholder,
  value,
  onChange,
  hint: _hint,
}: {
  icon: LucideIcon
  placeholder: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-(--brand-navy) focus-within:ring-4 focus-within:ring-(--brand-navy)/10">
      <Icon className="h-4 w-4 text-slate-400" />
      <input
        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--brand-navy)/8 text-(--brand-navy)">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-bricolage text-2xl font-bold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
  pill,
  pillTone,
  action,
}: {
  icon: LucideIcon
  label: string
  value: string
  pill?: string
  pillTone?: "emerald" | "amber" | "blue"
  action?: React.ReactNode
}) {
  const toneClass =
    pillTone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : pillTone === "amber"
        ? "bg-amber-50 text-amber-700"
        : "bg-(--blue-50) text-(--brand-blue)"
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_15px_40px_-25px_rgba(12,29,55,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{value}</p>
          </div>
        </div>
        {action}
      </div>
      {pill ? (
        <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${toneClass}`}>
          {pill}
        </span>
      ) : null}
    </div>
  )
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  badge,
}: {
  icon: LucideIcon
  title: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
  badge?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {badge ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={!!badge}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
          checked ? "bg-(--brand-navy)" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}

function DangerZone({
  title,
  description,
  actionLabel,
}: {
  title: string
  description: string
  actionLabel: string
}) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <Trash2 className="h-4 w-4" />
        </span>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-rose-700">{title}</h4>
          <p className="mt-1 text-xs text-rose-600/90">{description}</p>
          <button
            type="button"
            className="mt-3 inline-flex items-center rounded-full border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

