'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error || !data.session) {
        router.replace('/login')
        return
      }

      router.replace('/dashboard')
    }

    handle()
  }, [router])

  return <p>Signing you in...</p>
}