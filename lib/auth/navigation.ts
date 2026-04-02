import type { AppRole, UserRoleRecord } from "@/app/providers"
import type { SafeUser } from "@/types/api"

export function resolveUserHome(params: {
  user: SafeUser | null
  activeRole: AppRole
  organizerVerificationStatus: string | null
  userRoles?: UserRoleRecord[]
}) {
  const { user, activeRole, organizerVerificationStatus, userRoles = [] } = params

  if (!user) return "/"
  if (user.role === "ADMIN") return "/admin/dashboard"

  const userReady = user.onboardingStatus === "COMPLETED"

  if (user.role === "ORGANIZER" && !userReady) {
    return "/organizer/onboarding"
  }

  if (user.role === "ORGANIZER" && activeRole === "EVENT_ORGANIZER") {
    if (!userReady) return "/organizer/onboarding"
    if (organizerVerificationStatus === "EMAIL_NOT_VERIFIED") return "/organizer/email-verification"
    if (organizerVerificationStatus !== "APPROVED") return "/organizer/pending"
    return "/organizer/dashboard"
  }

  const hasTalentRole = userRoles.some((record) => record.role === "TALENT")
  if (activeRole === "TALENT" && hasTalentRole) {
    return "/talent/dashboard"
  }

  if (!userReady) {
    return "/onboarding"
  }

  return "/dashboard"
}
