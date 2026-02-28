'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hideLoader, setHideLoader] = useState(false)

  useEffect(() => {
    const revealTimer = setTimeout(() => setIsLoading(false), 650)
    const hideTimer = setTimeout(() => setHideLoader(true), 1350)
    return () => {
      clearTimeout(revealTimer)
      clearTimeout(hideTimer)
    }
  }, [])

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
            <img src="/Navbar_logo.svg" alt="Baatasari" />
          </Link>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-ghost">Login</Link>
            <Link href="/register" className="btn">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src="/Logo.svg" alt="Baatasari logo" />
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
