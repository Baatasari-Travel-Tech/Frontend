'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function OrganizerDashboardClient() {
  const { session } = useAuth()
  const router = useRouter()
  const [organizerProfile, setOrganizerProfile] = useState<{
    org_name: string | null
    city: string | null
    contact_phone: string | null
  } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    let isMounted = true

    const loadOrganizerProfile = async () => {
      const { data } = await supabase
        .from('event_organizer_profiles')
        .select('org_name,city,contact_phone')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!isMounted) return
      setOrganizerProfile(data ?? null)
    }

    loadOrganizerProfile()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const displayName = useMemo(
    () => organizerProfile?.org_name ?? session?.user?.email ?? 'Organizer',
    [organizerProfile?.org_name, session?.user?.email]
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Organizer dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-body">
          <p>Organizer</p>
          <strong>{displayName}</strong>
          <p>Events managed</p>
          <strong>0</strong>
        </div>
        <div className="dashboard-actions">
          <button className="btn" type="button">Create event</button>
          <button className="btn btn-light" type="button">View events</button>
        </div>
      </div>
    </div>
  )
}
