'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function RestaurantDashboardClient() {
  const { session } = useAuth()
  const router = useRouter()
  const [restaurantProfile, setRestaurantProfile] = useState<{
    restaurant_name: string | null
    cuisine_type: string | null
    address: string | null
  } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    let isMounted = true

    const loadRestaurantProfile = async () => {
      const { data } = await supabase
        .from('restaurant_profiles')
        .select('restaurant_name,cuisine_type,address')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!isMounted) return
      setRestaurantProfile(data ?? null)
    }

    loadRestaurantProfile()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const displayName = useMemo(
    () => restaurantProfile?.restaurant_name ?? session?.user?.email ?? 'Restaurant',
    [restaurantProfile?.restaurant_name, session?.user?.email]
  )
  const cuisine = useMemo(() => restaurantProfile?.cuisine_type ?? 'Unspecified', [restaurantProfile?.cuisine_type])
  const address = useMemo(() => restaurantProfile?.address ?? 'Unspecified', [restaurantProfile?.address])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Restaurant dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-body">
          <p>Restaurant</p>
          <strong>{displayName}</strong>
          <p>Cuisine</p>
          <strong>{cuisine}</strong>
          <p>Address</p>
          <strong>{address}</strong>
        </div>
        <div className="dashboard-actions">
          <button className="btn" type="button">Upload menu</button>
          <button className="btn btn-light" type="button">View listings</button>
        </div>
      </div>
    </div>
  )
}
