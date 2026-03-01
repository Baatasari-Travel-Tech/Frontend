'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function OnboardingClient() {
  const router = useRouter()
  const { session, userRoleId } = useAuth()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const user = session?.user ?? null
  const displayName = useMemo(() => user?.email ?? 'Member', [user?.email])

  const handleComplete = async () => {
    if (!user) return
    setIsSubmitting(true)
    setSubmitError(null)

    let avatarUrl: string | null = null
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop() ?? 'png'
      const filePath = `${user.id}/avatar-${crypto.randomUUID()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) {
        setSubmitError('Unable to upload avatar. Please try again.')
        setIsSubmitting(false)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      avatarUrl = data.publicUrl ?? null
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: name.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
        global_onboarding_completed: true,
      })
      .eq('id', user.id)

    if (error) {
      setSubmitError('Unable to finish onboarding. Please try again.')
      setIsSubmitting(false)
      return
    }

    if (userRoleId) {
      await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', userRoleId)
    }

    router.replace('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Onboarding</p>
          <h2>Welcome, {displayName}</h2>
          <p>Complete your setup to unlock the dashboard.</p>
        </div>

        <div className="auth-form">
          <label>
            Full name
            <input
              className="input"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Phone
            <input
              className="input"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label>
            Avatar upload
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {submitError && <p>{submitError}</p>}

        <div className="auth-actions">
          <button className="btn" type="button" onClick={handleComplete} disabled={isSubmitting}>
            {isSubmitting ? 'Finishing...' : 'Finish onboarding'}
          </button>
        </div>
      </div>
    </div>
  )
}
