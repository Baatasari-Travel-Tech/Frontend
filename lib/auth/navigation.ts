import type { AppRole, UserRoleRecord } from "@/app/providers"
import { ADMIN_ROUTES } from "@/lib/admin/routes"
import type { SafeUser } from "@/types/api"

export function resolveUserHome(params: {
  user: SafeUser | null
  activeRole: AppRole
  organizerVerificationStatus: string | null
  userRoles?: UserRoleRecord[]
}) {
  const { user, activeRole, organizerVerificationStatus, userRoles = [] } = params

  if (!user) return "/"
  if (user.role === "ADMIN") return ADMIN_ROUTES.dashboard

  const userReady = user.onboardingStatus === "COMPLETED"

  if (user.role === "ORGANIZER" && !userReady) {
    return "/organizer/onboarding"
  }

  if (user.role === "ORGANIZER" && activeRole === "EVENT_ORGANIZER") {
    if (!userReady) return "/organizer/onboarding"
    if (organizerVerificationStatus === "EMAIL_NOT_VERIFIED") return "/organizer/email-verification"
    if (organizerVerificationStatus === "DOCUMENTS_REQUIRED") return "/organizer/document-upload"
    if (organizerVerificationStatus !== "APPROVED") return "/organizer/pending"
    return "/organizer/dashboard"
  }

  if (user.role === "ORGANIZER" && userReady && organizerVerificationStatus === "EMAIL_NOT_VERIFIED") {
    return "/organizer/email-verification"
  }

  if (user.role === "ORGANIZER" && userReady && organizerVerificationStatus === "DOCUMENTS_REQUIRED") {
    return "/organizer/document-upload"
  }

  if (user.role === "ORGANIZER" && userReady && organizerVerificationStatus !== "APPROVED") {
    return "/organizer/pending"
  }

  const hasTalentRole = userRoles.some((record) => record.role === "TALENT")
  if (activeRole === "TALENT" && hasTalentRole) {
    return "/talent/dashboard"
  }

  if (!userReady) {
    return "/onboarding"
  }

  return "/events"
}
