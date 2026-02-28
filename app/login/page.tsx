'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
    else router.push('/dashboard')
  }

  const googlelogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://baatasari.com/auth/callback',
      },
    })
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>

      <input
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <br />

      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br />

      <button onClick={handleLogin}>Login</button>
      <button onClick={googlelogin}>
      Continue with Google
    </button>
    </div>
  )
}