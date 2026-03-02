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
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0e2240',
      flexDirection: 'column', gap: '1.25rem',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #e8a020, #1e3f73)',
        animation: 'pulse 1.4s ease-in-out infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.8125rem', fontWeight: 600,
        letterSpacing: '.08em', textTransform: 'uppercase', margin: 0 }}>
        Signing you in…
      </p>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.85);opacity:0.6}}`}</style>
    </div>
  )
}