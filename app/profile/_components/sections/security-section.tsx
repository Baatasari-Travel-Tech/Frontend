"use client"

import Link from "next/link"
import { KeyRound, Mail, Shield, ShieldCheck, Smartphone } from "lucide-react"
import { useAuth } from "@/app/providers"
import { DangerZone, InfoCard, SectionHeader } from "../field-primitives"

export function SecuritySection() {
  const { profile, session, user } = useAuth()
  const email = session?.user?.email ?? profile?.email ?? ""
  // Display the saved phone (with the +91 stripped for readability) rather
  // than the in-progress form value — Security panel describes the account,
  // not the unsaved edit.
  const phone = (profile?.phone ?? "").replace(/^\+91/, "")
  const emailVerified = !!user?.emailVerified

  return (
    <div className="space-y-5">
      <SectionHeader icon={Shield} title="Security" subtitle="Protect your account." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <InfoCard
          icon={Mail}
          label="Email"
          value={email}
          pill={emailVerified ? "Verified" : "Unverified"}
          pillTone={emailVerified ? "emerald" : "amber"}
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
  )
}
