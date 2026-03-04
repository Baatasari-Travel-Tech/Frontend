import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const ALWAYS_PUBLIC = new Set(['/', '/login', '/register', '/events', '/auth/callback'])
const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$/i

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

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

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in
  if (!user) {
    if (ALWAYS_PUBLIC.has(pathname)) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Let OAuth callback handle itself
  if (pathname === '/auth/callback') return response

  // Check global onboarding
  const { data: profile } = await supabase
    .from('profiles')
    .select('global_onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  const onboarded = profile?.global_onboarding_completed === true

  // Logged-in on public/auth pages → redirect to right place
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL(onboarded ? '/dashboard' : '/onboarding', request.url))
  }

  // Not onboarded → only /onboarding is allowed
  if (!onboarded) {
    if (pathname === '/onboarding') return response
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Already onboarded, trying to go back to /onboarding
  if (onboarded && pathname === '/onboarding') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
