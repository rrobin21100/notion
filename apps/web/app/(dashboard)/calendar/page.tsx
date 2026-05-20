'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { useSearchParams } from 'next/navigation'

const EVENT_TYPES = ['personal', 'appointment', 'medical', 'fitness', 'home', 'reminder']
const EVENT_COLORS: Record<string, string> = {
  personal: '#C4B5D5',
  appointment: '#7BC8E2',
  medical: '#F4A261',
  fitness: '#A8C5A0',
  home: '#CDB4DB',
  reminder: '#F5C842',
  google_calendar: '#4285F4',
}

type Event = {
  id: string
  title: string
  event_type: string | null
  start_at: string
  end_at: string | null
  location: string | null
  all_day: boolean
  source?: string
}

type GoogleConnection = {
  email: string | null
  connected_at: string
} | null

export default function CalendarPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [viewDate, setViewDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [googleConn, setGoogleConn] = useState<GoogleConnection>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: '', event_type: 'personal',
    start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_at: '', location: '', all_day: false,
  })
  const [loading, setLoading] = useState(false)

  // Show banner from OAuth redirect
  useEffect(() => {
    if (searchParams.get('google_connected') === 'true') {
      setSyncMsg('Google Calendar connected! Click "Sync now" to import your events.')
    }
    if (searchParams.get('google_error')) {
      setSyncMsg('Google Calendar connection failed. Please try again.')
    }
  }, [searchParams])

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const monthStart = format(startOfMonth(viewDate), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(viewDate), 'yyyy-MM-dd')

    const [eventsRes, connRes] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id)
        .gte('start_at', monthStart)
        .lte('start_at', monthEnd + 'T23:59:59')
        .order('start_at'),
      supabase.from('google_calendar_connections').select('email, connected_at')
        .eq('user_id', user.id).single(),
    ])

    if (eventsRes.data) setEvents(eventsRes.data)
    setGoogleConn(connRes.data ?? null)
  }, [supabase, viewDate])

  useEffect(() => { loadData() }, [loadData])

  async function addEvent() {
    if (!newEvent.title.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('events').insert({
      user_id: user.id,
      title: newEvent.title,
      event_type: newEvent.event_type,
      start_at: newEvent.start_at,
      end_at: newEvent.end_at || null,
      location: newEvent.location || null,
      all_day: newEvent.all_day,
      source: 'local',
    })
    setNewEvent({ title: '', event_type: 'personal', start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), end_at: '', location: '', all_day: false })
    setShowForm(false)
    await loadData()
    setLoading(false)
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id)
    await loadData()
  }

  async function syncGoogle() {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await fetch('/api/google/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg(`Synced ${data.imported} events from Google Calendar`)
        await loadData()
      } else {
        setSyncMsg(data.error ?? 'Sync failed')
      }
    } catch {
      setSyncMsg('Sync failed — check your connection')
    }
    setSyncing(false)
  }

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const firstDayOfWeek = startOfMonth(viewDate).getDay()
  const selectedDayEvents = events.filter(e => isSameDay(parseISO(e.start_at), selectedDate))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Calendar</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#C4B5D5' }}>
          + New event
        </button>
      </div>

      {/* Google Calendar connect / sync bar */}
      <div className="bg-white rounded-2xl border p-4 mb-5 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: '#EDE8E3' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F3EFFC' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>Google Calendar</p>
            {googleConn
              ? <p className="text-xs" style={{ color: '#9CA3AF' }}>Connected{googleConn.email ? ` as ${googleConn.email}` : ''}</p>
              : <p className="text-xs" style={{ color: '#9CA3AF' }}>Not connected</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {syncMsg && (
            <p className="text-xs px-3 py-1.5 rounded-xl" style={{ background: syncMsg.includes('failed') || syncMsg.includes('error') ? '#FEF2F2' : '#F0F7EE', color: syncMsg.includes('failed') || syncMsg.includes('error') ? '#DC2626' : '#166534' }}>
              {syncMsg}
            </p>
          )}
          {googleConn && (
            <button onClick={syncGoogle} disabled={syncing} className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-60"
              style={{ borderColor: '#4285F4', color: '#4285F4' }}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          )}
          <a href="/api/google/connect" className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity"
            style={{ background: '#4285F4' }}>
            {googleConn ? 'Reconnect' : 'Connect Google Calendar'}
          </a>
        </div>
      </div>

      {/* Event legend */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: '#9CA3AF' }}>{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#EDE8E3' }}>
          <p className="font-medium mb-4" style={{ color: '#374151' }}>New event</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input type="text" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Event title" className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <select value={newEvent.event_type} onChange={e => setNewEvent({ ...newEvent, event_type: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
              {EVENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Location (optional)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="datetime-local" value={newEvent.start_at} onChange={e => setNewEvent({ ...newEvent, start_at: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="datetime-local" value={newEvent.end_at} onChange={e => setNewEvent({ ...newEvent, end_at: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addEvent} disabled={loading || !newEvent.title} className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#C4B5D5' }}>Save event</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ color: '#9CA3AF' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-xl" style={{ background: '#FDF8F5' }}>‹</button>
            <h2 className="font-semibold" style={{ color: '#374151' }}>{format(viewDate, 'MMMM yyyy')}</h2>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-xl" style={{ background: '#FDF8F5' }}>›</button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-medium py-2" style={{ color: '#9CA3AF' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayEvents = events.filter(e => isSameDay(parseISO(e.start_at), day))
              const isSelected = isSameDay(day, selectedDate)
              const isToday = isSameDay(day, new Date())
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl p-1 transition-colors"
                  style={{ background: isSelected ? '#C4B5D5' : isToday ? '#F3EEF9' : 'transparent' }}>
                  <span className="text-sm" style={{ color: isSelected ? 'white' : isToday ? '#A08EC0' : '#374151', fontWeight: isToday ? 600 : 400 }}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e.id} className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: isSelected ? 'white' : (EVENT_COLORS[e.event_type ?? 'personal'] ?? '#C4B5D5') }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        <div>
          <p className="font-medium mb-3" style={{ color: '#374151' }}>{format(selectedDate, 'EEEE, MMM d')}</p>
          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl border" style={{ borderColor: '#EDE8E3' }}>
              <p className="text-2xl mb-2">📅</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No events this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map(ev => {
                const color = EVENT_COLORS[ev.event_type ?? 'personal'] ?? '#C4B5D5'
                const isGoogle = ev.source === 'google'
                return (
                  <div key={ev.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#EDE8E3', borderLeft: `4px solid ${color}` }}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isGoogle && (
                            <svg viewBox="0 0 24 24" className="w-3 h-3 flex-shrink-0">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          )}
                          <p className="font-medium text-sm truncate" style={{ color: '#374151' }}>{ev.title}</p>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          {ev.all_day ? 'All day' : format(parseISO(ev.start_at), 'h:mm a')}
                          {ev.location && ` · ${ev.location}`}
                        </p>
                      </div>
                      {!isGoogle && (
                        <button onClick={() => deleteEvent(ev.id)} className="text-xs p-1 rounded flex-shrink-0" style={{ color: '#D1D5DB' }}>✕</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
