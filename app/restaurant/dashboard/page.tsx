'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function RestaurantDashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [restName, setRestName] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('restaurant_profiles').select('restaurant_name').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setRestName(data?.restaurant_name ?? null))
  }, [session?.user?.id])

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Restaurant dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" onClick={async () => { await supabase.auth.signOut(); router.push('/') }}>Logout</button>
        </div>
        <div className="dashboard-body">
          <div><p>Restaurant</p><strong>{restName ?? '—'}</strong></div>
          <div><p>Menu items</p><strong>0</strong></div>
        </div>
        <div className="dashboard-actions">
          <button className="btn btn-solid">Upload menu</button>
          <button className="btn btn-light">View listings</button>
        </div>
      </div>
    </div>
  )
}