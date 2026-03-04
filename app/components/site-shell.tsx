'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react'
import LoadingScreen from '@/app/components/loading-screen'
import {
  type AppRole, ALL_ROLES, ROLE_LABELS, ROLE_EMOJI,
  getRoleDashboard, getRoleOnboarding,
} from '@/lib/roles'
import { AuthModalRoot } from '@/app/components/auth/auth-modal'
import { useAuthModal } from '@/app/components/auth/auth-modal-context'

function RoleSwitcher() {
  const { activeRole, userRoles, switchRole, profile } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  if (!profile?.global_onboarding_completed) return null

  const handleSwitch = async (role: AppRole) => {
    if (role === activeRole || busy) return
    setOpen(false)
    setBusy(true)
    await switchRole(role)
    const existing = userRoles.find(r => r.role === role)
    router.push(
      (!existing || !existing.onboarding_completed)
        ? getRoleOnboarding(role)
        : getRoleDashboard(role)
    )
    setBusy(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        onClick={() => setOpen(o => !o)}
        aria-label="Switch role"
        aria-expanded={open}
        disabled={busy}
      >
        <span className="text-base">{ROLE_EMOJI[activeRole]}</span>
        <span>{ROLE_LABELS[activeRole]}</span>
        <svg
          className={`h-3 w-3 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 10 6" fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Switch role
          </p>
          <div className="grid gap-1">
            {ALL_ROLES.map(role => {
              const record = userRoles.find(r => r.role === role)
              const isActive = role === activeRole
              const isDone = record?.onboarding_completed === true
              const chipClass = isActive
                ? 'bg-brand-900 text-white'
                : isDone
                  ? 'bg-brand-900/5 text-brand-800'
                  : 'bg-brand-900/5 text-brand-900'

              return (
                <button
                  key={role}
                  role="option"
                  aria-selected={isActive}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleSwitch(role)}
                  disabled={isActive || busy}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{ROLE_EMOJI[role]}</span>
                    <span>{ROLE_LABELS[role]}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${chipClass}`}>
                    {isActive ? 'Active' : isDone ? 'Ready' : 'Set up'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SiteShellContent({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true)
  const [hideLoader, setHideLoader] = useState(false)
  const { session, activeRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { open, openModal } = useAuthModal()

  useEffect(() => {
    const t1 = setTimeout(() => setBooting(false), 550)
    const t2 = setTimeout(() => setHideLoader(true), 1150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login' || auth === 'register') {
      openModal(auth)
    }
  }, [searchParams, openModal])

  useEffect(() => {
    if (open) return
    const auth = searchParams.get('auth')
    if (!auth) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('auth')
    router.replace(params.size ? `${pathname}?${params}` : pathname)
  }, [open, searchParams, pathname, router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      {!hideLoader && (
        <div
          className={`fixed inset-0 z-60 transition-opacity duration-500 ${
            booting ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden
        >
          <LoadingScreen />
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="flex w-full items-center justify-between page-x py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Baatasari"
              width={32}
              height={32}
              style={{ width: 'auto', height: 'auto' }}
              priority
              unoptimized
            />
            <span className="text-lg font-semibold tracking-tight">Baatasari</span>
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            {session?.user ? (
              <>
                <RoleSwitcher />
                <Link
                  href={getRoleDashboard(activeRole)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-brand-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                  onClick={() => openModal('login')}
                >
                  Get started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[70dvh]">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="page-x py-10">
          <div className="grid gap-8 md:grid-cols-[1.6fr_1fr_1fr_1.2fr] md:items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/Navbar_logo.png"
                  alt="Baatasari"
                  width={110}
                  height={34}
                  style={{ width: 'auto', height: 'auto' }}
                  unoptimized
                />
              </div>
              <p className="max-w-sm text-sm text-slate-600">
                Discover, connect, experience. Official platform for curated events, venues, and experiences.
              </p>
              <div className="flex items-center gap-3 text-slate-500">
                <a
                  href="https://www.instagram.com"
                  aria-label="Baatasari on Instagram"
                  className="rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.facebook.com"
                  aria-label="Baatasari on Facebook"
                  className="rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.twitter.com"
                  aria-label="Baatasari on X"
                  className="rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com"
                  aria-label="Baatasari on LinkedIn"
                  className="rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="https://www.youtube.com"
                  aria-label="Baatasari on YouTube"
                  className="rounded-full border border-slate-200 p-2 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Company</p>
              <div className="grid gap-2 text-slate-600">
                <a className="hover:text-slate-900" href="/about">About</a>
              </div><br/>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resources</p>
              <div className="grid gap-2 text-slate-600">
                <a className="hover:text-slate-900" href="/contact">Contact</a>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Legal</p>
              <div className="grid gap-2 text-slate-600">
                <a className="hover:text-slate-900" href="/terms">Terms & Conditions</a>
                <a className="hover:text-slate-900" href="/privacy">Privacy Policy</a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <p>© {new Date().getFullYear()} Baatasari. All rights reserved.</p>
            <p>Built for personalized experiences.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalRoot>
      <Suspense fallback={null}>
        <SiteShellContent>{children}</SiteShellContent>
      </Suspense>
    </AuthModalRoot>
  )
}

