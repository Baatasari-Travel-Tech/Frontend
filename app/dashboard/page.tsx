'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function DashboardPage() {
  const { profile, session } = useAuth()
  const router = useRouter()

  const displayName = profile?.full_name ?? session?.user?.email ?? 'Member'

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
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
        <div className="dashboard-body">
          <div><p>Name</p><strong>{displayName}</strong></div>
          <div><p>Role</p><strong>User</strong></div>
          <div><p>Status</p><strong>Active</strong></div>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-solid">Get a plan</button>
          <button className="btn btn-light">Edit profile</button>
        </div>
      </div>
    </div>
  )
}