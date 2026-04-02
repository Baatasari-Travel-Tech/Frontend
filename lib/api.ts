import { getAdminToken } from "@/lib/admin/session"

export const API_URL = process.env.NEXT_PUBLIC_API_URL!

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAdminToken()
  const headers = new Headers(options.headers)

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(`${API_URL}${url}`, {
    ...options,
    headers
  })
}
