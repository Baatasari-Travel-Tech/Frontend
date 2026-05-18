import { apiRequest } from "@/lib/api/client"
import { getAdminToken } from "@/lib/admin/session"
import type {
  AdminDashboardResponse,
  AdminOrganizerDetailsResponse,
  AdminUserDetailsResponse,
  AdminPendingOrganizerUser,
  AdminLoginPayload,
  AdminUserListResponse,
  AdminVerifyPayload,
  ApiEnvelope,
  ApiError,
  ApiErrorPayload,
  BackendRole,
  GstinVerifyResult,
  OrganizerProfile,
  PanVerifyResult,
  SafeUser,
  SiteConfig,
  UserProfile,
} from "@/types/api"

// Admin auth is Bearer-token, not refresh-cookie. We funnel every admin
// call through the same `apiRequest` used by the rest of the app — only
// difference is `bearerToken: getAdminToken` and the response envelope
// gets unwrapped to `.data` for ergonomics. There is no auto-refresh on
// 401: admin tokens are short-lived (1d) and re-login is required.

export type AdminRequestError = Error &
  ApiErrorPayload & {
    status?: number
  }

const requestAdmin = async <T>(
  path: string,
  options: Omit<Parameters<typeof apiRequest>[1], "bearerToken" | "auth"> = {},
): Promise<T> => {
  try {
    const envelope = await apiRequest<ApiEnvelope<T>>(path, {
      ...options,
      bearerToken: getAdminToken,
    })
    return envelope.data
  } catch (err) {
    // Re-shape `ApiError` (thrown by apiRequest) into the historical
    // AdminRequestError shape that admin callers already handle.
    const apiErr = err as Partial<ApiError> & { payload?: ApiErrorPayload }
    const code = apiErr?.payload?.code ?? "INTERNAL_SERVER_ERROR"
    const message = apiErr?.payload?.message ?? (err instanceof Error ? err.message : "Request failed")
    const error = new Error(message) as AdminRequestError
    error.code = code
    error.status = apiErr?.status
    throw error
  }
}

// Binary fetch (used for streaming organizer documents). Goes around the
// JSON-envelope layer entirely; same bearer + base URL as the JSON path.
export const fetchAdminBlob = async (path: string): Promise<Blob | null> => {
  const token = getAdminToken()
  if (!token) return null
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
  const normalized = path.startsWith("/") ? path : `/${path}`
  const response = await fetch(`${base}/api/v1${normalized}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) return null
  return response.blob()
}

export const isAdminAuthFailure = (error: unknown): boolean => {
  const requestError = error as Partial<AdminRequestError> | null
  if (!requestError) return false

  return (
    requestError.status === 401 ||
    requestError.status === 403 ||
    requestError.code === "TOKEN_INVALID" ||
    requestError.code === "FORBIDDEN"
  )
}

export const adminLogin = (payload: AdminLoginPayload) =>
  requestAdmin<{ success: boolean }>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const adminVerifyOtp = (payload: AdminVerifyPayload) =>
  requestAdmin<{ token: string }>("/admin/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const getAdminDashboard = () =>
  requestAdmin<AdminDashboardResponse>("/admin/dashboard")

export const listAdminUsers = (params: { page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  })
  return requestAdmin<AdminUserListResponse>(`/admin/users?${query.toString()}`)
}

export const listPendingOrganizers = () =>
  requestAdmin<AdminPendingOrganizerUser[]>("/admin/organizers/pending")

export const getAdminOrganizerDetails = (id: string) =>
  requestAdmin<AdminOrganizerDetailsResponse>(`/admin/organizers/${id}`)

export const approveOrganizer = (id: string) =>
  requestAdmin<SafeUser>(`/admin/organizers/${id}/approve`, {
    method: "PATCH",
  })

export const updateAdminUserRole = (id: string, role: BackendRole) =>
  requestAdmin<SafeUser>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })

export const deleteAdminUser = (id: string) =>
  requestAdmin<SafeUser>(`/admin/users/${id}`, {
    method: "DELETE",
  })

export const updateAdminUser = (
  id: string,
  payload: Partial<Pick<SafeUser, "role" | "onboardingStatus" | "organizerApproved">>,
) =>
  requestAdmin<SafeUser>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

export const getAdminUserDetails = (id: string) =>
  requestAdmin<AdminUserDetailsResponse>(`/admin/users/${id}`)

export const updateAdminUserProfile = (
  id: string,
  payload: Partial<Pick<UserProfile, "fullName" | "phone" | "dob" | "location" | "gender" | "profession">>,
) =>
  requestAdmin<UserProfile>(`/admin/users/${id}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

export const updateAdminOrganizerProfile = (
  id: string,
  payload: Partial<Pick<OrganizerProfile,
    | "orgName" | "contactEmail" | "contactPhone"
    | "address" | "city" | "state" | "pincode"
    | "panNumber" | "gstNumber"
    | "bankAccountName" | "bankAccountNumber" | "bankIfsc"
    | "websiteUrl" | "instagramUrl" | "linkedinUrl"
    | "primaryContactName" | "secondaryContactPhone"
    | "description"
  >>,
) =>
  requestAdmin<OrganizerProfile>(`/admin/organizers/${id}/profile`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

export const verifyAdminOrganizerGstin = (id: string, gstin: string) =>
  requestAdmin<GstinVerifyResult>(`/admin/organizers/${id}/verify/gstin`, {
    method: "POST",
    body: JSON.stringify({ gstin }),
  })

export const verifyAdminOrganizerPan = (id: string, pan: string) =>
  requestAdmin<PanVerifyResult>(`/admin/organizers/${id}/verify/pan`, {
    method: "POST",
    body: JSON.stringify({ pan }),
  })

const DEFAULT_SITE_CONFIG: SiteConfig = {
  instagram: "#",
  linkedin: "#",
  twitter: "#",
  contactEmail: "contact-us@baatasari.com",
}

// Public site config doesn't require admin auth. Uses the unified client
// with no bearer token; falls back to defaults on any error so the public
// pages always have something to render.
export const fetchPublicSiteConfig = async (): Promise<SiteConfig> => {
  try {
    const envelope = await apiRequest<ApiEnvelope<SiteConfig>>("/admin/site-config")
    return envelope.data ?? { ...DEFAULT_SITE_CONFIG }
  } catch {
    return { ...DEFAULT_SITE_CONFIG }
  }
}

export const getAdminSiteConfig = () =>
  requestAdmin<SiteConfig>("/admin/site-config")

export const updateAdminSiteConfig = (payload: Partial<SiteConfig>) =>
  requestAdmin<SiteConfig>("/admin/site-config", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
