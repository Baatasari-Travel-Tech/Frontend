"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/app/providers"
import LoadingScreen from "@/components/loading-screen"

type ProtectedRouteProps = {
  children: React.ReactNode
  requireOnboarding?: boolean
  requireOrganizer?: boolean
  requireAdmin?: boolean
  requireTalentPaid?: boolean
}

export function ProtectedRoute({
  children,
  requireOnboarding = true,
  requireOrganizer = false,
  requireAdmin = false,
  requireTalentPaid = false,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, session, user, activeRole, organizerVerificationStatus, profile, talentProfile } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!session?.user || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    const hasCompletedOnboarding = profile?.global_onboarding_completed === true

    if (requireAdmin) {
      if (user.role !== "ADMIN") {
        router.replace("/403")
      }
      return
    }

    if (requireOrganizer) {
      if (user.role !== "ORGANIZER" || activeRole !== "EVENT_ORGANIZER") {
        router.replace("/403")
        return
      }

      if (!hasCompletedOnboarding) {
        router.replace("/organizer/onboarding")
        return
      }

      if (organizerVerificationStatus === "EMAIL_NOT_VERIFIED") {
        router.replace("/organizer/email-verification")
        return
      }

      if (organizerVerificationStatus !== "APPROVED") {
        router.replace("/organizer/pending")
        return
      }
    } else if (requireOnboarding && !hasCompletedOnboarding) {
      router.replace(user.role === "ORGANIZER" ? "/organizer/onboarding" : "/onboarding")
      return
    }

    if (requireTalentPaid && talentProfile?.paymentStatus !== "PAID") {
      router.replace("/talent/onboarding")
    }
  }, [
    activeRole,
    isLoading,
    organizerVerificationStatus,
    pathname,
    profile?.global_onboarding_completed,
    requireAdmin,
    requireOnboarding,
    requireOrganizer,
    requireTalentPaid,
    router,
    session?.user,
    talentProfile?.paymentStatus,
    user,
  ])

  if (isLoading || !session?.user || !user) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
