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
      if (!data.session) { router.replace('/?auth=login'); return }

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
    <div className="flex min-h-dvh items-center justify-center bg-brand-900 page-x">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-linear-to-br from-brand-900 to-brand-800 shadow-lg shadow-brand-900/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
          Signing you in...
        </p>
      </div>
    </div>
  )
}

