"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Bike,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/providers"
import {
  type PreferenceCategory,
  type Preferences,
  PREFERENCE_CARDS,
  PREFERENCE_OPTIONS,
  TAB_TITLES,
  CATEGORY_ORDER,
  MIN_REQUIRED,
} from "@/lib/preferences-data"

const emptyPreferences: Preferences = {
  travel: [],
  interests: [],
  food: [],
  emotional: [],
  logistics: [],
}

type LucideIcon = typeof MapPin

const CATEGORY_META: Record<
  PreferenceCategory,
  { icon: LucideIcon; tone: string; description: string }
> = {
  travel: {
    icon: MapPin,
    tone: "from-blue-500 to-sky-500",
    description: "How you like to explore — pace, places, and surroundings.",
  },
  interests: {
    icon: Sparkles,
    tone: "from-violet-500 to-fuchsia-500",
    description: "Hobbies and activities you keep coming back to.",
  },
  food: {
    icon: UtensilsCrossed,
    tone: "from-amber-500 to-orange-500",
    description: "Cuisines, dining spots, and food experiences you love.",
  },
  emotional: {
    icon: Heart,
    tone: "from-rose-500 to-pink-500",
    description: "The vibe you're after when you step out.",
  },
  logistics: {
    icon: Bike,
    tone: "from-emerald-500 to-teal-500",
    description: "How you move around and plan your day.",
  },
}

interface PreferencesPanelProps {
  /** When true, drop the page-level hero header (used when nested inside another page like /profile). */
  embedded?: boolean
}

export function PreferencesPanel({ embedded = false }: PreferencesPanelProps) {
  const { userPreferences, updateUserPreferences, isLoadingPreferences } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PreferenceCategory>("travel")
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!userPreferences) return
    setPreferences({
      travel: userPreferences.travel ?? [],
      interests: userPreferences.interests ?? [],
      food: userPreferences.food ?? [],
      emotional: userPreferences.emotional ?? [],
      logistics: userPreferences.logistics ?? [],
    })
  }, [userPreferences])

  const handleCardClick = (category: PreferenceCategory) => {
    setActiveTab(category)
    setIsModalOpen(true)
  }

  const togglePreference = (category: PreferenceCategory, option: string) => {
    setPreferences((prev) => {
      const current = prev[category]
      return {
        ...prev,
        [category]: current.includes(option)
          ? current.filter((i) => i !== option)
          : [...current, option],
      }
    })
  }

  const completionByCategory = useMemo(() => {
    const map = {} as Record<PreferenceCategory, { count: number; done: boolean }>
    for (const c of CATEGORY_ORDER) {
      const count = preferences[c].length
      map[c] = { count, done: count >= MIN_REQUIRED }
    }
    return map
  }, [preferences])

  const doneCount = useMemo(
    () => CATEGORY_ORDER.filter((c) => completionByCategory[c].done).length,
    [completionByCategory],
  )
  const totalCategories = CATEGORY_ORDER.length
  const overallPercent = Math.round((doneCount / totalCategories) * 100)
  const isReadyToSave = doneCount === totalCategories
  const isCurrentCategoryComplete = completionByCategory[activeTab].done

  const handleSave = async () => {
    if (!isCurrentCategoryComplete) {
      setError(`Please pick at least ${MIN_REQUIRED} options in this section.`)
      return
    }
    setError(null)
    setSuccess(null)

    const currentIdx = CATEGORY_ORDER.indexOf(activeTab)
    let nextIdx = currentIdx + 1
    while (nextIdx < CATEGORY_ORDER.length && completionByCategory[CATEGORY_ORDER[nextIdx]].done) {
      nextIdx++
    }
    if (nextIdx < CATEGORY_ORDER.length) {
      setActiveTab(CATEGORY_ORDER[nextIdx])
      return
    }

    setSaving(true)
    try {
      await updateUserPreferences(preferences)
      setIsModalOpen(false)
      setSuccess("Preferences saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveOnly = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      await updateUserPreferences(preferences)
      setSuccess("Preferences saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Hero header (only when rendered as standalone page) */}
      {!embedded ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_60px_-30px_rgba(12,29,55,0.25)]"
        >
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute inset-y-0 right-0 w-[50%] bg-linear-to-bl from-(--brand-navy) via-[#1a3a6b] to-(--brand-blue)"
              style={{ clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0 100%)" }}
            />
            <motion.div
              animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl"
            />
          </div>
          <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-(--brand-blue) shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-(--brand-blue)" />
                Personalize
              </div>
              <h1 className="mt-3 font-bricolage text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                My preferences
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">
                Tell us what you love. We&apos;ll surface events you&apos;ll actually enjoy.
              </p>
            </div>

            <div className="relative z-10 w-full max-w-xs rounded-2xl border border-white/20 bg-white/10 p-4 text-white backdrop-blur-md md:w-72">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
                <span>Overall</span>
                <span>
                  {doneCount} / {totalCategories} complete
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallPercent}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full bg-linear-to-r from-emerald-300 to-emerald-500"
                />
              </div>
              <p className="mt-2 text-xs text-white/75">
                Minimum {MIN_REQUIRED} picks per section.
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Compact progress strip (only when embedded) */}
      {embedded ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Overall progress
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {doneCount} of {totalCategories} sections complete
              </p>
            </div>
            <span className="font-bricolage text-2xl font-bold text-(--brand-navy)">
              {overallPercent}%
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPercent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-linear-to-r from-(--brand-blue) via-(--brand-navy) to-emerald-500"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Minimum {MIN_REQUIRED} picks per section.
          </p>
        </div>
      ) : null}

      {/* Status banners */}
      <AnimatePresence>
        {isLoadingPreferences ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500"
          >
            Loading your preferences…
          </motion.p>
        ) : null}
        {success ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </motion.p>
        ) : null}
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* Category cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
        className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PREFERENCE_CARDS.map((card, cardIndex) => {
          const meta = CATEGORY_META[card.category]
          const { count, done } = completionByCategory[card.category]
          const total = PREFERENCE_OPTIONS[card.category].length
          const percent = Math.min(100, Math.round((count / Math.max(MIN_REQUIRED, total)) * 100))

          return (
            <motion.button
              key={card.category}
              type="button"
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleCardClick(card.category)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-lg md:p-6"
            >
              <div className="absolute right-4 top-4 z-10">
                {done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </span>
                ) : count > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    In progress
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Get started
                  </span>
                )}
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${meta.tone} text-white shadow-md`}
                >
                  <meta.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 pr-16">
                  <h2 className="font-bricolage text-lg font-bold leading-tight text-slate-900 md:text-xl">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 md:text-sm">{meta.description}</p>
                </div>
              </div>

              <div className="relative my-4 hidden h-28 w-full sm:block">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  priority={cardIndex === 0}
                  className="object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  {count} / {total} picked
                  <span className="ml-1 text-slate-400">· need {MIN_REQUIRED}</span>
                </span>
                <span className="inline-flex items-center text-(--brand-blue) opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-linear-to-r ${meta.tone}`}
                />
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Global save bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center md:p-5"
      >
        <div className="text-xs text-slate-600 sm:text-sm">
          {isReadyToSave
            ? "All sections complete. Save to update your recommendations."
            : `${doneCount} of ${totalCategories} sections complete — open any card to continue.`}
        </div>
        <Button
          onClick={handleSaveOnly}
          disabled={saving || doneCount === 0}
          className="w-full rounded-full bg-(--brand-navy) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--brand-navy)/90 disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Saving…" : "Save preferences"}
        </Button>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[760px] sm:rounded-3xl"
            >
              <div className="relative border-b border-slate-100 px-5 py-5 md:px-8 md:py-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {CATEGORY_ORDER.indexOf(activeTab) + 1} of {totalCategories}
                </p>
                <h2 className="mt-1 pr-12 font-bricolage text-xl font-bold text-slate-900 md:text-2xl">
                  {TAB_TITLES[activeTab]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {CATEGORY_META[activeTab].description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {CATEGORY_ORDER.map((c, i) => {
                    const isActive = c === activeTab
                    const isDone = completionByCategory[c].done
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setActiveTab(c)}
                        className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                          isActive
                            ? "border-(--brand-navy) bg-(--brand-navy) text-white"
                            : isDone
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="h-3 w-3" /> : <span className="text-[9px] font-bold">{i + 1}</span>}
                        <span className="hidden sm:inline">{TAB_TITLES[c].split(" ")[0]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-6">
                <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <span className="font-semibold text-slate-900">
                      {completionByCategory[activeTab].count}
                    </span>{" "}
                    of {PREFERENCE_OPTIONS[activeTab].length} selected
                  </span>
                  <span>
                    {isCurrentCategoryComplete ? "Looks good!" : `Pick at least ${MIN_REQUIRED}`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 md:gap-2.5">
                  {PREFERENCE_OPTIONS[activeTab].map((option) => {
                    const selected = preferences[activeTab].includes(option)
                    return (
                      <motion.button
                        key={option}
                        type="button"
                        onClick={() => togglePreference(activeTab, option)}
                        whileTap={{ scale: 0.95 }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition md:text-sm ${
                          selected
                            ? "border-(--brand-navy) bg-(--brand-navy) text-white shadow"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        {option}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 md:px-8 md:py-5">
                <Button
                  onClick={() => {
                    const idx = CATEGORY_ORDER.indexOf(activeTab)
                    if (idx > 0) setActiveTab(CATEGORY_ORDER[idx - 1])
                    else setIsModalOpen(false)
                  }}
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {CATEGORY_ORDER.indexOf(activeTab) === 0 ? "Close" : "Back"}
                </Button>

                <div className="hidden text-xs text-slate-500 sm:block">
                  Min {MIN_REQUIRED} per section
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full bg-(--brand-navy) px-6 text-sm font-semibold text-white hover:bg-(--brand-navy)/90 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : activeTab === "logistics" && isReadyToSave
                      ? "Finish & save"
                      : isCurrentCategoryComplete
                        ? "Next"
                        : "Continue"}
                  {!saving && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
