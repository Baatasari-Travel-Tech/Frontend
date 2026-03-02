import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { isRole, toDbRoleName, getRoleHome, getRoleOnboarding, fromDbRoleName } from '@/lib/roles'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role')

  // We build the response first so we can attach cookies to it.
  // The final redirect URL gets set at the end once we know the destination.
  // We use a mutable variable so we can replace it on error paths.
  const fallback = NextResponse.redirect(new URL('/login', origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            fallback.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Step 1 — Exchange the OAuth code for a real session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', origin))
    }
  }

  // Step 2 — Confirm we have a valid user after the exchange
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=no_user', origin))
  }

  // Step 3 — If a role was passed (from Google signup on /register), assign it.
  // The DB trigger already assigned USER; this upsert sets the intended role.
  if (isRole(roleParam)) {
    const dbRoleName = toDbRoleName(roleParam)
    const { data: roleRow } = await supabase
      .from('roles')
      .select('id')
      .eq('name', dbRoleName)
      .maybeSingle()

    if (roleRow?.id) {
      const { error: upsertError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role_id: roleRow.id, onboarding_completed: false },
          { onConflict: 'user_id,role_id' }
        )
      if (upsertError) {
        console.error('[auth/callback] user_roles upsert error:', upsertError.message)
      }
    }
  }

  // Step 4 — Fetch current role + onboarding state to redirect correctly.
  // We do this here (not in middleware) because the session cookie hasn't been
  // read by middleware yet on this response — we need to compute it ourselves.
  const { data: userRoleData } = await supabase
    .from('user_roles')
    .select('onboarding_completed, roles(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!userRoleData) {
    // Trigger created profile but role row is missing — shouldn't happen, safe fallback
    return NextResponse.redirect(new URL('/register', origin))
  }

  const dbRoleName = (userRoleData.roles as { name?: string } | null)?.name ?? null
  const role = fromDbRoleName(dbRoleName) ?? 'user'

  let onboardingCompleted = userRoleData.onboarding_completed === true
  if (role === 'user') {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('global_onboarding_completed')
      .eq('id', user.id)
      .maybeSingle()
    onboardingCompleted = profileData?.global_onboarding_completed === true
  }

  const destination = onboardingCompleted ? getRoleHome(role) : getRoleOnboarding(role)

  // Build final redirect with the cookies already on fallback transferred over
  const finalResponse = NextResponse.redirect(new URL(destination, origin))
  fallback.cookies.getAll().forEach(({ name, value }) => {
    finalResponse.cookies.set(name, value)
  })

  return finalResponse
}