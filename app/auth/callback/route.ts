import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isRole, toDbRoleName } from '@/lib/roles'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options)
          })
        },
      },
    }
  )

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const roleParam = searchParams.get('role')
    const appRole = isRole(roleParam) ? roleParam : 'user'
    const dbRoleName = toDbRoleName(appRole)

    const { data: roleRow } = await supabase
      .from('roles')
      .select('id,name')
      .eq('name', dbRoleName)
      .maybeSingle()

    if (roleRow?.id) {
      await supabase.from('user_roles').upsert(
        {
          user_id: user.id,
          role_id: roleRow.id,
          onboarding_completed: false,
        },
        { onConflict: 'user_id,role_id' }
      )
    }
  }

  return NextResponse.redirect(new URL('/', request.url))
}
