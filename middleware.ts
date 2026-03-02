import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { fromDbRoleName, getRoleHome, getRoleOnboarding } from '@/lib/roles'

// ─── Constants ────────────────────────────────────────────────────────────────

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/events', '/auth/callback'])

const ONBOARDING_PATHS = new Set([
  '/onboarding',
  '/event-organizer/onboarding',
  '/vendor/onboarding',
  '/restaurant/onboarding',
])

const getPathRole = (pathname: string) => {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'user'
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) return 'user'
  if (pathname.startsWith('/event-organizer')) return 'organizer'
  if (pathname.startsWith('/vendor')) return 'vendor'
  if (pathname.startsWith('/restaurant')) return 'restaurant'
  return null
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip Next.js internals, static files, and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // 2. Build mutable response so refreshed auth cookies are forwarded
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Always use getUser() — validates JWT server-side, never trust cached session
  const { data: { user } } = await supabase.auth.getUser()

  // ── 3. Unauthenticated ─────────────────────────────────────────────────────
  if (!user) {
    if (PUBLIC_PATHS.has(pathname)) return response
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── 4. Let /auth/callback handle its own redirect after OAuth exchange ──────
  if (pathname === '/auth/callback') return response

  // ── 5. Fetch role ──────────────────────────────────────────────────────────
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select('onboarding_completed, roles(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // DB error → pass through, don't loop
  if (roleError) {
    console.error('[middleware] user_roles error:', roleError.message)
    return response
  }

  // No role row → incomplete account, send to /register
  if (!roleData) {
    if (pathname === '/register') return response
    const url = request.nextUrl.clone()
    url.pathname = '/register'
    return NextResponse.redirect(url)
  }

  // ── 6. Resolve role + onboarding state ────────────────────────────────────
  const dbRoleName = (roleData.roles as { name?: string } | null)?.name ?? null
  const role = fromDbRoleName(dbRoleName) ?? 'user'

  let onboardingCompleted = roleData.onboarding_completed === true

  // For 'user' role, source of truth is profiles.global_onboarding_completed
  if (role === 'user') {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('global_onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
    onboardingCompleted = profileData?.global_onboarding_completed === true
  }

  const roleHome = getRoleHome(role)
  const roleOnboarding = getRoleOnboarding(role)

  // ── 7. Logged-in user on public/auth pages → go to their home ─────────────
  if (PUBLIC_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = onboardingCompleted ? roleHome : roleOnboarding
    return NextResponse.redirect(url)
  }

  // ── 8. Wrong-role path → redirect to own home ─────────────────────────────
  const pathRole = getPathRole(pathname)
  if (pathRole && pathRole !== role) {
    const url = request.nextUrl.clone()
    url.pathname = onboardingCompleted ? roleHome : roleOnboarding
    return NextResponse.redirect(url)
  }

  // ── 9. Already onboarded but on onboarding page → go home ─────────────────
  if (onboardingCompleted && ONBOARDING_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = roleHome
    return NextResponse.redirect(url)
  }

  // ── 10. Not onboarded and not on onboarding page → force onboarding ────────
  if (!onboardingCompleted && !ONBOARDING_PATHS.has(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = roleOnboarding
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}