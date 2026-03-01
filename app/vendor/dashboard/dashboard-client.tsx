'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function VendorDashboardClient() {
  const { session } = useAuth()
  const router = useRouter()
  const [vendorProfile, setVendorProfile] = useState<{
    business_name: string | null
    category: string | null
    address: string | null
  } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    let isMounted = true

    const loadVendorProfile = async () => {
      const { data } = await supabase
        .from('vendor_profiles')
        .select('business_name,category,address')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!isMounted) return
      setVendorProfile(data ?? null)
    }

    loadVendorProfile()

    return () => {
      isMounted = false
    }
  }, [session?.user?.id])

  const displayName = useMemo(
    () => vendorProfile?.business_name ?? session?.user?.email ?? 'Vendor',
    [vendorProfile?.business_name, session?.user?.email]
  )
  const displayCategory = useMemo(() => vendorProfile?.category ?? 'Unspecified', [vendorProfile?.category])
  const displayCity = useMemo(() => vendorProfile?.address ?? 'Unspecified', [vendorProfile?.address])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Vendor dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="dashboard-body">
          <p>Vendor</p>
          <strong>{displayName}</strong>
          <p>Category</p>
          <strong>{displayCategory}</strong>
          <p>Address</p>
          <strong>{displayCity}</strong>
        </div>
        <div className="dashboard-actions">
          <button className="btn" type="button">Upload products</button>
          <button className="btn btn-light" type="button">View listings</button>
        </div>
      </div>
    </div>
  )
}
