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
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <div className="relative px-4 py-12 md:py-16">
      <div className="w-full rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Vendor setup</p>
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Set up your vendor profile</h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Business name
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Category
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="e.g. Catering, Decor" value={category} onChange={e => setCategory(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Description
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contact phone
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Address
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Logo (optional)
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
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

