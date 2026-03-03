'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      await new Promise(r => setTimeout(r, 300))
      const { data } = await supabase.auth.getSession()
      if (!data.session) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('global_onboarding_completed')
        .eq('id', data.session.user.id)
        .single()

      router.replace(profile?.global_onboarding_completed ? '/dashboard' : '/onboarding')
    }
    handle()
  }, [router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-900 px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 shadow-lg shadow-amber-400/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          Signing you in...
        </p>
      </div>
    </div>
  )
}
