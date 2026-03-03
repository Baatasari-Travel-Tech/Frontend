'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/providers'

export default function VendorDashboardPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [bizName, setBizName] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('vendor_profiles').select('business_name').eq('user_id', session.user.id).maybeSingle()
      .then(({ data }) => setBizName(data?.business_name ?? null))
  }, [session?.user?.id])

  return (
    <div className="px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/60 bg-white/90 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Vendor dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Welcome back</h2>
          </div>
          <button
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Business</p>
            <strong className="mt-2 block text-lg text-slate-900">{bizName ?? '-'}</strong>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Listings</p>
            <strong className="mt-2 block text-lg text-slate-900">0</strong>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
            <strong className="mt-2 block text-lg text-slate-900">Active</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700">
            Upload products
          </button>
          <button className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            View listings
          </button>
        </div>
      </div>
    </div>
  )
}
