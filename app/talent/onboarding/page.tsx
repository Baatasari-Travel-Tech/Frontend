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
  const [stageName, setStageName] = useState('')
  const [talentType, setTalentType] = useState('')
  const [bio, setBio] = useState('')
  const [years, setYears] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
      user_id: userId,
      stage_name: stageName.trim() || null,
      talent_type: talentType.trim() || null,
      bio: bio.trim() || null,
      experience_years: years ? parseInt(years, 10) : null,
      portfolio_url: portfolio.trim() || null,
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
    <div className="relative px-4 py-12 md:py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Talent setup</p>
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Set up your talent profile</h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Stage name
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Your performer name" value={stageName} onChange={e => setStageName(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Talent type
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="e.g. Singer, DJ, Comedian" value={talentType} onChange={e => setTalentType(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Bio
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Short bio" value={bio} onChange={e => setBio(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Years of experience
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" type="number" placeholder="0" value={years} onChange={e => setYears(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Portfolio URL (optional)
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" type="url" placeholder="https://yoursite.com" value={portfolio} onChange={e => setPortfolio(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Profile photo (optional)
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-6">
          <button className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60" onClick={handleComplete} disabled={loading}>
            {loading ? 'Saving...' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}
