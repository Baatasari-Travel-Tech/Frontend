'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import InlineSpinner from '@/app/components/ui/inline-spinner'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

type AuthSwitch = {
  onSwitchMode?: () => void
}

export function LoginForm({ onSwitchMode }: AuthSwitch) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError(null)
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const { data: profile } = await supabase
      .from('profiles').select('global_onboarding_completed').eq('id', data.user.id).single()
    router.replace(profile?.global_onboarding_completed ? '/dashboard' : '/onboarding')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
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
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            type="password"
            placeholder="********"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
          onClick={handleLogin}
          disabled={loading}
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
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleGoogle}
        >
          <GoogleIcon /> Continue with Google
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        No account?{' '}
        <button
          type="button"
          className="font-semibold text-brand-800 hover:text-brand-800"
          onClick={onSwitchMode}
        >
          Sign up
        </button>
      </p>
    </div>
  )
}

export function RegisterForm({ onSwitchMode }: AuthSwitch) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError(null)
    const { error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    router.replace('/onboarding')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Create account</p>
        <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
        <p className="text-sm text-slate-500">Join as a user and unlock other roles later.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm password
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-900 focus:outline-none focus:ring-4 focus:ring-brand-900/10"
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading && <InlineSpinner />}
          <span>{loading ? 'Creating account...' : 'Create account'}</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          or
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={handleGoogle}
        >
          <GoogleIcon /> Continue with Google
        </button>
      </div>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          type="button"
          className="font-semibold text-brand-800 hover:text-brand-800"
          onClick={onSwitchMode}
        >
          Login
        </button>
      </p>
    </div>
  )
}
