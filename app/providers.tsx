'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login')
      if (event === 'SIGNED_IN') router.replace('/dashboard')
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return <>{children}</>
}