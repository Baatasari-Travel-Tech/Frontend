'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

type RoleRow = {
  id: string
  roles: { name: string } | null
}

export default function VendorOnboardingPage() {
  const router = useRouter()
  const { session, refreshRoles } = useAuth()
  const [name,        setName]        = useState('')
  const [category,    setCategory]    = useState('')
  const [description, setDescription] = useState('')
  const [phone,       setPhone]       = useState('')
  const [address,     setAddress]     = useState('')
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)

  const handleComplete = async () => {
    const userId = session?.user?.id
    if (!userId) { setError('Session expired.'); return }
    setLoading(true); setError(null)

    let logoUrl: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop() ?? 'png'
      const path = `${userId}/logo-${Date.now()}.${ext}`
      const { error: e } = await supabase.storage.from('vendor_logos').upload(path, logoFile, { upsert: true })
      if (e) { setError('Logo upload failed.'); setLoading(false); return }
      logoUrl = supabase.storage.from('vendor_logos').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      user_id: userId,
      business_name: name.trim() || null,
      category: category.trim() || null,
      description: description.trim() || null,
      contact_phone: phone.trim() || null,
      address: address.trim() || null,
      logo_url: logoUrl,
    }

    const { data: existing } = await supabase.from('vendor_profiles').select('id').eq('user_id', userId).maybeSingle()
    const { error: profileErr } = existing?.id
      ? await supabase.from('vendor_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('vendor_profiles').insert(payload)

    if (profileErr) { setError('Could not save profile.'); setLoading(false); return }

    const { data: roleRows } = await supabase.from('user_roles').select('id, roles(name)').eq('user_id', userId)
    const row = ((roleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'VENDOR')
    if (row) await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', row.id)

    await refreshRoles()
    router.replace('/vendor/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Vendor setup</p>
          <h2>Set up your vendor profile</h2>
        </div>
        <div className="auth-form">
          <label>Business name<input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Category<input className="input" placeholder="e.g. Catering, Decor" value={category} onChange={e => setCategory(e.target.value)} /></label>
          <label>Description<input className="input" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} /></label>
          <label>Contact phone<input className="input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label>Address<input className="input" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} /></label>
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
