'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { fromDbRoleName, getRoleHome, getRoleOnboarding } from '@/lib/roles'
import { useAuth } from '@/app/providers'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { session, activeRole, roleOnboardingCompleted, isLoadingRole, profile, isLoadingProfile } = useAuth()

  useEffect(() => {
    if (!session?.user || isLoadingRole || isLoadingProfile) return
    const role = fromDbRoleName(activeRole)
    if (!role) {
      router.replace('/register')
      return
    }
    const onboardingDone =
      role === 'user' ? profile?.global_onboarding_completed === true : roleOnboardingCompleted
    const target = onboardingDone ? getRoleHome(role) : getRoleOnboarding(role)
    router.replace(target)
  }, [
    session?.user,
    activeRole,
    roleOnboardingCompleted,
    isLoadingRole,
    isLoadingProfile,
    profile?.global_onboarding_completed,
    router,
  ])

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      router.replace('/')
      return
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('onboarding_completed,roles(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!roleData) {
      router.replace('/register')
      return
    }

    const roleName = (roleData?.roles as { name?: string } | null)?.name ?? null
    const role = fromDbRoleName(roleName) ?? 'user'
    let onboardingDone = roleData?.onboarding_completed === true

    if (role === 'user') {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('global_onboarding_completed')
        .eq('id', userId)
        .maybeSingle()
      onboardingDone = profileData?.global_onboarding_completed === true
    }

    const destination = onboardingDone ? getRoleHome(role) : getRoleOnboarding(role)
    router.replace(destination)
  }

  const googlelogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://baatasari.com/auth/callback',
      },
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Login to Baatasari</h2>
        </div>

        <div className="auth-form">
          <label>
            Email
            <input
              className="input"
              placeholder="you@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="input"
              placeholder="********"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>

        <div className="auth-actions">
          <button className="btn" onClick={handleLogin}>Login</button>
          <button className="btn btn-ghost" onClick={googlelogin}>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
