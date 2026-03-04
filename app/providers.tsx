'use client'

import {
  createContext, useContext, useEffect, useMemo,
  useState, useCallback,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AppRole } from '@/lib/roles'

export type UserRoleRecord = {
  id: string
  role: AppRole
  onboarding_completed: boolean
  updated_at: string
}

export type Profile = {
  email: string | null
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  dob: string | null
  location: string | null
  global_onboarding_completed: boolean
}

type RoleRow = {
  id: string
  onboarding_completed: boolean
  updated_at: string
  roles: { name: AppRole } | null
}

type AuthCtx = {
  session: Session | null
  isLoading: boolean
  profile: Profile | null
  isLoadingProfile: boolean
  userRoles: UserRoleRecord[]
  isLoadingRoles: boolean
  activeRole: AppRole
  switchRole: (role: AppRole) => Promise<void>
  refreshProfile: () => Promise<void>
  refreshRoles: () => Promise<void>
  updateProfile: (payload: Partial<Profile>) => Promise<void>
  completeRoleOnboarding: (role: AppRole) => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside <Providers>')
  return ctx
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [session,          setSession]          = useState<Session | null>(null)
  const [isLoading,        setIsLoading]        = useState(true)
  const [profile,          setProfile]          = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [userRoles,        setUserRoles]        = useState<UserRoleRecord[]>([])
  const [isLoadingRoles,   setIsLoadingRoles]   = useState(false)

  const loadProfile = useCallback(async (userId: string) => {
    setIsLoadingProfile(true)
    const { data } = await supabase
      .from('profiles')
      .select('email,full_name,phone,avatar_url,dob,location,global_onboarding_completed')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data ?? null)
    setIsLoadingProfile(false)
  }, [])

  const loadRoles = useCallback(async (userId: string) => {
    setIsLoadingRoles(true)
    const { data } = await supabase
      .from('user_roles')
      .select('id, onboarding_completed, updated_at, roles(name)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    const mapped: UserRoleRecord[] = (data as RoleRow[] | null ?? []).map(row => ({
      id:                   row.id,
      role:                 row.roles?.name ?? 'USER',
      onboarding_completed: row.onboarding_completed,
      updated_at:           row.updated_at,
    }))
    setUserRoles(mapped)
    setIsLoadingRoles(false)
  }, [])

  useEffect(() => {
    let mounted = true

    const handleSession = async (nextSession: Session | null) => {
      if (!mounted) return
      setSession(nextSession)
      setIsLoading(false)
      if (!nextSession?.user?.id) { setProfile(null); setUserRoles([]); return }
      await Promise.all([
        loadProfile(nextSession.user.id),
        loadRoles(nextSession.user.id),
      ])
    }

    supabase.auth.getSession()
      .then(({ data }) => handleSession(data.session))
      .catch(() => { if (mounted) setIsLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      void handleSession(s)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [loadProfile, loadRoles])

  const switchRole = useCallback(async (role: AppRole) => {
    const userId = session?.user?.id
    if (!userId) return

    // Optimistic update
    setUserRoles(prev => {
      const now = new Date().toISOString()
      const existing = prev.find(r => r.role === role)
      if (existing) {
        return [{ ...existing, updated_at: now }, ...prev.filter(r => r.role !== role)]
      }
      return [{ id: 'pending', role, onboarding_completed: false, updated_at: now }, ...prev]
    })

    const { data: roleRow } = await supabase
      .from('roles').select('id').eq('name', role).maybeSingle()
    if (!roleRow?.id) return

    const { data: existing } = await supabase
      .from('user_roles').select('id')
      .eq('user_id', userId).eq('role_id', roleRow.id).maybeSingle()

    if (existing?.id) {
      await supabase.from('user_roles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('user_roles').insert({
        user_id: userId, role_id: roleRow.id, onboarding_completed: false,
      })
    }

    await loadRoles(userId)
  }, [session?.user?.id, loadRoles])

  const activeRole: AppRole = userRoles[0]?.role ?? 'USER'

  const value = useMemo<AuthCtx>(() => ({
    session, isLoading,
    profile, isLoadingProfile,
    userRoles, isLoadingRoles,
    activeRole, switchRole,
    refreshProfile: async () => {
      if (!session?.user?.id) return
      await loadProfile(session.user.id)
    },
    refreshRoles: async () => {
      if (!session?.user?.id) return
      await loadRoles(session.user.id)
    },
    updateProfile: async payload => {
      if (!session?.user?.id) return
      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', session.user.id)
      if (error) throw new Error(error.message)
      await loadProfile(session.user.id)
    },
    completeRoleOnboarding: async role => {
      if (!session?.user?.id) return
      const { data: roleRow } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .maybeSingle()
      if (!roleRow?.id) throw new Error('Role not found.')
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('role_id', roleRow.id)
        .maybeSingle()
      if (!userRole?.id) throw new Error('User role not found.')
      const { error } = await supabase
        .from('user_roles')
        .update({ onboarding_completed: true })
        .eq('id', userRole.id)
      if (error) throw new Error(error.message)
      await loadRoles(session.user.id)
    },
  }), [session, isLoading, profile, isLoadingProfile, userRoles, isLoadingRoles,
      activeRole, switchRole, loadProfile, loadRoles])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
