'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

   useEffect(() => {
  const check = async () => {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      router.replace('/login')
      return
    }

    setEmail(data.session.user.email ?? null)
  }

  check()
}, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Dashboard</h2>
      <p>Logged in as: {email}</p>

      <button onClick={logout}>Logout</button>
    </div>
  )
}