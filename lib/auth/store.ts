"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
  ActiveRole,
  LegacyProfile,
  OrganizerProfile,
  SafeUser,
  SimplePreferences,
  TalentProfile,
} from "@/types/api"

type AuthStore = {
  bootstrapping: boolean
  accessToken: string | null
  user: SafeUser | null
  activeRole: ActiveRole
  profile: LegacyProfile | null
  organizerProfile: OrganizerProfile | null
  preferences: SimplePreferences | null
  talentProfile: TalentProfile | null
  setBootstrapping: (value: boolean) => void
  setAccessToken: (token: string | null) => void
  setUser: (user: SafeUser | null) => void
  setActiveRole: (role: ActiveRole) => void
  setProfile: (profile: LegacyProfile | null) => void
  setOrganizerProfile: (profile: OrganizerProfile | null) => void
  setPreferences: (preferences: SimplePreferences | null) => void
  setTalentProfile: (profile: TalentProfile | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      bootstrapping: true,
      accessToken: null,
      user: null,
      activeRole: "USER",
      profile: null,
      organizerProfile: null,
      preferences: null,
      talentProfile: null,
      setBootstrapping: (value) => set({ bootstrapping: value }),
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      setActiveRole: (role) => set({ activeRole: role }),
      setProfile: (profile) => set({ profile }),
      setOrganizerProfile: (profile) => set({ organizerProfile: profile }),
      setPreferences: (preferences) => set({ preferences }),
      setTalentProfile: (profile) => set({ talentProfile: profile }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          activeRole: "USER",
          profile: null,
          organizerProfile: null,
          preferences: null,
          talentProfile: null,
        }),
    }),
    {
      name: "baatasari-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeRole: state.activeRole,
      }),
    }
  )
)
