import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

const moduleCards = [
  {
    href: '/health',
    title: 'Health',
    description: 'Medications, supplements, water & lab results',
    icon: '💊',
    color: '#A8C5A0',
    bg: '#F0F7EE',
  },
  {
    href: '/workouts',
    title: 'Workouts',
    description: 'Log exercises, track progress',
    icon: '🏋️',
    color: '#F4A261',
    bg: '#FEF4EC',
  },
  {
    href: '/habits',
    title: 'Habits',
    description: 'Daily streaks & goal tracking',
    icon: '✨',
    color: '#D4A91E',
    bg: '#FEFCE8',
  },
  {
    href: '/calendar',
    title: 'Calendar',
    description: 'Appointments, events & reminders',
    icon: '📅',
    color: '#A08EC0',
    bg: '#F3EEF9',
  },
  {
    href: '/shopping',
    title: 'Shopping',
    description: 'Lists, pantry & grocery tracking',
    icon: '🛒',
    color: '#E8856A',
    bg: '#FDF0EC',
  },
  {
    href: '/meals',
    title: 'Meals',
    description: 'Weekly plans & nutrition logging',
    icon: '🥗',
    color: '#52B788',
    bg: '#EDFBF3',
  },
  {
    href: '/finance',
    title: 'Finance',
    description: 'Budget, expenses & card sync',
    icon: '💰',
    color: '#40916C',
    bg: '#EBFBF2',
  },
  {
    href: '/goals',
    title: 'Goals',
    description: 'Long-term milestones & progress',
    icon: '🎯',
    color: '#E06C89',
    bg: '#FEF0F4',
  },
  {
    href: '/medical',
    title: 'Medical',
    description: 'History, insurance & contacts',
    icon: '🩺',
    color: '#6B7280',
    bg: '#F3F4F6',
  },
  {
    href: '/home-maintenance',
    title: 'Home',
    description: 'Appliances, repairs & warranties',
    icon: '🏡',
    color: '#9B59B6',
    bg: '#F5EEF8',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'there'
  const today = format(new Date(), 'EEEE, MMMM d')

  // Fetch quick stats
  const [waterResult, habitResult, eventResult] = await Promise.all([
    supabase
      .from('water_logs')
      .select('amount_oz')
      .gte('logged_at', new Date().toISOString().split('T')[0]),
    supabase
      .from('habit_logs')
      .select('id')
      .eq('logged_date', new Date().toISOString().split('T')[0]),
    supabase
      .from('events')
      .select('title, start_at')
      .gte('start_at', new Date().toISOString())
      .lte('start_at', new Date(Date.now() + 86400000).toISOString())
      .order('start_at')
      .limit(3),
  ])

  const waterToday = waterResult.data?.reduce((sum, l) => sum + (l.amount_oz ?? 0), 0) ?? 0
  const habitsToday = habitResult.data?.length ?? 0
  const upcomingEvents = eventResult.data ?? []

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: '#9CA3AF' }}>{today}</p>
        <h1 className="text-3xl font-bold" style={{ color: '#374151' }}>
          Good {getGreeting()}, {displayName} 👋
        </h1>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Water today"
          value={`${Math.round(waterToday)} oz`}
          icon="💧"
          color="#7BC8E2"
          subtext="Goal: 64 oz"
        />
        <StatCard
          label="Habits done"
          value={String(habitsToday)}
          icon="✨"
          color="#F5C842"
          subtext="today"
        />
        <StatCard
          label="Events today"
          value={String(upcomingEvents.length)}
          icon="📅"
          color="#C4B5D5"
          subtext={upcomingEvents[0]?.title ?? 'None scheduled'}
        />
      </div>

      {/* Module grid */}
      <h2 className="text-lg font-semibold mb-4" style={{ color: '#374151' }}>Your modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleCards.map(card => (
          <Link key={card.href} href={card.href}>
            <div
              className="p-5 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer h-full"
              style={{ background: card.bg, borderColor: `${card.color}30` }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${card.color}25` }}
                >
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-base" style={{ color: '#374151' }}>{card.title}</h3>
                  <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{card.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  subtext,
}: {
  label: string
  value: string
  icon: string
  color: string
  subtext: string
}) {
  return (
    <div className="bg-white rounded-2xl border p-4" style={{ borderColor: '#EDE8E3' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1 truncate" style={{ color: '#9CA3AF' }}>{subtext}</p>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
