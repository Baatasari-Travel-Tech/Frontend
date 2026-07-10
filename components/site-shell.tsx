'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/app/providers'
import {
  ArrowLeftRight,
  Bell,
  CalendarPlus,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  Plus,
  Sparkles,
  Ticket,
  UserRound,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LoadingScreen from '@/components/loading-screen'
import { DEFAULT_AVATAR_IMAGE } from '@/lib/avatar'
import {
  type AppRole, ROLE_LABELS,
  getRoleDashboard, getRoleOnboarding,
} from '@/lib/roles'
import { AuthModalRoot } from '@/components/auth/auth-modal'
import { useAuthModal } from '@/components/auth/auth-modal-context'

function UserMenu({
  showLogout = false,
  onLogout,
}: {
  showLogout?: boolean
  onLogout?: () => Promise<void>
}) {
  const { activeRole, userRoles, switchRole, profile, user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [showRoles, setShowRoles] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowRoles(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const hasOrganizerRole = userRoles.some((record) => record.role === 'EVENT_ORGANIZER')
  const switchableRoles = (['USER', 'EVENT_ORGANIZER'] as AppRole[]).filter((role) =>
    userRoles.some((record) => record.role === role)
  )
  const canSwitchRoles = hasOrganizerRole && switchableRoles.length > 1
  const isOrganizerEmailUnverified = activeRole === 'EVENT_ORGANIZER' && user?.emailVerified === false
  const showActivityLink = activeRole === 'USER'
  const profileHref = activeRole === 'EVENT_ORGANIZER' ? '/organizer/profile' : '/profile'

  const handleSwitch = async (role: AppRole) => {
    if (role === activeRole || busy || !switchableRoles.includes(role)) return
    setOpen(false)
    setShowRoles(false)
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

  const avatarUrl = profile?.avatar_url ?? null
  const displayAvatarUrl =
    !avatarUrl || failedAvatarUrl === avatarUrl ? DEFAULT_AVATAR_IMAGE : avatarUrl
  const showAvatar = failedAvatarUrl !== displayAvatarUrl
  const initials = (profile?.full_name ?? profile?.email ?? 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')

  useEffect(() => {
    setFailedAvatarUrl(null)
  }, [avatarUrl])

  const handleMenuLogout = async () => {
    if (!onLogout || busy) return
    setOpen(false)
    setShowRoles(false)
    await onLogout()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
        onClick={() => { setOpen(o => !o); setShowRoles(false) }}
        aria-label="Open user menu"
        aria-expanded={open}
        disabled={busy}
      >
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100">
          {showAvatar ? (
            <Image
              src={displayAvatarUrl}
              alt="User avatar"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              onError={() => {
                setFailedAvatarUrl(displayAvatarUrl)
              }}
            />
          ) : (
            <span className="text-xs font-semibold text-slate-500">{initials}</span>
          )}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 10 6" fill="none"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)]">
          {/* Header: avatar + name + email */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-br from-slate-50 to-white p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-white">
              {showAvatar ? (
                <Image
                  src={displayAvatarUrl}
                  alt="User avatar"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold text-slate-500">{initials}</span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {profile?.full_name || 'Welcome back'}
              </p>
              <p className="truncate text-xs text-slate-500">{profile?.email ?? user?.email ?? ''}</p>
            </div>
          </div>

          <div className="grid gap-1 p-2">
            <Link
              href={profileHref}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <UserRound className="h-4 w-4 text-slate-500" />
              My profile
            </Link>
            {showActivityLink && (
              <Link
                href="/history"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <Ticket className="h-4 w-4 text-slate-500" />
                My tickets
              </Link>
            )}
            {canSwitchRoles && (
              <>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => setShowRoles(s => !s)}
                  disabled={isOrganizerEmailUnverified}
                >
                  <ArrowLeftRight className="h-4 w-4 text-slate-500" />
                  <span className="flex-1">Switch to</span>
                </button>
                {isOrganizerEmailUnverified && (
                  <p className="px-3 pt-1 text-xs text-slate-500">
                    Verify your email to switch profiles.
                  </p>
                )}
                {showRoles && (
                  <div className="mt-1 grid gap-1 rounded-xl bg-slate-50 p-2">
                    {switchableRoles.map(role => {
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
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
                            isActive
                              ? 'bg-white text-slate-900'
                              : 'text-slate-700 hover:bg-white'
                          }`}
                          onClick={() => handleSwitch(role)}
                          disabled={isActive || busy || isOrganizerEmailUnverified}
                        >
                          <span>{ROLE_LABELS[role]}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${chipClass}`}>
                            {isActive ? 'Active' : isDone ? 'Ready' : 'Set up'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className="my-1 h-px bg-slate-100" />

            <Link
              href="/talent"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <Sparkles className="h-4 w-4 text-slate-500" />
              Talent
            </Link>

            {showLogout && onLogout ? (
              <>
                <div className="my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl bg-red-50/60 px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
                  onClick={() => void handleMenuLogout()}
                  disabled={busy}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function SiteShellContent({ children }: { children: React.ReactNode }) {
  const [booting, setBooting] = useState(true)
  const [hideLoader, setHideLoader] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { session, activeRole, userRoles, organizerVerificationStatus, profile, logout } = useAuth()
  const [logoutKey, setLogoutKey] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { open, openModal } = useAuthModal()
  const isOrderConfirmed = pathname?.startsWith('/order-confirmed') ?? false

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

  // Strip the auth params only after the modal has actually been open and then
  // closed. Without the ref this raced the opening effect above (open is still
  // false in the same render pass), wiping ?role=organizer before the register
  // form could read it.
  const authModalWasOpenRef = useRef(false)
  useEffect(() => {
    if (open) {
      authModalWasOpenRef.current = true
      return
    }
    if (!authModalWasOpenRef.current) return
    authModalWasOpenRef.current = false
    const auth = searchParams.get('auth')
    if (!auth) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('auth')
    params.delete('role')
    params.delete('authError')
    params.delete('authErrorDescription')
    router.replace(params.size ? `${pathname}?${params}` : pathname)
  }, [open, searchParams, pathname, router])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname, session?.user, activeRole])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setLogoutKey((prev) => prev + 1)
      if (typeof window !== 'undefined') {
        window.location.replace('/')
      } else {
        router.replace('/')
        router.refresh()
      }
    }
  }

  const isActive = (path: string) => pathname === path

  const greetingName = (() => {
    const full = profile?.full_name?.trim()
    if (full) return full.split(/\s+/)[0]
    const email = session?.user?.email ?? ''
    return email.split('@')[0] || 'there'
  })()
  const isLoggedIn = Boolean(session?.user)
  const showTalents = Boolean(session?.user) && activeRole === 'USER'
  const isOrganizerActive = Boolean(session?.user) && activeRole === 'EVENT_ORGANIZER'
  const activeRoleRecord = userRoles.find((record) => record.role === activeRole)
  const userRoleRecord = userRoles.find((record) => record.role === 'USER')
  const organizerRoleRecord = userRoles.find((record) => record.role === 'EVENT_ORGANIZER')
  const organizerOnboarded = organizerRoleRecord?.onboarding_completed === true
  const isOrganizerApproved = organizerOnboarded && organizerVerificationStatus === 'APPROVED'

  const resolveHomeHref = (): string => {
    if (!session?.user) return '/'

    if (activeRole === 'EVENT_ORGANIZER') {
      if (!organizerOnboarded) return getRoleOnboarding('EVENT_ORGANIZER')
      if (organizerVerificationStatus === 'EMAIL_NOT_VERIFIED') return '/organizer/email-verification'
      if (organizerVerificationStatus === 'DOCUMENTS_REQUIRED') return '/organizer/document-upload'
      if (organizerVerificationStatus !== 'APPROVED') return '/organizer/pending'
      return getRoleDashboard('EVENT_ORGANIZER')
    }

    if (activeRole === 'USER') {
      return userRoleRecord?.onboarding_completed ? '/events' : '/onboarding'
    }

    return activeRoleRecord?.onboarding_completed
      ? getRoleDashboard(activeRole)
      : getRoleOnboarding(activeRole)
  }

  const homeHref = resolveHomeHref()
  const navLinks = session?.user
    ? []
    : [
      { label: 'Home', href: homeHref },
      { label: 'Events', href: '/events' },
      { label: 'Talents', href: '/talent' },
    ]

  // Maintenance page stands alone — no site nav/footer chrome.
  if (pathname === '/maintenance') {
    return <>{children}</>
  }

  if (isOrderConfirmed) {
    return <main className="min-h-dvh bg-background">{children}</main>
  }

  return (
    <div className="min-h-dvh bg-background text-slate-900">
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

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-nav text-slate-900 backdrop-blur-lg">
        <div className="flex w-full items-center justify-between gap-8 py-4 px-2 md:px-6 lg:px-8">
          <Link href={homeHref} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Baatasari"
              width={32}
              height={32}
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
            <span className="text-lg font-semibold tracking-tight">Baatasari</span>
          </Link>
          {!isOrganizerActive && (
            <nav className="hidden flex-1 items-center justify-center gap-8 text-sm font-medium text-slate-700 md:flex">
              {navLinks.map(link => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`pb-1 transition hover:text-slate-900 ${
                      active ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          )}
          <div className="flex items-center gap-2 md:gap-3" key={logoutKey}>
            {session?.user ? (
              isOrganizerActive ? (
                <>
                  {isOrganizerApproved ? (
                    <>
                      <button
                        type="button"
                        aria-label="Notifications"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        <Bell className="h-5 w-5" />
                      </button>
                      <Link
                        href="/organizer/create-event"
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-(--brand-navy) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Create Event</span>
                      </Link>
                    </>
                  ) : null}
                  <UserMenu showLogout onLogout={handleLogout} />
                </>
              ) : (
                <>
                  <span className="hidden text-sm font-medium text-slate-700 lg:inline-flex">
                    Hi, <span className="ml-1 font-semibold text-slate-900">{greetingName}</span>
                  </span>
                  <Link
                    href="/"
                    aria-label="Home"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-(--brand-navy) text-white shadow-sm transition hover:bg-(--brand-navy)/90"
                  >
                    <Home className="h-4 w-4" />
                  </Link>
                  <UserMenu showLogout onLogout={handleLogout} />
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  className="hidden items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 md:inline-flex"
                  onClick={() => openModal('login')}
                >
                  Login
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-(--brand-navy) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--brand-navy)/90"
                    >
                      Get started
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      className="cursor-pointer gap-2.5 py-2.5 font-medium"
                      onClick={() => {
                        // Plain user register — make sure no organizer role param lingers.
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('role')
                        params.set('auth', 'register')
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <UserRound className="h-4 w-4 text-slate-500" />
                      For Users
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-2.5 py-2.5 font-medium"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        params.set('auth', 'register')
                        params.set('role', 'organizer')
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <CalendarPlus className="h-4 w-4 text-slate-500" />
                      For Organizers
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
        {!isOrganizerActive && mobileMenuOpen && (
          <nav className="absolute top-full left-0 right-0 z-50 rounded-b-2xl bg-white px-4 py-3 shadow-lg md:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive(link.href)
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    openModal('login')
                  }}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Login
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      <main className="min-h-[70dvh]">{children}</main>
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
