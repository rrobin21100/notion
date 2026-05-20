'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F9E4D4 0%, #FDF8F5 50%, #E8D5F0 100%)' }}>
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#374151' }}>Check your email</h2>
          <p style={{ color: '#9CA3AF' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F9E4D4 0%, #FDF8F5 50%, #E8D5F0 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#E8856A' }}>
            <span className="text-3xl">🌿</span>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#374151' }}>MyLife</h1>
          <p className="mt-1" style={{ color: '#9CA3AF' }}>Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8" style={{ borderColor: '#EDE8E3' }}>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Alex"
                className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#E8856A' }}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#9CA3AF' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-medium" style={{ color: '#E8856A' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
