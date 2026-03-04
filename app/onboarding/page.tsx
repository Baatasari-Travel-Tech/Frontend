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
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    const userId = session?.user?.id
    if (!userId) { setError('Session expired. Please log in again.'); return }
    setLoading(true); setError(null)

    let avatarUrl: string | null = null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
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
        full_name: name.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl,
        global_onboarding_completed: true,
      })
      .eq('id', userId)

    if (profileErr) { setError('Could not save profile. Please try again.'); setLoading(false); return }

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
    <div className="relative page-x py-12 md:py-16">
      <div className="w-full">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">One-time setup</p>
            <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Complete your profile</h2>
            <p className="text-sm text-slate-500">Just a few details to personalize your experience.</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Full name
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Phone (optional)
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
              Profile photo (optional)
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-900/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-800 hover:file:bg-brand-900/10"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-6">
            <button
              className="w-full rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


