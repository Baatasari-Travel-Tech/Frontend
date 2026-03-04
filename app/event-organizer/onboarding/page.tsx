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
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
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
      user_id: userId,
      org_name: name.trim() || null,
      description: description.trim() || null,
      contact_email: email.trim() || null,
      contact_phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      pincode: pincode.trim() || null,
      logo_url: logoUrl,
      kyc_doc_url: docUrl,
    }

    const { data: existing } = await supabase.from('event_organizer_profiles').select('id').eq('user_id', userId).maybeSingle()
    const { error: profileErr } = existing?.id
      ? await supabase.from('event_organizer_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('event_organizer_profiles').insert(payload)

    if (profileErr) { setError('Could not save profile.'); setLoading(false); return }

    const { data: roleRows } = await supabase.from('user_roles').select('id, roles(name)').eq('user_id', userId)
    const orgRow = ((roleRows as RoleRow[] | null) ?? []).find(r => r.roles?.name === 'EVENT_ORGANIZER')
    if (orgRow) await supabase.from('user_roles').update({ onboarding_completed: true }).eq('id', orgRow.id)

    await refreshRoles()
    router.replace('/event-organizer/dashboard')
  }

  return (
    <div className="relative page-x py-12 md:py-16">
      <div className="w-full rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-900">Organizer setup</p>
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">Set up your organizer profile</h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            Organization name
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Description
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="Short description" value={description} onChange={e => setDescription(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contact email
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" type="email" placeholder="contact@org.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contact phone
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            Address
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="Street address" value={address} onChange={e => setAddress(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            City
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            State
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="State" value={state} onChange={e => setState(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Pincode
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10" placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Logo (optional)
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-900/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-800 hover:file:bg-brand-900/10" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
            KYC / Verification doc (optional)
            <input className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm file:mr-4 file:rounded-full file:border-0 file:bg-brand-900/5 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-900 hover:file:bg-brand-900/10" type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-6">
          <button className="w-full rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60" onClick={handleComplete} disabled={loading}>
            {loading ? 'Saving...' : 'Finish setup'}
          </button>
        </div>
      </div>
    </div>
  )
}


