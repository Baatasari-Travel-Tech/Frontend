'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleRegister = async () => {
    const { error } = await supabase.auth.signUp({
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
          <p className="eyebrow">Start in minutes</p>
          <h2>Create your Baatasari account</h2>
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
              placeholder="Create a password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </label>
        </div>

        <div className="auth-actions">
          <button className="btn" onClick={handleRegister}>Create account</button>
          <button className="btn btn-ghost" onClick={googlelogin}>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
