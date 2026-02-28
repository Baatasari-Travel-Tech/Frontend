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
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Welcome back</h2>
          </div>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
        <div className="dashboard-body">
          <p>Logged in as</p>
          <strong>{email}</strong>
        </div>
        <div className="dashboard-actions">
          <button className="btn" type="button">Get a plan now</button>
          <button className="btn btn-light" type="button">Update mood</button>
        </div>
      </div>
    </div>
  )
}
