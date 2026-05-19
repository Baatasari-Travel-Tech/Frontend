"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { KeyRound, Mail, Shield, ShieldCheck, Smartphone } from "lucide-react"
import { useAuth } from "@/app/providers"
import { apiRequest } from "@/lib/api/client"
import { useToast } from "@/components/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DangerZone, InfoCard, SectionHeader } from "../field-primitives"

// Three-step delete flow:
//   idle    → user hasn't opened the dialog
//   request → dialog open, "Send OTP" button visible
//   confirm → OTP sent; OTP input + "DELETE" string + final Confirm button
type DeleteStep = "idle" | "request" | "confirm"

export function SecuritySection() {
  const { profile, session, user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const email = session?.user?.email ?? profile?.email ?? ""
  const phone = (profile?.phone ?? "").replace(/^\+91/, "")
  const emailVerified = !!user?.emailVerified

  const [step, setStep] = useState<DeleteStep>("idle")
  const [otp, setOtp] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [busy, setBusy] = useState(false)
  const dialogOpen = step !== "idle"

  const resetDialog = () => {
    setStep("idle")
    setOtp("")
    setConfirmation("")
    setBusy(false)
  }

  const handleOpenDialog = () => {
    if (busy) return
    setStep("request")
  }

  const handleSendOtp = async () => {
    setBusy(true)
    try {
      await apiRequest("/user/me/delete/request-otp", {
        method: "POST",
        auth: true,
      })
      toast({
        title: "Code sent",
        description: `We sent a 4-digit code to ${email}. It expires in 10 minutes.`,
      })
      setStep("confirm")
    } catch (err) {
      toast({
        title: "Couldn't send code",
        description:
          err instanceof Error ? err.message : "Please try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const handleConfirmDelete = async () => {
    setBusy(true)
    try {
      await apiRequest("/user/me/delete/confirm", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ otp, confirmation }),
      })
      // Backend already cleared cookies. Tear down local state on this
      // tab + sibling tabs, then bounce home so the now-deleted user
      // doesn't sit on an authed page.
      try {
        await logout()
      } catch {
        // logout's /auth/logout call may 401 because cookies are gone —
        // safe to ignore, providers.logout still clears local state.
      }
      router.push("/")
    } catch (err) {
      toast({
        title: "Deletion failed",
        description:
          err instanceof Error
            ? err.message
            : "Check the code and try again.",
        variant: "destructive",
      })
      setBusy(false)
    }
  }

  const canConfirm = /^\d{4}$/.test(otp) && confirmation === "DELETE" && !busy

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
        description="Permanently delete your account and all associated tickets and history. An admin can recover within 24 hours; after that everything is irrecoverable."
        actionLabel="Request deletion"
        onAction={handleOpenDialog}
        disabled={busy}
      />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetDialog()
        }}
      >
        <DialogContent>
          {step === "request" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm account deletion</DialogTitle>
                <DialogDescription>
                  We&apos;ll email a 4-digit confirmation code to{" "}
                  <span className="font-medium text-slate-900">{email}</span>.
                  After you enter the code and type DELETE, your account is
                  scheduled for permanent removal in 24 hours.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={resetDialog} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleSendOtp} disabled={busy}>
                  {busy ? "Sending..." : "Send code"}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Enter confirmation code</DialogTitle>
                <DialogDescription>
                  Check your inbox for the 4-digit code. Then type{" "}
                  <span className="font-mono font-semibold text-rose-600">
                    DELETE
                  </span>{" "}
                  below to confirm.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    4-digit code
                  </span>
                  <Input
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="0000"
                    className="mt-1 text-center text-lg tracking-[0.4em]"
                    disabled={busy}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700">
                    Type <span className="font-mono">DELETE</span> to confirm
                  </span>
                  <Input
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="mt-1"
                    disabled={busy}
                  />
                </label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetDialog} disabled={busy}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={!canConfirm}
                >
                  {busy ? "Deleting..." : "Delete my account"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
