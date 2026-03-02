'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

type RoleRow = {
  id: string
  roles: { name: string } | null
}

export default function RestaurantOnboardingPage() {
  const router = useRouter()
  const { session, refreshRoles } = useAuth()
  const [name,     setName]     = useState('')
  const [cuisine,  setCuisine]  = useState('')
  const [desc,     setDesc]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [address,  setAddress]  = useState('')
  const [hours,    setHours]    = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleComplete = async () => {
    const userId = session?.user?.id
    if (!userId) { setError('Session expired.'); return }
    setLoading(true); setError(null)

    let logoUrl: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop() ?? 'png'
      const path = `${userId}/logo-${Date.now()}.${ext}`
      const { error: e } = await supabase.storage.from('restaurant_logos').upload(path, logoFile, { upsert: true })
      if (e) { setError('Logo upload failed.'); setLoading(false); return }
      logoUrl = supabase.storage.from('restaurant_logos').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      user_id: userId,
      restaurant_name: name.trim() || null,
      cuisine_type: cuisine.trim() || null,
      description: desc.trim() || null,
      contact_phone: phone.trim() || null,
      address: address.trim() || null,
      opening_hours: hours.trim() || null,
      logo_url: logoUrl,
    }

    const { data: existing } = await supabase.from('restaurant_profiles').select('id').eq('user_id', userId).maybeSingle()
    const { error: profileErr } = existing?.id
      ? await supabase.from('restaurant_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('restaurant_profiles').insert(payload)

    if (profileErr) { setError('Could not save profile.'); setLoading(false); return }

    const { data: roleRows } = await supabase.from('user_roles').select('id, roles(name)').eq('user_id', userId)
    const row = ((roleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'RESTAURANT')
    if (row) await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', row.id)

    await refreshRoles()
    router.replace('/restaurant/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Restaurant setup</p>
          <h2>Set up your restaurant profile</h2>
        </div>
        <div className="auth-form">
          <label>Restaurant name<input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Cuisine type<input className="input" placeholder="e.g. Indian, Italian" value={cuisine} onChange={e => setCuisine(e.target.value)} /></label>
          <label>Description<input className="input" placeholder="Short description" value={desc} onChange={e => setDesc(e.target.value)} /></label>
          <label>Contact phone<input className="input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label>Address<input className="input" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} /></label>
          <label>Opening hours<input className="input" placeholder="e.g. 9am–10pm" value={hours} onChange={e => setHours(e.target.value)} /></label>
          <label>Logo (optional)<input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} /></label>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="auth-actions">
          <button className="btn btn-solid" onClick={handleComplete} disabled={loading}>
            {loading ? 'Saving…' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
