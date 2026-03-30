"use client"

import { useState } from "react"
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  AVAILABLE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PRICE_OPTIONS,
  SKILL_OPTIONS,
  SLOT_OPTIONS,
} from "@/lib/talent-data"


const TRUST_POINTS = [
  "No subscriptions.",
  "No hidden charges.",
  "Verified visibility.",
]

export function TalentAPPLICATIONFORM() {
  const [skills, setSkills] = useState("")
  const [experienceLevel, setExperienceLevel] = useState("")
  const [yearOfExperience, setYearOfExperience] = useState("")
  const [bio, setBio] = useState("")
  const [preferredSlots, setPreferredSlots] = useState<string[]>([])
  const [location, setLocation] = useState("Vizag")
  const [availableFor, setAvailableFor] = useState<string[]>([])
  const [price, setPrice] = useState("")
  const [uploadWork, setUploadWork] = useState("")
  const [workLinks, setWorkLinks] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")

  const inputClassName =
    "h-12 rounded-2xl border-[var(--talent-input-border)] bg-[var(--talent-input-bg)] px-4 text-[var(--talent-input-text)] shadow-none placeholder:text-[var(--talent-input-placeholder)] focus-visible:ring-1 focus-visible:ring-[var(--talent-chip-active-border)]"
  const selectTriggerClassName = `${inputClassName} w-full`

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log({
      skills: skills === "Others" ? customSkill : skills,
      experienceLevel,
      yearOfExperience,
      bio,
      preferredSlots,
      location,
      availableFor,
      price,
      uploadWork: [...workLinks, ...(uploadWork.trim() ? [uploadWork.trim()] : [])],
    })
    alert("Application submitted! (This is a demo)")
  }

  const handleSlotClick = (slot: string) => {
    if (slot === "Everyday") {
      setPreferredSlots(preferredSlots.includes("Everyday") ? [] : SLOT_OPTIONS)
      return
    }

    let nextSlots = [...preferredSlots]

    if (nextSlots.includes(slot)) {
      nextSlots = nextSlots.filter((item) => item !== slot && item !== "Everyday")
    } else {
      nextSlots.push(slot)
      const everyDaySelected = SLOT_OPTIONS.slice(1).every((day) => nextSlots.includes(day))
      if (everyDaySelected) {
        nextSlots.push("Everyday")
      }
    }

    setPreferredSlots(nextSlots)
  }

  const handleAvailableClick = (option: string) => {
    if (option === "All") {
      setAvailableFor(availableFor.includes("All") ? [] : AVAILABLE_OPTIONS)
      return
    }

    let nextOptions = [...availableFor]

    if (nextOptions.includes(option)) {
      nextOptions = nextOptions.filter((item) => item !== option && item !== "All")
    } else {
      nextOptions.push(option)
      const allSelected = AVAILABLE_OPTIONS.slice(1).every((item) => nextOptions.includes(item))
      if (allSelected) {
        nextOptions.push("All")
      }
    }

    setAvailableFor(nextOptions)
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (value.endsWith(" ")) {
      const newLink = value.trim()
      if (newLink) {
        setWorkLinks((prev) => [...prev, newLink])
        setUploadWork("")
      }
      return
    }

    setUploadWork(value)
  }

  const removeLink = (index: number) => {
    setWorkLinks((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const renderChip = (
    value: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <Button
      key={value}
      type="button"
      variant="outline"
      onClick={onClick}
      className={`h-10 rounded-xl border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-none transition-colors ${
        active
          ? "border-(--talent-chip-active-border) bg-(--talent-chip-active-bg) text-(--talent-chip-active-text)"
          : "border-(--talent-chip-border) bg-(--talent-chip-bg) text-(--talent-chip-text) hover:bg-(--talent-surface-soft)"
      }`}
    >
      {value}
    </Button>
  )

  return (
    <main className="min-h-screen bg-(--talent-page-bg)">
        <div className="border-b border-(--talent-section-border) px-6 sm:px-10 lg:px-16" >
            <div className="mx-auto flex max-w-5xl flex-col items-center text-center">

            <h2 className="font-albert mt-8 text-3xl font-semibold text-(--talent-section-title) sm:text-4xl">
                Application Form
            </h2>

            <div className="font-albert mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-(--talent-section-subtitle)">
                {TRUST_POINTS.map((item) => (
                <div key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-(--talent-chip-active-text)" />
                    <span>{item}</span>
                </div>
                ))}
            </div>
            </div>
        </div>

        <div className="px-4 py-10 sm:px-8 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-8xl rounded-[2.4rem] border border-(--talent-form-shell-border) bg-(--talent-form-shell-bg) shadow-(--talent-form-shadow)">
            <div className="px-4 pt-0 sm:px-6">
                <div className="h-1.5 w-full rounded-b-full bg-(--talent-form-shell-top)" />
            </div>

            <form className="space-y-10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12" onSubmit={handleSubmit}>
                <header>
                <h3 className="font-albert text-3xl font-semibold text-(--talent-section-title)">
                    Artist Application
                </h3>
                <p className="font-albert mt-2 text-sm leading-7 text-(--talent-section-subtitle)">
                    Join our curated network of premium local talent.
                </p>
                </header>

                <section className="space-y-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--talent-card-icon-bg) text-(--talent-card-icon-fg)">
                    <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                    <h4 className="font-albert text-xl font-semibold text-(--talent-section-title)">
                        Professional Identity
                    </h4>
                    <p className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-kicker)">
                        Expertise &amp; background
                    </p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Main Skill
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Primary talent category</p>
                    {skills === "Others" ? (
                        <div className="relative">
                        <Input
                            placeholder="Enter your skill"
                            value={customSkill}
                            onChange={(e) => setCustomSkill(e.target.value)}
                            className={`${inputClassName} pr-11`}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                            setSkills("")
                            setCustomSkill("")
                            }}
                            className="absolute right-1 top-1 h-10 w-10 rounded-xl text-(--talent-input-icon) hover:bg-transparent hover:text-(--talent-chip-active-text)"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        </div>
                    ) : (
                        <Select value={skills} onValueChange={setSkills}>
                        <SelectTrigger className={selectTriggerClassName}>
                            <SelectValue placeholder="Select Skill" />
                        </SelectTrigger>
                        <SelectContent>
                            {SKILL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                    </div>

                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Artist Level
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Current professional status</p>
                    <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                        <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select Level" />
                        </SelectTrigger>
                        <SelectContent>
                        {EXPERIENCE_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Experience
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Total active years</p>
                    <Input
                        placeholder="Ex: 3 Years"
                        value={yearOfExperience}
                        onChange={(e) => setYearOfExperience(e.target.value)}
                        className={inputClassName}
                    />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                    The Artist Bio
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">
                    Describe your style and what makes your performance unique.
                    </p>
                    <Textarea
                    placeholder="Share your journey..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-32 rounded-[1.2rem] border-(--talent-input-border) bg-(--talent-input-bg) px-4 py-3 text-(--talent-input-text) shadow-none placeholder:text-(--talent-input-placeholder) focus-visible:ring-1 focus-visible:ring-(--talent-chip-active-border)"
                    />
                </div>
                </section>

                <section className="space-y-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--talent-card-icon-bg) text-(--talent-card-icon-fg)">
                    <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                    <h4 className="font-albert text-xl font-semibold text-(--talent-section-title)">
                        Logistics &amp; Pricing
                    </h4>
                    <p className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-kicker)">
                        Availability &amp; rates
                    </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="space-y-3">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Weekly Schedule
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Select your active days</p>
                    <div className="flex flex-wrap gap-2">
                        {SLOT_OPTIONS.map((slot) =>
                        renderChip(slot, preferredSlots.includes(slot), () => handleSlotClick(slot)),
                        )}
                    </div>
                    </div>

                    <div className="space-y-3">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Available For
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Preferred event types</p>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_OPTIONS.map((option) =>
                        renderChip(option, availableFor.includes(option), () => handleAvailableClick(option)),
                        )}
                    </div>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Base Location
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Primary city/town</p>
                    <div className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--talent-input-icon)" />
                        <Input
                        placeholder="Vizag"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={`${inputClassName} pl-10`}
                        />
                    </div>
                    </div>

                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Expected Price
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Starting range</p>
                    <Select value={price} onValueChange={setPrice}>
                        <SelectTrigger className={selectTriggerClassName}>
                        <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent>
                        {PRICE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                            {option.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="space-y-2">
                    <Label className="font-albert text-[11px] font-semibold uppercase tracking-[0.16em] text-(--talent-section-title)">
                        Portfolio Link
                    </Label>
                    <p className="font-albert text-xs text-(--talent-section-kicker)">Social or drive link</p>
                    <div className="space-y-2 rounded-[1.2rem] border border-(--talent-input-border) bg-(--talent-input-bg) px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                        {workLinks.map((link, index) => (
                            <div
                            key={`${link}-${index}`}
                            className="font-albert inline-flex max-w-full items-center gap-2 rounded-full bg-(--talent-chip-active-bg) px-3 py-1 text-xs text-(--talent-chip-active-text)"
                            >
                            <span className="truncate">{link}</span>
                            <button
                                type="button"
                                onClick={() => removeLink(index)}
                                className="text-(--talent-chip-active-text)"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                            </div>
                        ))}
                        </div>
                        <Input
                        placeholder="https://..."
                        value={uploadWork}
                        onChange={handleLinkChange}
                        className="h-auto border-0 bg-transparent px-0 py-0 text-(--talent-input-text) shadow-none placeholder:text-(--talent-input-placeholder) focus-visible:ring-0"
                        />
                    </div>
                    </div>
                </div>
                </section>

                <div className="flex flex-col items-center gap-5 pt-2">
                <Button
                    type="submit"
                    className="btn-primary h-15 min-w-[16rem] bg-brand-900 px-8 font-inter text-[16px] rounded-full leading-6 tracking-[0] text-(--white) shadow-(--talent-primary-btn-shadow) hover:bg-(--brand-navy)/90 hover:text-(--white)"
                >
                    Pay $249
                </Button>

                <div className="font-albert inline-flex items-center gap-2 rounded-full border border-(--talent-callout-border) bg-(--talent-callout-bg) px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--talent-callout-text)">
                    <Sparkles className="h-3.5 w-3.5 text-(--talent-callout-star)" />
                    Your profile will be reviewed by our curation team
                </div>
                </div>
            </form>
            </div>
        </div>

        <div className="border-t border-(--talent-section-border) px-6 py-8 sm:px-10 lg:px-16">
            <div className="font-albert mx-auto flex max-w-6xl flex-col gap-4 text-[10px] font-medium uppercase tracking-[0.24em] text-(--talent-footer-text) sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; 2026 Baatasari . Vizag</p>
            <div className="flex items-center gap-2 text-(--talent-footer-strong)">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified performer network</span>
            </div>
            </div>
        </div>
    </main>
  )
}