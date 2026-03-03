'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import {
  type AppRole, ALL_ROLES, ROLE_LABELS, ROLE_EMOJI,
  getRoleDashboard, getRoleOnboarding,
} from '@/lib/roles'

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
                ? 'bg-emerald-600 text-white'
                : isDone
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'

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

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true)
  const [hideLoader, setHideLoader] = useState(false)
  const { session, activeRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const t1 = setTimeout(() => setBooting(false), 550)
    const t2 = setTimeout(() => setHideLoader(true), 1150)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-dvh bg-stone-50 text-slate-900">
      {!hideLoader && (
        <div
          className={`fixed inset-0 z-60 flex items-center justify-center bg-stone-50/90 transition-opacity duration-500 ${
            booting ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-hidden
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-amber-400 via-amber-300 to-emerald-500 shadow-lg shadow-amber-200/60" />
            <span className="text-sm font-semibold tracking-[0.3em] text-slate-600">BAATASARI</span>
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-lineaar-to-r from-emerald-500 via-emerald-400 to-amber-400" />
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="flex w-full items-center justify-between px-4 py-3 md:px-6">
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
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  onClick={logout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-[70dvh]">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="flex w-full flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/Navbar_logo.png"
              alt="Baatasari"
              width={110}
              height={34}
              style={{ width: 'auto', height: 'auto' }}
              unoptimized
            />
            <p className="text-xs text-slate-500">Discover, connect, experience.</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a className="hover:text-slate-900" href="/terms">Terms</a>
            <a className="hover:text-slate-900" href="/privacy">Privacy</a>
          </div>
          <p className="text-xs text-slate-500">Copyright 2025 Baatasari</p>
        </div>
      </footer>
    </div>
  )
}
