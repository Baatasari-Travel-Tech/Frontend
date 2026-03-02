'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function OrganizerDashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('event_organizer_profiles').select('org_name').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setOrgName(data?.org_name ?? null))
  }, [session?.user?.id])

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Organizer dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Logout</button>
        </div>
        <div className="dashboard-body">
          <div><p>Organization</p><strong>{orgName ?? '—'}</strong></div>
          <div><p>Events managed</p><strong>0</strong></div>
          <div><p>Status</p><strong>Active</strong></div>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-solid">Create event</button>
          <button className="btn btn-light">View events</button>
        </div>
      </div>
    </div>
  )
}