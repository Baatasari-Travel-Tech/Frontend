'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { useAuthStore } from '@/lib/auth/store'
import LoadingScreen from '@/components/loading-screen'

const normalizeRedirectPath = (value: string | null) => {
  if (!value || !value.startsWith('/')) return '/'
  return value
}

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { bootstrap } = useAuth()

  useEffect(() => {
    let isActive = true

    const handleCallback = async () => {
      const status = searchParams.get('status')
      const redirectPath = normalizeRedirectPath(searchParams.get('redirect'))
      const authError = searchParams.get('authError') ?? 'google_oauth_failed'
      const authErrorDescription =
        searchParams.get('authErrorDescription') ?? 'Google sign-in failed. Please try again.'

      if (status === 'error') {
        router.replace(
          `/?auth=login&authError=${encodeURIComponent(authError)}&authErrorDescription=${encodeURIComponent(authErrorDescription)}`,
        )
        return
      }

      try {
        await bootstrap()
        if (!isActive) return

        if (useAuthStore.getState().user) {
          router.replace(redirectPath)
          return
        }

        router.replace(
          `/?auth=login&authError=google_oauth_failed&authErrorDescription=${encodeURIComponent('Unable to complete Google sign-in.')}`,
        )
      } catch {
        if (!isActive) return
        router.replace(
          `/?auth=login&authError=google_oauth_failed&authErrorDescription=${encodeURIComponent('Unable to complete Google sign-in.')}`,
        )
      }
    }

    void handleCallback()

    return () => {
      isActive = false
    }
  }, [bootstrap, router, searchParams])

  return <LoadingScreen />
}
