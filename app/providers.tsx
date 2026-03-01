'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextValue = {
  session: Session | null
  isLoading: boolean
  profile: ProfileRecord | null
  isLoadingProfile: boolean
  profileError: string | null
  activeRole: string | null
  userRoleId: string | null
  roleOnboardingCompleted: boolean | null
  isLoadingRole: boolean
  roleError: string | null
}

type ProfileRecord = {
  email: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  global_onboarding_completed: boolean | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within Providers')
  }
  return context
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<string | null>(null)
  const [userRoleId, setUserRoleId] = useState<string | null>(null)
  const [roleOnboardingCompleted, setRoleOnboardingCompleted] = useState<boolean | null>(null)
  const [isLoadingRole, setIsLoadingRole] = useState(false)
  const [roleError, setRoleError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session)
        setIsLoading(false)
        if (!data.session) {
          setProfile(null)
          setIsLoadingProfile(false)
          setProfileError(null)
          setActiveRole(null)
          setUserRoleId(null)
          setRoleOnboardingCompleted(null)
          setIsLoadingRole(false)
          setRoleError(null)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      setSession(nextSession)
      if (!nextSession) {
        setProfile(null)
        setIsLoadingProfile(false)
        setProfileError(null)
        setActiveRole(null)
        setUserRoleId(null)
        setRoleOnboardingCompleted(null)
        setIsLoadingRole(false)
        setRoleError(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    let isMounted = true

    const loadProfile = async () => {
      setIsLoadingProfile(true)
      setProfileError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('email,full_name,phone,avatar_url,global_onboarding_completed')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setProfile(null)
        setProfileError('Unable to load your profile. Please try again.')
        setIsLoadingProfile(false)
        return
      }

      setProfile(data ?? null)
      setIsLoadingProfile(false)
    }

    const loadRole = async () => {
      setIsLoadingRole(true)
      setRoleError(null)

      const { data, error } = await supabase
        .from('user_roles')
        .select('id,role_id,onboarding_completed,roles(name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!isMounted) return

      if (error) {
        setActiveRole(null)
        setUserRoleId(null)
        setRoleOnboardingCompleted(null)
        setRoleError('Unable to load your role. Please try again.')
        setIsLoadingRole(false)
        return
      }

      const roleName = (data?.roles as { name?: string } | null)?.name ?? null
      setActiveRole(roleName)
      setUserRoleId(data?.id ?? null)
      setRoleOnboardingCompleted(data?.onboarding_completed ?? null)
      setIsLoadingRole(false)
    }

    loadProfile()
    loadRole()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const value = useMemo(
    () => ({
      session,
      isLoading,
      profile,
      isLoadingProfile,
      profileError,
      activeRole,
      userRoleId,
      roleOnboardingCompleted,
      isLoadingRole,
      roleError,
    }),
    [
      session,
      isLoading,
      profile,
      isLoadingProfile,
      profileError,
      activeRole,
      userRoleId,
      roleOnboardingCompleted,
      isLoadingRole,
      roleError,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
