"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { apiRequest } from "@/lib/api/client"
import { isAdminRoutePath } from "@/lib/admin/routes"
import { useAuthStore } from "@/lib/auth/store"
import type {
  ActiveRole,
  AuthResponse,
  LegacyProfile,
  OrganizerProfile,
  SafeUser,
  SimplePreferences,
  TalentProfile,
  UserProfile,
} from "@/types/api"

export type AppRole = "USER" | "EVENT_ORGANIZER" | "TALENT"

export type UserRoleRecord = {
  id: string
  role: AppRole
  onboarding_completed: boolean
  updated_at: string
}

type Session = {
  user: {
    id: string
    email: string
  }
}

type AuthCtx = {
  session: Session | null
  user: SafeUser | null
  isLoading: boolean
  profile: LegacyProfile | null
  organizerProfile: OrganizerProfile | null
  talentProfile: TalentProfile | null
  isLoadingProfile: boolean
  organizerVerificationStatus: string | null
  isLoadingOrganizerStatus: boolean
  userPreferences: SimplePreferences | null
  isLoadingPreferences: boolean
  userRoles: UserRoleRecord[]
  isLoadingRoles: boolean
  activeRole: AppRole
  switchRole: (role: AppRole) => Promise<void>
  refreshProfile: () => Promise<void>
  refreshOrganizerStatus: () => Promise<void>
  refreshPreferences: () => Promise<void>
  refreshRoles: () => Promise<void>
  updateProfile: (payload: Record<string, unknown>, options?: { refresh?: boolean }) => Promise<void>
  updateUserPreferences: (payload: Partial<SimplePreferences>) => Promise<void>
  completeRoleOnboarding: (role: AppRole, payload?: Record<string, unknown>) => Promise<void>
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { email: string; password: string; role: "USER" | "ORGANIZER" }) => Promise<void>
  googleAuth: (idToken: string, role?: "USER" | "ORGANIZER") => Promise<void>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

const queryClient = new QueryClient()

const normalizeLegacyProfile = (user: SafeUser | null, profile: UserProfile | null): LegacyProfile | null => {
  if (!user && !profile) return null

  return {
    email: user?.email ?? null,
    full_name: profile?.fullName ?? null,
    phone: profile?.phone ?? null,
    avatar_url: profile?.avatarUrl ?? null,
    dob: profile?.dob ?? null,
    location: profile?.location ?? null,
    global_onboarding_completed: user?.onboardingStatus === "COMPLETED",
  }
}

const getOrganizerVerificationStatus = (user: SafeUser | null) => {
  if (!user || user.role !== "ORGANIZER") return null
  if (!user.emailVerified) return "EMAIL_NOT_VERIFIED"
  if (!user.organizerApproved) return "PENDING"
  return "APPROVED"
}

const userToSession = (user: SafeUser | null): Session | null =>
  user
    ? {
        user: {
          id: user.id,
          email: user.email,
        },
      }
    : null

const mapProfilePayload = (payload: Record<string, unknown>) => ({
  fullName: typeof payload.full_name === "string" ? payload.full_name : payload.fullName,
  phone: typeof payload.phone === "string" ? payload.phone : null,
  avatarUrl: typeof payload.avatar_url === "string" ? payload.avatar_url : payload.avatarUrl,
  dob: typeof payload.dob === "string" ? payload.dob : null,
  location: typeof payload.location === "string" ? payload.location : null,
  organizerDisplayName:
    typeof payload.organizer_display_name === "string"
      ? payload.organizer_display_name
      : payload.organizerDisplayName,
  organizerDescription:
    typeof payload.organizer_description === "string"
      ? payload.organizer_description
      : payload.organizerDescription,
  companyName: typeof payload.company_name === "string" ? payload.company_name : payload.companyName,
  companyWebsite:
    typeof payload.company_website === "string" ? payload.company_website : payload.companyWebsite,
})

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside <Providers>")
  return ctx
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [isLoadingOrganizerStatus, setIsLoadingOrganizerStatus] = useState(false)
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false)
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  const {
    bootstrapping,
    user,
    activeRole,
    profile,
    organizerProfile,
    preferences,
    talentProfile,
    setBootstrapping,
    setAccessToken,
    setUser,
    setActiveRole,
    setProfile,
    setOrganizerProfile,
    setPreferences,
    setTalentProfile,
    clearSession,
  } = useAuthStore()

  const loadProfile = useCallback(async (currentUser: SafeUser | null = useAuthStore.getState().user) => {
    if (!currentUser) {
      setProfile(null)
      return
    }

    setIsLoadingProfile(true)
    try {
      const response = await apiRequest<{ data: { user: SafeUser; profile: UserProfile } }>("/user/profile", {
        auth: true,
      })
      setProfile(normalizeLegacyProfile(response.data.user, response.data.profile))
      setUser(response.data.user)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [setProfile, setUser])

  const loadOrganizerProfile = useCallback(async (currentUser: SafeUser | null = useAuthStore.getState().user) => {
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      setOrganizerProfile(null)
      return
    }

    setIsLoadingOrganizerStatus(true)
    try {
      const response = await apiRequest<{ data: { user: SafeUser; profile: OrganizerProfile } }>("/organizer/profile", {
        auth: true,
      })
      setOrganizerProfile(response.data.profile)
      setUser(response.data.user)
    } finally {
      setIsLoadingOrganizerStatus(false)
    }
  }, [setOrganizerProfile, setUser])

  const loadPreferences = useCallback(async (currentUser: SafeUser | null = useAuthStore.getState().user) => {
    if (!currentUser || currentUser.onboardingStatus !== "COMPLETED") {
      setPreferences(null)
      return
    }

    setIsLoadingPreferences(true)
    try {
      const response = await apiRequest<{ data: { preferences: SimplePreferences } }>("/user/preferences", {
        auth: true,
      })
      setPreferences(response.data.preferences)
    } finally {
      setIsLoadingPreferences(false)
    }
  }, [setPreferences])

  const loadTalentProfile = useCallback(async (currentUser: SafeUser | null = useAuthStore.getState().user) => {
    if (!currentUser || currentUser.onboardingStatus !== "COMPLETED") {
      setTalentProfile(null)
      return
    }

    try {
      const response = await apiRequest<{ data: { profile: TalentProfile } }>("/talent/profile", {
        auth: true,
      })
      setTalentProfile(response.data.profile)
    } catch {
      setTalentProfile(null)
    }
  }, [setTalentProfile])

  const hydrateForUser = useCallback(async (currentUser: SafeUser) => {
    const nextActiveRole: ActiveRole =
      currentUser.role === "ORGANIZER" && useAuthStore.getState().activeRole === "ORGANIZER"
        ? "ORGANIZER"
        : "USER"

    setUser(currentUser)
    setActiveRole(nextActiveRole)

    await Promise.all([
      loadProfile(currentUser),
      loadOrganizerProfile(currentUser),
      loadPreferences(currentUser),
      loadTalentProfile(currentUser),
    ])
  }, [loadOrganizerProfile, loadPreferences, loadProfile, loadTalentProfile, setActiveRole, setUser])

  const bootstrap = useCallback(async () => {
    setBootstrapping(true)
    try {
      const refresh = await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })

      if (!refresh.ok) {
        clearSession()
        return
      }

      const refreshPayload = (await refresh.json()) as { accessToken?: string }
      if (!refreshPayload.accessToken) {
        clearSession()
        return
      }

      setAccessToken(refreshPayload.accessToken)

      const me = await apiRequest<{ user: SafeUser }>("/auth/me", {
        auth: true,
        activeRole: useAuthStore.getState().activeRole,
      })

      await hydrateForUser(me.user)
    } catch {
      clearSession()
    } finally {
      setBootstrapping(false)
    }
  }, [clearSession, hydrateForUser, setAccessToken, setBootstrapping])

  useEffect(() => {
    if (isAdminRoutePath(pathname)) {
      setBootstrapping(false)
      return
    }

    void bootstrap()
  }, [bootstrap, pathname, setBootstrapping])

  const login = async (payload: { email: string; password: string }) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    setAccessToken(response.accessToken)
    await hydrateForUser(response.user)
  }

  const register = async (payload: { email: string; password: string; role: "USER" | "ORGANIZER" }) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    setAccessToken(response.accessToken)
    setActiveRole(payload.role === "ORGANIZER" ? "ORGANIZER" : "USER")
    await hydrateForUser(response.user)
  }

  const logout = async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        auth: true,
      })
    } finally {
      clearSession()
    }
  }

  const googleAuth = async (idToken: string, role: "USER" | "ORGANIZER" = "USER") => {
    const response = await apiRequest<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken, role }),
    })

    setAccessToken(response.accessToken)
    setActiveRole(response.user.role === "ORGANIZER" ? "ORGANIZER" : "USER")
    await hydrateForUser(response.user)
  }

  const switchRole = async (role: AppRole) => {
    if (role === "EVENT_ORGANIZER" && useAuthStore.getState().user?.role === "ORGANIZER") {
      setActiveRole("ORGANIZER")
      return
    }

    setActiveRole("USER")
  }

  const updateProfile = async (payload: Record<string, unknown>) => {
    await apiRequest("/user/profile", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(mapProfilePayload(payload)),
    })

    await loadProfile()
  }

  const updateUserPreferences = async (payload: Partial<SimplePreferences>) => {
    const response = await apiRequest<{ data: { preferences: SimplePreferences } }>("/user/preferences", {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })

    setPreferences(response.data.preferences)
  }

  const completeRoleOnboarding = async (role: AppRole, payload?: Record<string, unknown>) => {
    if (role === "EVENT_ORGANIZER") {
      await apiRequest("/organizer/onboarding/complete", {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload ?? {}),
      })
      await bootstrap()
      return
    }

    await apiRequest("/user/onboarding/complete", {
      method: "POST",
      auth: true,
      body: JSON.stringify(mapProfilePayload(payload ?? {})),
    })

    await bootstrap()
  }

  const userRoles = useMemo<UserRoleRecord[]>(() => {
    if (!user) return []

    const roles: UserRoleRecord[] = [
      {
        id: `${user.id}-user`,
        role: "USER",
        onboarding_completed: user.onboardingStatus === "COMPLETED",
        updated_at: user.updatedAt,
      },
    ]

    if (user.role === "ORGANIZER") {
      roles.push({
        id: `${user.id}-organizer`,
        role: "EVENT_ORGANIZER",
        onboarding_completed: user.onboardingStatus === "COMPLETED",
        updated_at: user.updatedAt,
      })
    }

    if (talentProfile?.paymentStatus === "PAID") {
      roles.push({
        id: `${user.id}-talent`,
        role: "TALENT",
        onboarding_completed: true,
        updated_at: talentProfile.updatedAt ?? user.updatedAt,
      })
    }

    return roles
  }, [talentProfile, user])

  const value: AuthCtx = {
    session: userToSession(user),
    user,
    isLoading: bootstrapping,
    profile,
    organizerProfile,
    talentProfile,
    isLoadingProfile,
    organizerVerificationStatus: getOrganizerVerificationStatus(user),
    isLoadingOrganizerStatus,
    userPreferences: preferences
      ? {
          ...preferences,
          travel: preferences.travel ?? [],
          interests: preferences.interests ?? [],
          food: preferences.food ?? [],
          emotional: preferences.emotional ?? [],
          logistics: preferences.logistics ?? [],
        }
      : null,
    isLoadingPreferences,
    userRoles,
    isLoadingRoles,
    activeRole: activeRole === "ORGANIZER" ? "EVENT_ORGANIZER" : "USER",
    switchRole,
    refreshProfile: () => loadProfile(),
    refreshOrganizerStatus: () => loadOrganizerProfile(),
    refreshPreferences: () => loadPreferences(),
    refreshRoles: async () => {
      setIsLoadingRoles(true)
      try {
        await bootstrap()
      } finally {
        setIsLoadingRoles(false)
      }
    },
    updateProfile,
    updateUserPreferences,
    completeRoleOnboarding,
    login,
    register,
    googleAuth,
    logout,
    bootstrap,
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  )
}
