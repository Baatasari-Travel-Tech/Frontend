import { apiFetch } from "@/lib/api"
import type {
  AdminDashboardResponse,
  AdminOrganizerDetailsResponse,
  AdminPendingOrganizerUser,
  AdminLoginPayload,
  AdminUserListResponse,
  AdminVerifyPayload,
  ApiErrorPayload,
  BackendRole,
  SafeUser,
} from "@/types/api"

type ApiEnvelope<T> = {
  success: boolean
  data: T
  code?: string
  message?: string
}

export type AdminRequestError = Error &
  ApiErrorPayload & {
    status?: number
  }

const parseBody = async <T>(response: Response): Promise<ApiEnvelope<T> | null> => {
  try {
    return (await response.json()) as ApiEnvelope<T>
  } catch {
    return null
  }
}

const requestAdmin = async <T>(path: string, options: RequestInit = {}) => {
  const response = await apiFetch(path, options)
  const payload = await parseBody<T>(response)

  if (!response.ok || !payload?.success) {
    const fallback: ApiErrorPayload = {
      code: payload?.code ?? "INTERNAL_SERVER_ERROR",
      message: payload?.message ?? "Request failed",
    }
    const error = new Error(fallback.message) as AdminRequestError
    error.code = fallback.code
    error.status = response.status
    throw error
  }

  return payload.data
}

export const isAdminAuthFailure = (error: unknown) => {
  const requestError = error as Partial<AdminRequestError> | null
  if (!requestError) return false

  return (
    requestError.status === 401 ||
    requestError.status === 403 ||
    requestError.code === "TOKEN_INVALID" ||
    requestError.code === "FORBIDDEN"
  )
}

export const adminLogin = (payload: AdminLoginPayload) => {
  return requestAdmin<{ success: boolean }>("/api/v1/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export const adminVerifyOtp = (payload: AdminVerifyPayload) => {
  return requestAdmin<{ token: string }>("/api/v1/admin/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export const getAdminDashboard = () => {
  return requestAdmin<AdminDashboardResponse>("/api/v1/admin/dashboard")
}

export const listAdminUsers = (params: { page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  })

  return requestAdmin<AdminUserListResponse>(`/api/v1/admin/users?${query.toString()}`)
}

export const listPendingOrganizers = () => {
  return requestAdmin<AdminPendingOrganizerUser[]>("/api/v1/admin/organizers/pending")
}

export const getAdminOrganizerDetails = (id: string) => {
  return requestAdmin<AdminOrganizerDetailsResponse>(`/api/v1/admin/organizers/${id}`)
}

export const approveOrganizer = (id: string) => {
  return requestAdmin<SafeUser>(`/api/v1/admin/organizers/${id}/approve`, {
    method: "PATCH",
  })
}

export const updateAdminUserRole = (id: string, role: BackendRole) => {
  return requestAdmin<SafeUser>(`/api/v1/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })
}

export const deleteAdminUser = (id: string) => {
  return requestAdmin<SafeUser>(`/api/v1/admin/users/${id}`, {
    method: "DELETE",
  })
}
