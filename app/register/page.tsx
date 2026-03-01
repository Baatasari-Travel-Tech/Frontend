'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { fromDbRoleName, getRoleOnboarding, ROLE_LABELS, toDbRoleName } from '@/lib/roles'
import { useAuth } from '@/app/providers'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'user' | 'organizer' | 'vendor' | 'restaurant'>('user')
  const router = useRouter()
  const { session, activeRole, isLoadingRole } = useAuth()

  useEffect(() => {
    if (!session?.user || isLoadingRole) return
    const resolvedRole = fromDbRoleName(activeRole)
    if (!resolvedRole) return
    router.replace(getRoleOnboarding(resolvedRole))
  }, [session?.user, activeRole, isLoadingRole, router])

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      return
    }

    if (!data.user?.id) {
      router.replace('/')
      return
    }

    const dbRoleName = toDbRoleName(role)
    const { data: roleRow, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', dbRoleName)
      .maybeSingle()

    if (roleError || !roleRow?.id) {
      alert('Unable to assign role. Please try again.')
      return
    }

    const { error: userRoleError } = await supabase.from('user_roles').upsert(
      {
        user_id: data.user.id,
        role_id: roleRow.id,
        onboarding_completed: false,
      },
      { onConflict: 'user_id,role_id' }
    )

    if (userRoleError) {
      alert('Role assignment failed. Please try again.')
      return
    }

    router.replace(getRoleOnboarding(role))
  }

  const googlelogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `https://baatasari.com/auth/callback?role=${role}`,
      },
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Start in minutes</p>
          <h2>Create your Baatasari account</h2>
        </div>

        <div className="auth-form">
          <label>
            Role
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
            >
              <option value="user">{ROLE_LABELS.user}</option>
              <option value="organizer">{ROLE_LABELS.organizer}</option>
              <option value="vendor">{ROLE_LABELS.vendor}</option>
              <option value="restaurant">{ROLE_LABELS.restaurant}</option>
            </select>
          </label>

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
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>

        <div className="auth-actions">
          <button className="btn" onClick={handleRegister}>Create account</button>
          <button className="btn btn-ghost" onClick={googlelogin}>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
