'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { useState } from 'react'

const modules = [
  { href: '/', label: 'Dashboard', icon: '🏠', color: '#E8856A' },
  { href: '/health', label: 'Health', icon: '💊', color: '#A8C5A0' },
  { href: '/workouts', label: 'Workouts', icon: '🏋️', color: '#F4A261' },
  { href: '/habits', label: 'Habits', icon: '✨', color: '#F5C842' },
  { href: '/calendar', label: 'Calendar', icon: '📅', color: '#C4B5D5' },
  { href: '/shopping', label: 'Shopping', icon: '🛒', color: '#E8856A' },
  { href: '/meals', label: 'Meals', icon: '🥗', color: '#95D5B2' },
  { href: '/finance', label: 'Finance', icon: '💰', color: '#74C69D' },
  { href: '/goals', label: 'Goals', icon: '🎯', color: '#FFB3C1' },
  { href: '/medical', label: 'Medical', icon: '🩺', color: '#ADB5BD' },
  { href: '/home-maintenance', label: 'Home', icon: '🏡', color: '#CDB4DB' },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  const displayName = user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'You'
  const initials = displayName.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b" style={{ borderColor: '#EDE8E3' }}>
        <span className="font-bold text-lg" style={{ color: '#E8856A' }}>🌿 MyLife</span>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-xl" style={{ background: '#FDF8F5' }}>
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-20 bg-black/20" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-20 w-64 flex flex-col bg-white border-r transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ borderColor: '#EDE8E3' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#EDE8E3' }}>
          <span className="text-xl font-bold" style={{ color: '#374151' }}>🌿 MyLife</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {modules.map(({ href, label, icon, color }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: active ? `${color}25` : 'transparent',
                  color: active ? color : '#6B7280',
                }}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t" style={{ borderColor: '#EDE8E3' }}>
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: '#E8856A' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>{displayName}</p>
              <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs px-2 py-1 rounded-lg transition-colors flex-shrink-0"
              style={{ color: '#9CA3AF' }}
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top-bar spacer */}
      <div className="lg:hidden h-14 w-full flex-shrink-0" />
    </>
  )
}
