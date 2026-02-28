"use client"
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) router.replace('/dashboard')
  })
}, [router])

  return (
    <div style={{ padding: 40 }}>
      <h1>My App</h1>
      <p>Welcome</p>

      <Link href="/login">Login</Link>
      <br />
      <Link href="/register">Register</Link>
      <br />
      <Link href="/dashboard">Dashboard</Link>
    </div>
  )
}