'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

type RoleRow = {
  id: string
  roles: { name: string } | null
}

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const { session, refreshRoles } = useAuth()
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [address,     setAddress]     = useState('')
  const [city,        setCity]        = useState('')
  const [state,       setState]       = useState('')
  const [pincode,     setPincode]     = useState('')
  const [logoFile,    setLogoFile]    = useState<File | null>(null)
  const [docFile,     setDocFile]     = useState<File | null>(null)
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
      const { error: e } = await supabase.storage.from('organizer_logos').upload(path, logoFile, { upsert: true })
      if (e) { setError('Logo upload failed.'); setLoading(false); return }
      logoUrl = supabase.storage.from('organizer_logos').getPublicUrl(path).data.publicUrl
    }

    let docUrl: string | null = null
    if (docFile) {
      const ext = docFile.name.split('.').pop() ?? 'pdf'
      const path = `${userId}/doc-${Date.now()}.${ext}`
      const { error: e } = await supabase.storage.from('organizer_docs').upload(path, docFile, { upsert: true })
      if (e) { setError('Document upload failed.'); setLoading(false); return }
      docUrl = path
    }

    const payload = {
      user_id:       userId,
      org_name:      name.trim() || null,
      description:   description.trim() || null,
      contact_email: email.trim() || null,
      contact_phone: phone.trim() || null,
      address:       address.trim() || null,
      city:          city.trim() || null,
      state:         state.trim() || null,
      pincode:       pincode.trim() || null,
      logo_url:      logoUrl,
      kyc_doc_url:   docUrl,
    }

    const { data: existing } = await supabase.from('event_organizer_profiles').select('id').eq('user_id', userId).maybeSingle()
    const { error: profileErr } = existing?.id
      ? await supabase.from('event_organizer_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('event_organizer_profiles').insert(payload)

    if (profileErr) { setError('Could not save profile.'); setLoading(false); return }

    // Mark organizer role onboarding complete
    const { data: roleRows } = await supabase.from('user_roles').select('id, roles(name)').eq('user_id', userId)
    const orgRow = ((roleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'EVENT_ORGANIZER')
    if (orgRow) await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', orgRow.id)

    await refreshRoles()
    router.replace('/event-organizer/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Organizer setup</p>
          <h2>Set up your organizer profile</h2>
        </div>
        <div className="auth-form">
          <label>Organization name<input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} /></label>
          <label>Description<input className="input" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} /></label>
          <label>Contact email<input className="input" type="email" placeholder="contact@org.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>Contact phone<input className="input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label>Address<input className="input" placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} /></label>
          <label>City<input className="input" placeholder="City" value={city} onChange={e => setCity(e.target.value)} /></label>
          <label>State<input className="input" placeholder="State" value={state} onChange={e => setState(e.target.value)} /></label>
          <label>Pincode<input className="input" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} /></label>
          <label>Logo (optional)<input className="input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} /></label>
          <label>KYC / Verification doc (optional)<input className="input" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setDocFile(e.target.files?.[0] ?? null)} /></label>
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
