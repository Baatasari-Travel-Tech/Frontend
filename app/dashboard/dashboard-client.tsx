'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'
import { fromDbRoleName } from '@/lib/roles'

export default function DashboardClient() {
  const { session, activeRole, profile } = useAuth()
  const router = useRouter()
  const displayName = useMemo(
    () => profile?.full_name ?? session?.user?.email ?? 'Baatasari member',
    [profile?.full_name, session?.user?.email]
  )
  const roleLabel = useMemo(() => {
    const role = fromDbRoleName(activeRole) ?? 'user'
    return role
  }, [activeRole])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-body">
          <p>Logged in as</p>
          <strong>{displayName}</strong>
          <p>Role</p>
          <strong>{roleLabel}</strong>
        </div>
        <div className="dashboard-actions">
          <button className="btn" type="button">Get a plan now</button>
          <button className="btn btn-light" type="button">Update mood</button>
        </div>
      </div>
    </div>
  )
}
