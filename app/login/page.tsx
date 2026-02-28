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
    <div className="auth-page">
      <div className="auth-card">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Login to Baatasari</h2>
        </div>

        <div className="auth-form">
          <label>
            Email
            <input
              className="input"
              placeholder="you@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="input"
              placeholder="********"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>

        <div className="auth-actions">
          <button className="btn" onClick={handleLogin}>Login</button>
          <button className="btn btn-ghost" onClick={googlelogin}>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
