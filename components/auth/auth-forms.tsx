'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { resolveUserHome } from '@/lib/auth/navigation'
import { useAuthStore } from '@/lib/auth/store'
import { useAuthModal } from './auth-modal-context'
import InlineSpinner from '@/components/ui/inline-spinner'
import { User, CalendarPlus, Eye, EyeOff } from 'lucide-react'
import { logAuth, logAuthError } from '@/lib/auth-log'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

type AuthSwitch = {
  onSwitchMode?: () => void
}

type GoogleCredentialResponse = {
  credential?: string
}

type GooglePromptMomentNotification = {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => string
  isSkippedMoment: () => boolean
  getSkippedReason: () => string
  isDismissedMoment: () => boolean
  getDismissedReason: () => string
  getMomentType: () => string
}

type GoogleIdConfiguration = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
}

type GoogleIdApi = {
  initialize: (config: GoogleIdConfiguration) => void
  prompt: (momentListener?: (notification: GooglePromptMomentNotification) => void) => void
}

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleIdApi
    }
  }
}

const resolveGoogleNotDisplayedMessage = (reason: string) => {
  if (reason === 'browser_not_supported') {
    return 'Google sign-in is not supported in this browser. Please use email/password instead.'
  }

  return 'Google sign-in was blocked or unavailable. Please allow it in your browser and try again.'
}

const getOrganizerVerificationStatus = () => {
  const currentUser = useAuthStore.getState().user
  if (!currentUser || currentUser.role !== 'ORGANIZER') return null
  if (!currentUser.emailVerified) return 'EMAIL_NOT_VERIFIED'
  if (!currentUser.organizerApproved) return 'PENDING'
  return 'APPROVED'
}

const resolvePostAuthDestination = () =>
  resolveUserHome({
    user: useAuthStore.getState().user,
    activeRole: useAuthStore.getState().activeRole === 'ORGANIZER' ? 'EVENT_ORGANIZER' : 'USER',
    organizerVerificationStatus: getOrganizerVerificationStatus(),
  })

const resolveAuthDestination = (searchParams: { get: (key: string) => string | null }) => {
  const redirect = searchParams.get('redirect')
  if (redirect && redirect.startsWith('/')) return redirect
  return resolvePostAuthDestination()
}

const resolveGoogleOAuthRedirectUrl = (role: 'USER' | 'ORGANIZER', redirectPath: string) => {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? ''
  const params = new URLSearchParams()
  params.set('role', role)
  if (redirectPath.startsWith('/')) {
    params.set('redirect', redirectPath)
  }
  return `${base}/api/v1/auth/google/redirect?${params.toString()}`
}

const useGoogleIdentity = (onCredential: (credential: string) => Promise<void>) => {
  const callbackRef = useRef(onCredential)
  const [googleReady, setGoogleReady] = useState(() => {
    if (typeof window === 'undefined') return false
    return Boolean((window as GoogleWindow).google?.accounts?.id)
  })

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]')
    if (existing) {
      if ((window as GoogleWindow).google?.accounts?.id) return

      const handleLoad = () => setGoogleReady(true)
      existing.addEventListener('load', handleLoad)
      return () => existing.removeEventListener('load', handleLoad)
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    const handleLoad = () => setGoogleReady(true)
    script.addEventListener('load', handleLoad)
    document.body.appendChild(script)

    return () => script.removeEventListener('load', handleLoad)
  }, [])

  const prompt = async (
    momentListener?: (notification: GooglePromptMomentNotification) => void,
  ) => {
    const google = (window as GoogleWindow).google
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!google?.accounts?.id || !clientId) {
      throw new Error('Google sign-in is not configured.')
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (response.credential) {
          void callbackRef.current(response.credential)
        }
      },
    })

    google.accounts.id.prompt(momentListener)
  }

  return { googleReady, prompt }
}

export function LoginForm({ onSwitchMode }: AuthSwitch) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, googleAuth } = useAuth()
  const { closeModal, setIsAuthenticating } = useAuthModal()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const autoPromptedRef = useRef(false)

  const { googleReady, prompt } = useGoogleIdentity(async (credential) => {
    setError(null)
    setLoading(true)
    setIsAuthenticating(true)

    try {
      await googleAuth(credential)
      closeModal()
      router.replace(resolveAuthDestination(searchParams))
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('login:google:error', { message })
      setError(message)
    } finally {
      setLoading(false)
      setGoogleLoading(false)
      setIsAuthenticating(false)
    }
  })

  const authErrorMessage = (() => {
    const authError = searchParams.get('authError')
    if (!authError) return null
    const description = searchParams.get('authErrorDescription') ?? ''
    let message = 'Sign in failed. Please try again.'
    if (description.toLowerCase().includes('already') || description.toLowerCase().includes('exists')) {
      message = 'This email already has an account. Please sign in with email/password.'
    }
    return message
  })()

  const errorToShow = error ?? authErrorMessage

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError(null)
    setIsAuthenticating(true)
    logAuth('login:submit', { email })

    try {
      await login({ email, password })
      closeModal()
      router.replace(resolveAuthDestination(searchParams))
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Invalid email or password.'
      logAuthError('login:error', { message })
      setError(message)
    } finally {
      setLoading(false)
      setIsAuthenticating(false)
    }
  }

  useEffect(() => {
    if (!googleReady || autoPromptedRef.current) return

    autoPromptedRef.current = true
    logAuth('login:google:auto-prompt')
    void prompt((notification) => {
      try {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason()
          logAuthError('login:google:auto-not-displayed', { reason })
          if (reason === 'browser_not_supported') {
            setError(resolveGoogleNotDisplayedMessage(reason))
          }
          return
        }

        if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason()
          logAuth('login:google:auto-skipped', { reason })
          return
        }

        if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason()
          logAuth('login:google:auto-dismissed', { reason })
        }
      } catch (momentError) {
        const message = momentError instanceof Error ? momentError.message : 'Unknown prompt state error.'
        logAuthError('login:google:auto-moment-error', { message })
      }
    }).catch((authError) => {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('login:google:auto-prompt-error', { message })
    })
  }, [googleReady, prompt])

  const handleGoogle = () => {
    setError(null)
    setGoogleLoading(true)
    logAuth('login:google:redirect-start')

    try {
      const redirectPath = resolveAuthDestination(searchParams)
      const googleUrl = resolveGoogleOAuthRedirectUrl('USER', redirectPath)
      window.location.assign(googleUrl)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('login:google:redirect-error', { message })
      setError(message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Login</p>
        <h2 className="text-2xl font-semibold text-slate-900">Login to Baatasari</h2>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            type="email"
            placeholder="contactus@baatasari.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <div className="relative mt-2">
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-11 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
              type={showPassword ? 'text' : 'password'}
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </label>
      </div>

      {errorToShow && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {errorToShow}
        </p>
      )}

      <div className="space-y-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
          onClick={() => void handleLogin()}
          disabled={loading || !email || !password}
        >
          {loading && <InlineSpinner />}
          <span>{loading ? 'Signing in...' : 'Login'}</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          onClick={() => void handleGoogle()}
          disabled={loading || googleLoading}
        >
          {googleLoading ? <InlineSpinner /> : <GoogleIcon />}
          {googleLoading ? 'Opening Google...' : 'Continue with Google'}
        </button>
      </div>

      <div className="space-y-2 text-center text-sm text-slate-500">
        <p>
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchMode}
            className="font-semibold text-brand-800"
          >
            Sign Up
          </button>
        </p>

        <p className="text-xs">
          By continuing, you agree to our{' '}
          <a href="/terms&conditions" className="font-semibold text-brand-800">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="font-semibold text-brand-800">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}

export function RegisterForm({ onSwitchMode }: AuthSwitch) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, googleAuth } = useAuth()
  const { closeModal, setIsAuthenticating } = useAuthModal()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const roleParam = searchParams.get('role')
  const initialRole: 'user' | 'organizer' = roleParam === 'organizer' ? 'organizer' : 'user'
  const [role, setRole] = useState<'user' | 'organizer'>(initialRole)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  const selectedRole: 'USER' | 'ORGANIZER' = role === 'organizer' ? 'ORGANIZER' : 'USER'
  const autoPromptedOnOpenRef = useRef(false)
  const previousRoleRef = useRef<'USER' | 'ORGANIZER'>(selectedRole)

  const { googleReady, prompt } = useGoogleIdentity(async (credential) => {
    setError(null)
    setLoading(true)
    setIsAuthenticating(true)

    try {
      await googleAuth(credential, selectedRole)
      closeModal()
      router.replace(resolveAuthDestination(searchParams))
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('register:google:error', { message, role: selectedRole })
      setError(message)
    } finally {
      setLoading(false)
      setGoogleLoading(false)
      setIsAuthenticating(false)
    }
  })

  const handleRegister = async () => {
    if (!email || !password || !confirm) {
      setError('Please fill all fields')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError(null)
    setIsAuthenticating(true)
    logAuth('register:submit', { email, role: selectedRole })

    try {
      await register({
        email,
        password,
        role: selectedRole,
      })
      closeModal()
      router.replace(resolveAuthDestination(searchParams))
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unable to create account.'
      logAuthError('register:error', { message, role: selectedRole })
      setError(message)
    } finally {
      setLoading(false)
      setIsAuthenticating(false)
    }
  }

  useEffect(() => {
    if (!googleReady) return

    const switchedToOrganizer =
      previousRoleRef.current === 'USER' && selectedRole === 'ORGANIZER'
    previousRoleRef.current = selectedRole

    const shouldPrompt = !autoPromptedOnOpenRef.current || switchedToOrganizer
    if (!shouldPrompt) return

    autoPromptedOnOpenRef.current = true
    logAuth('register:google:auto-prompt', {
      role: selectedRole,
      trigger: switchedToOrganizer ? 'role-switch' : 'modal-open',
    })

    void prompt((notification) => {
      try {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason()
          logAuthError('register:google:auto-not-displayed', { reason, role: selectedRole })
          if (reason === 'browser_not_supported') {
            setError(resolveGoogleNotDisplayedMessage(reason))
          }
          return
        }

        if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason()
          logAuth('register:google:auto-skipped', { reason, role: selectedRole })
          return
        }

        if (notification.isDismissedMoment()) {
          const reason = notification.getDismissedReason()
          logAuth('register:google:auto-dismissed', { reason, role: selectedRole })
        }
      } catch (momentError) {
        const message = momentError instanceof Error ? momentError.message : 'Unknown prompt state error.'
        logAuthError('register:google:auto-moment-error', { message, role: selectedRole })
      }
    }).catch((authError) => {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('register:google:auto-prompt-error', { message, role: selectedRole })
    })
  }, [googleReady, prompt, selectedRole])

  const handleGoogle = () => {
    setError(null)
    setGoogleLoading(true)
    logAuth('register:google:redirect-start', { role: selectedRole })

    try {
      const redirectPath = resolveAuthDestination(searchParams)
      const googleUrl = resolveGoogleOAuthRedirectUrl(selectedRole, redirectPath)
      window.location.assign(googleUrl)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Google sign-in failed. Please try again.'
      logAuthError('register:google:redirect-error', { message, role: selectedRole })
      setError(message)
      setGoogleLoading(false)
    }
  }

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }

  const strength = Object.values(passwordChecks).filter(Boolean).length
  const strengthLabel =
    strength <= 1 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong'

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">
          Create your account
        </h2>
        <p className="text-sm text-slate-500">Get started in seconds</p>
      </div>

      <div className="relative mb-4 grid grid-cols-2 rounded-full bg-brand-700/90 p-1 backdrop-blur">
        <div
          className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-brand-900 shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out ${
            role === 'organizer' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />

        <button
          type="button"
          onClick={() => setRole('user')}
          className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition-all duration-200 ${
            role === 'user'
              ? 'scale-100 text-white'
              : 'scale-95 text-white/60 hover:text-white/80'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          User
        </button>

        <button
          type="button"
          onClick={() => setRole('organizer')}
          className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition-all duration-200 ${
            role === 'organizer'
              ? 'scale-100 text-white'
              : 'scale-95 text-white/60 hover:text-white/80'
          }`}
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Event organizer
        </button>
      </div>

      <div className="space-y-4">
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-2">
          <div className="relative">
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          {isPasswordFocused && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      strength <= 1
                        ? 'w-1/4 bg-rose-500'
                        : strength <= 3
                          ? 'w-2/4 bg-amber-500'
                          : 'w-full bg-emerald-500'
                    }`}
                  />
                </div>
                <span className="text-xs text-slate-500">{strengthLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-1 text-xs">
                <p className={passwordChecks.length ? 'text-green-900' : 'text-slate-400'}>
                  [ok] 8+ characters
                </p>
                <p className={passwordChecks.uppercase ? 'text-green-900' : 'text-slate-400'}>
                  [ok] Uppercase
                </p>
                <p className={passwordChecks.number ? 'text-green-900' : 'text-slate-400'}>
                  [ok] Number
                </p>
                <p className={passwordChecks.special ? 'text-green-900' : 'text-slate-400'}>
                  [ok] Special char
                </p>
              </div>
            </>
          )}
        </div>

        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-900 focus:ring-4 focus:ring-brand-900/10"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void handleRegister()}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <button
        onClick={() => void handleRegister()}
        disabled={loading || !email || !password || !confirm}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
      >
        {loading && <InlineSpinner />}
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        onClick={() => void handleGoogle()}
        disabled={loading || googleLoading}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {googleLoading ? <InlineSpinner /> : <GoogleIcon />}
        {googleLoading ? 'Opening Google...' : 'Continue with Google'}
      </button>

      <div className="space-y-2 text-center text-sm text-slate-500">
        <p>
          Already have an account?{' '}
          <button
            onClick={onSwitchMode}
            className="font-semibold text-brand-800"
          >
            Sign in
          </button>
        </p>

        <p className="text-xs">
          By continuing, you agree to our{' '}
          <a href="/terms&conditions" className="font-semibold text-brand-800">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" className="font-semibold text-brand-800">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
