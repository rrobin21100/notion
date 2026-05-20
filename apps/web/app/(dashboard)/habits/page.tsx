'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'

const HABIT_COLORS = ['#A8C5A0', '#F5C842', '#E8856A', '#C4B5D5', '#7BC8E2', '#F4A261', '#95D5B2']
const HABIT_ICONS = ['⭐', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🌿', '🛁']

export default function HabitsPage() {
  const supabase = createClient()
  const [habits, setHabits] = useState<{
    id: string; name: string; icon: string | null; color: string | null; target_count: number
  }[]>([])
  const [logs, setLogs] = useState<{ habit_id: string; logged_date: string; count: number }[]>([])
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('⭐')
  const [newColor, setNewColor] = useState('#A8C5A0')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const last7Days = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [habitsData, logsData] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).eq('active', true).order('created_at'),
      supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('logged_date', format(subDays(new Date(), 6), 'yyyy-MM-dd')),
    ])
    if (habitsData.data) setHabits(habitsData.data)
    if (logsData.data) setLogs(logsData.data)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  function isLogged(habitId: string, date: string) {
    return logs.some(l => l.habit_id === habitId && l.logged_date === date)
  }

  function getStreak(habitId: string) {
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      if (isLogged(habitId, date)) streak++
      else break
    }
    return streak
  }

  async function toggleLog(habitId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const already = isLogged(habitId, todayStr)
    if (already) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('logged_date', todayStr)
    } else {
      await supabase.from('habit_logs').upsert({ habit_id: habitId, user_id: user.id, logged_date: todayStr, count: 1 })
    }
    await loadData()
  }

  async function addHabit() {
    if (!newName.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('habits').insert({ user_id: user.id, name: newName.trim(), icon: newIcon, color: newColor })
    setNewName('')
    setShowForm(false)
    await loadData()
    setLoading(false)
  }

  const doneToday = habits.filter(h => isLogged(h.id, todayStr)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Habits</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: '#F5C842', color: '#374151' }}
        >
          + New habit
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
        {doneToday} / {habits.length} done today
      </p>

      {/* Add habit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#EDE8E3' }}>
          <p className="font-medium mb-4" style={{ color: '#374151' }}>New habit</p>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Habit name (e.g. Drink water, Meditate)"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none mb-4"
            style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
          />
          <div className="mb-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Icon</p>
            <div className="flex gap-2 flex-wrap">
              {HABIT_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-colors"
                  style={{ background: newIcon === icon ? '#F5C84233' : '#FDF8F5', border: newIcon === icon ? '2px solid #F5C842' : '2px solid transparent' }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#9CA3AF' }}>Color</p>
            <div className="flex gap-2">
              {HABIT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className="w-7 h-7 rounded-full transition-transform"
                  style={{ background: color, transform: newColor === color ? 'scale(1.25)' : 'scale(1)', outline: newColor === color ? `3px solid ${color}40` : 'none' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addHabit} disabled={loading || !newName} className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: '#F5C842', color: '#374151' }}>
              Add habit
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ color: '#9CA3AF' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">✨</p>
          <p className="font-medium" style={{ color: '#374151' }}>No habits yet</p>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Add your first habit to start tracking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const color = habit.color ?? '#A8C5A0'
            const streak = getStreak(habit.id)
            const doneNow = isLogged(habit.id, todayStr)
            return (
              <div key={habit.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => toggleLog(habit.id)}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all flex-shrink-0"
                    style={{ background: doneNow ? `${color}30` : '#F9F9F9', border: `2px solid ${doneNow ? color : '#EDE8E3'}` }}
                  >
                    {doneNow ? '✓' : habit.icon ?? '⭐'}
                  </button>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: '#374151', textDecoration: doneNow ? 'line-through' : 'none' }}>{habit.name}</p>
                    <p className="text-xs mt-0.5" style={{ color }}>
                      🔥 {streak} day streak
                    </p>
                  </div>
                  <button
                    onClick={() => toggleLog(habit.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: doneNow ? `${color}20` : `${color}15`, color }}
                  >
                    {doneNow ? 'Done ✓' : 'Mark done'}
                  </button>
                </div>

                {/* 7-day grid */}
                <div className="flex gap-1.5">
                  {last7Days.map(date => {
                    const done = isLogged(habit.id, date)
                    const isToday = date === todayStr
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full aspect-square rounded-lg flex items-center justify-center text-xs"
                          style={{ background: done ? `${color}30` : '#F3F4F6', border: isToday ? `2px solid ${color}` : '2px solid transparent' }}
                        >
                          {done && <span style={{ color }}>✓</span>}
                        </div>
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>
                          {format(new Date(date + 'T12:00:00'), 'EEE')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
