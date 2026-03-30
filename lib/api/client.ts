"use client"

import { useAuthStore } from "@/lib/auth/store"
import { ApiError, type ActiveRole, type ApiErrorPayload } from "@/types/api"

const API_PREFIX = "/api/v1"

const withPrefix = (path: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${base}${API_PREFIX}${normalized}`
}

let refreshPromise: Promise<string | null> | null = null

const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login"
  }
}

const tryParseJson = async (response: Response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(withPrefix("/auth/refresh"), {
      method: "POST",
      credentials: "include"
    })
      .then(async (response) => {
        const payload = (await tryParseJson(response)) as { accessToken?: string } | null
        if (!response.ok || !payload?.accessToken) {
          useAuthStore.getState().clearSession()
          redirectToLogin()
          return null
        }

        useAuthStore.getState().setAccessToken(payload.accessToken)
        return payload.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

type RequestOptions = RequestInit & {
  auth?: boolean
  retryOn401?: boolean
  activeRole?: ActiveRole | null
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = false, retryOn401 = auth, activeRole, headers, ...init } = options
  const token = useAuthStore.getState().accessToken
  const roleHeader = activeRole ?? useAuthStore.getState().activeRole
  const finalHeaders = new Headers(headers)

  if (!finalHeaders.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json")
  }

  if (auth && token) {
    finalHeaders.set("Authorization", `Bearer ${token}`)
  }

  if (roleHeader) {
    finalHeaders.set("x-active-role", roleHeader)
  }

  const makeRequest = async (accessToken?: string | null) => {
    const requestHeaders = new Headers(finalHeaders)
    if (auth && accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`)
    }

    return fetch(withPrefix(path), {
      ...init,
      headers: requestHeaders,
      credentials: "include"
    })
  }

  let response = await makeRequest(token)

  if (response.status === 401 && retryOn401) {
    const freshToken = await refreshAccessToken()
    if (!freshToken) {
      throw new ApiError(401, {
        code: "TOKEN_INVALID",
        message: "Session expired. Please log in again."
      })
    }
    response = await makeRequest(freshToken)
  }

  const payload = await tryParseJson(response)
  if (!response.ok) {
    throw new ApiError(
      response.status,
      (payload as ApiErrorPayload | null) ?? {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected request failure."
      }
    )
  }

  return payload as T
}
