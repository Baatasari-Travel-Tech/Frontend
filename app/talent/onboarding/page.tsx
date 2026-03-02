'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

type RoleRow = {
  id: string
  roles: { name: string } | null
}

export default function TalentOnboardingPage() {
  const router = useRouter()
  const { session, refreshRoles } = useAuth()
  const [stageName,    setStageName]    = useState('')
  const [talentType,   setTalentType]   = useState('')
  const [bio,          setBio]          = useState('')
  const [years,        setYears]        = useState('')
  const [portfolio,    setPortfolio]    = useState('')
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)

  const handleComplete = async () => {
    const userId = session?.user?.id
    if (!userId) { setError('Session expired.'); return }
    setLoading(true); setError(null)

    let photoUrl: string | null = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/photo-${Date.now()}.${ext}`
      const { error: e } = await supabase.storage.from('talent_media').upload(path, photoFile, { upsert: true })
      if (e) { setError('Photo upload failed.'); setLoading(false); return }
      photoUrl = supabase.storage.from('talent_media').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      user_id:           userId,
      stage_name:        stageName.trim() || null,
      talent_type:       talentType.trim() || null,
      bio:               bio.trim() || null,
      experience_years:  years ? parseInt(years, 10) : null,
      portfolio_url:     portfolio.trim() || null,
      profile_image_url: photoUrl,
    }

    const { data: existing } = await supabase.from('talent_profiles').select('id').eq('user_id', userId).maybeSingle()
    const { error: profileErr } = existing?.id
      ? await supabase.from('talent_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('talent_profiles').insert(payload)

    if (profileErr) { setError('Could not save profile.'); setLoading(false); return }

    const { data: roleRows } = await supabase.from('user_roles').select('id, roles(name)').eq('user_id', userId)
    const row = ((roleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'TALENT')
    if (row) await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', row.id)

    await refreshRoles()
    router.replace('/talent/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Talent setup</p>
          <h2>Set up your talent profile</h2>
        </div>
        <div className="auth-form">
          <label>Stage name<input className="input" placeholder="Your performer name" value={stageName} onChange={e => setStageName(e.target.value)} /></label>
          <label>Talent type<input className="input" placeholder="e.g. Singer, DJ, Comedian" value={talentType} onChange={e => setTalentType(e.target.value)} /></label>
          <label>Bio<input className="input" placeholder="Short bio" value={bio} onChange={e => setBio(e.target.value)} /></label>
          <label>Years of experience<input className="input" type="number" placeholder="0" value={years} onChange={e => setYears(e.target.value)} /></label>
          <label>Portfolio URL (optional)<input className="input" type="url" placeholder="https://yoursite.com" value={portfolio} onChange={e => setPortfolio(e.target.value)} /></label>
          <label>Profile photo (optional)<input className="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} /></label>
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
