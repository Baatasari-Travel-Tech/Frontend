"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import {
  Briefcase,
  CalendarIcon,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User as UserIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/app/providers"
import { USER_MIN_AGE } from "@/lib/profile-validation"
import { FieldInput, FieldShell, FormSection } from "../field-primitives"

type IdentityState = {
  name: string
  email: string
  phone: string
  dob: string
  location: string
  gender: string
  profession: string
}

type IdentitySetters = {
  setName: (v: string) => void
  setPhone: (v: string) => void
  setDob: (v: string) => void
  setLocation: (v: string) => void
  setGender: (v: string) => void
  setProfession: (v: string) => void
}

export function IdentitySection({
  state,
  setters,
}: {
  state: IdentityState
  setters: IdentitySetters
}) {
  const { profile, updateProfile, user } = useAuth()
  const { name, email, phone, dob, location, gender, profession } = state
  const { setName, setPhone, setDob, setLocation, setGender, setProfession } = setters

  const [dobOpen, setDobOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const allRequiredFilled = useMemo(
    () =>
      [name, phone, dob, location, gender, profession].every(
        (v) => v && String(v).trim().length > 0,
      ),
    [name, phone, dob, location, gender, profession],
  )

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

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-25px_rgba(12,29,55,0.18)]">
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

      <div className="border-t border-slate-100" />

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
  )
}
