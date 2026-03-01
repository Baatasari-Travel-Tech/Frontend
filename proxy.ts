import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { fromDbRoleName, getRoleHome, getRoleOnboarding } from '@/lib/roles'

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/events', '/auth/callback'])
const ROLE_ONBOARDING_PATHS = new Set([
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml')
  ) {
    return NextResponse.next()
  }

  const cookiesToSet: Array<{
    name: string
    value: string
    options?: Parameters<NextResponse['cookies']['set']>[2]
  }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          cookies: Array<{
            name: string
            value: string
            options?: Parameters<NextResponse['cookies']['set']>[2]
          }>
        ) => {
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const applyCookies = (response: NextResponse) => {
    cookiesToSet.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie.options)
    })
    return response
  }

  if (!PUBLIC_PATHS.has(pathname) && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return applyCookies(NextResponse.redirect(redirectUrl))
  }

  if (user) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('onboarding_completed,roles(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data && pathname !== '/register') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/register'
      return applyCookies(NextResponse.redirect(redirectUrl))
    }

    const dbRoleName = (data?.roles as { name?: string } | null)?.name ?? null
    const role = fromDbRoleName(dbRoleName) ?? 'user'
    let onboardingCompleted = data?.onboarding_completed === true

    if (role === 'user') {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('global_onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()
      onboardingCompleted = profileData?.global_onboarding_completed === true
    }
    const shouldForceOnboarding = !onboardingCompleted || Boolean(error)
    const roleHome = getRoleHome(role)
    const roleOnboarding = getRoleOnboarding(role)

    if (pathname === '/' || pathname === '/login' || pathname === '/register') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = shouldForceOnboarding ? roleOnboarding : roleHome
      return applyCookies(NextResponse.redirect(redirectUrl))
    }

    const pathRole = getPathRole(pathname)
    if (pathRole && pathRole !== role) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = shouldForceOnboarding ? roleOnboarding : roleHome
      return applyCookies(NextResponse.redirect(redirectUrl))
    }

    if (onboardingCompleted && ROLE_ONBOARDING_PATHS.has(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = roleHome
      return applyCookies(NextResponse.redirect(redirectUrl))
    }

    if (shouldForceOnboarding && pathname !== roleOnboarding) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = roleOnboarding
      return applyCookies(NextResponse.redirect(redirectUrl))
    }
  }

  return applyCookies(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
