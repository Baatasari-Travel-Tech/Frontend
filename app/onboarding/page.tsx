'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

type RoleRow = {
  id: string
  roles: { name: string } | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const { session, refreshProfile, refreshRoles } = useAuth()
  const [name,       setName]       = useState('')
  const [phone,      setPhone]      = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  const handleComplete = async () => {
    const userId = session?.user?.id
    if (!userId) { setError('Session expired. Please log in again.'); return }
    setLoading(true); setError(null)

    let avatarUrl: string | null = null
    if (avatarFile) {
      const ext      = avatarFile.name.split('.').pop() ?? 'jpg'
      const filePath = `${userId}/avatar-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars').upload(filePath, avatarFile, { upsert: true })
      if (uploadErr) { setError('Avatar upload failed.'); setLoading(false); return }
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      avatarUrl = data.publicUrl
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        full_name:                   name.trim() || null,
        phone:                       phone.trim() || null,
        avatar_url:                  avatarUrl,
        global_onboarding_completed: true,
      })
      .eq('id', userId)

    if (profileErr) { setError('Could not save profile. Please try again.'); setLoading(false); return }

    // Mark USER role onboarding complete
    const { data: userRoleRows } = await supabase
      .from('user_roles')
      .select('id, roles(name)')
      .eq('user_id', userId)

    const userRow = ((userRoleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'USER')
    if (userRow) {
      await supabase.from('user_roles')
        .update({ onboarding_completed: true }).eq('id', userRow.id)
    }

    await refreshProfile()
    await refreshRoles()
    router.replace('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">One-time setup</p>
          <h2>Complete your profile</h2>
          <p>Just a few details to personalise your experience.</p>
        </div>
        <div className="auth-form">
          <label>
            Full name
            <input className="input" placeholder="Your name"
              value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label>
            Phone (optional)
            <input className="input" placeholder="+91 98765 43210"
              value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
          <label>
            Profile photo (optional)
            <input className="input" type="file" accept="image/jpeg,image/png,image/webp"
              onChange={e => setAvatarFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        {error && <p className="error-msg">{error}</p>}
        <div className="auth-actions">
          <button className="btn btn-solid" onClick={handleComplete} disabled={loading}>
            {loading ? 'Saving…' : 'Complete setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
