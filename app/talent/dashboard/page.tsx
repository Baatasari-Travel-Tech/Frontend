'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function TalentDashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [stageName, setStageName] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('talent_profiles').select('stage_name').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setStageName(data?.stage_name ?? null))
  }, [session?.user?.id])

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Talent dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Logout</button>
        </div>
        <div className="dashboard-body">
          <div><p>Stage name</p><strong>{stageName ?? '—'}</strong></div>
          <div><p>Bookings</p><strong>0</strong></div>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-solid">View opportunities</button>
          <button className="btn btn-light">Edit profile</button>
        </div>
      </div>
    </div>
  )
}