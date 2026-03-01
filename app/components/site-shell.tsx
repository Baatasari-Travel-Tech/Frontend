'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'
import { fromDbRoleName, getRoleHome } from '@/lib/roles'
import Image from 'next/image'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hideLoader, setHideLoader] = useState(false)
  const { session, activeRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const revealTimer = setTimeout(() => setIsLoading(false), 650)
    const hideTimer = setTimeout(() => setHideLoader(true), 1350)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const dashboardHref = useMemo(() => {
    const resolvedRole = fromDbRoleName(activeRole) ?? 'user'
    return getRoleHome(resolvedRole)
  }, [activeRole])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="app-shell">
      {!hideLoader && (
        <div
          className={`page-loader ${isLoading ? '' : 'page-loader-exit'}`}
          aria-live="polite"
          aria-busy={isLoading}
        >
          <div className="loader-card">
            <div className="loader-mark" />
            <div className="loader-text">
              <span className="loader-title">Company-Baatasari</span>
              <span className="loader-sub">Straight Briefing</span>
            </div>
            <div className="loader-bar" />
          </div>
        </div>
      )}

      <header className="site-header">
        <nav className="nav-bar">
          <Link href="/" className="brand-logo">
            <Image src="/Navbar_logo.svg" alt="Baatasari" width={120} height={40} />
          </Link>
          <div className="nav-actions">
            {session?.user ? (
              <>
                <Link href={dashboardHref} className="btn btn-ghost">Dashboard</Link>
                <button className="btn" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Login</Link>
                <Link href="/register" className="btn">Get Started</Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Image src="/Logo.svg" alt="Baatasari logo" width={120} height={40} />
            <span>Baatasari</span>
          </div>
          <div className="footer-links">
            <a href="/terms">Terms &amp; Conditions</a>
            <a href="/privacy">Privacy Policy</a>
          </div>
          <div className="footer-copy">
            Copyright, All right reserved by Baatasari
          </div>
        </div>
      </footer>
    </div>
  )
}
