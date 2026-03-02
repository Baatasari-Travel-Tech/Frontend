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
  const [busy, setBusy]  = useState(false)
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
    <div className="role-switcher" ref={ref}>
      <button
        className="role-trigger"
        onClick={() => setOpen(o => !o)}
        aria-label="Switch role"
        aria-expanded={open}
        disabled={busy}
      >
        <span className="role-trigger-emoji">{ROLE_EMOJI[activeRole]}</span>
        <span className="role-trigger-name">{ROLE_LABELS[activeRole]}</span>
        <svg
          className={`role-trigger-chevron${open ? ' open' : ''}`}
          width="10" height="6" viewBox="0 0 10 6" fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="role-dropdown" role="listbox">
          <p className="role-dropdown-label">Switch role</p>
          {ALL_ROLES.map(role => {
            const record   = userRoles.find(r => r.role === role)
            const isActive = role === activeRole
            const isDone   = record?.onboarding_completed === true
            return (
              <button
                key={role}
                role="option"
                aria-selected={isActive}
                className={`role-option${isActive ? ' is-active' : ''}`}
                onClick={() => handleSwitch(role)}
                disabled={isActive || busy}
              >
                <span className="role-option-emoji">{ROLE_EMOJI[role]}</span>
                <span className="role-option-name">{ROLE_LABELS[role]}</span>
                <span className={`role-chip ${isActive ? 'active' : isDone ? 'done' : 'setup'}`}>
                  {isActive ? 'Active' : isDone ? 'Ready' : 'Set up'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [booting,    setBooting]    = useState(true)
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
    <div className="app-shell">
      {!hideLoader && (
        <div className={`page-loader${booting ? '' : ' exit'}`} aria-hidden>
          <div className="loader-inner">
            <div className="loader-mark" />
            <span className="loader-wordmark">Baatasari</span>
            <div className="loader-bar"><div className="loader-bar-fill" /></div>
          </div>
        </div>
      )}

      <header className="site-header">
        <div className="nav-container">
          <Link href="/" className="brand">
            <Image src="/Logo.svg" alt="Baatasari" width={30} height={30} priority />
            <span className="brand-name">Baatasari</span>
          </Link>
          <div className="nav-end">
            {session?.user ? (
              <>
                <RoleSwitcher />
                <Link href={getRoleDashboard(activeRole)} className="btn btn-ghost">Dashboard</Link>
                <button className="btn btn-solid" onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login"    className="btn btn-ghost">Login</Link>
                <Link href="/register" className="btn btn-solid">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-inner">
          <Image src="/Navbar_logo.svg" alt="Baatasari" width={110} height={34} />
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
          </div>
          <p className="footer-copy">© 2025 Baatasari</p>
        </div>
      </footer>
    </div>
  )
}