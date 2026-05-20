'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isSameMonth } from 'date-fns'

const EVENT_TYPES = ['personal', 'appointment', 'medical', 'fitness', 'home', 'reminder']
const EVENT_COLORS: Record<string, string> = {
  personal: '#C4B5D5',
  appointment: '#7BC8E2',
  medical: '#F4A261',
  fitness: '#A8C5A0',
  home: '#CDB4DB',
  reminder: '#F5C842',
}

export default function CalendarPage() {
  const supabase = createClient()
  const [viewDate, setViewDate] = useState(new Date())
  const [events, setEvents] = useState<{
    id: string; title: string; event_type: string | null; start_at: string; end_at: string | null; location: string | null; all_day: boolean
  }[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '', event_type: 'personal', start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_at: '', location: '', all_day: false,
  })
  const [loading, setLoading] = useState(false)

  const loadEvents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const monthStart = format(startOfMonth(viewDate), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(viewDate), 'yyyy-MM-dd')
    const { data } = await supabase.from('events').select('*').eq('user_id', user.id)
      .gte('start_at', monthStart).lte('start_at', monthEnd + 'T23:59:59').order('start_at')
    if (data) setEvents(data)
  }, [supabase, viewDate])

  useEffect(() => { loadEvents() }, [loadEvents])

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
    })
    setNewEvent({ title: '', event_type: 'personal', start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"), end_at: '', location: '', all_day: false })
    setShowForm(false)
    await loadEvents()
    setLoading(false)
  }

  async function deleteEvent(id: string) {
    await supabase.from('events').delete().eq('id', id)
    await loadEvents()
  }

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const selectedDayEvents = events.filter(e => isSameDay(parseISO(e.start_at), selectedDate))
  const firstDayOfWeek = startOfMonth(viewDate).getDay()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Calendar</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#C4B5D5' }}>
          + New event
        </button>
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
            <input type="datetime-local" value={newEvent.end_at} onChange={e => setNewEvent({ ...newEvent, end_at: e.target.value })} placeholder="End time (optional)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
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
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1))} className="p-2 rounded-xl" style={{ background: '#FDF8F5' }}>‹</button>
            <h2 className="font-semibold" style={{ color: '#374151' }}>{format(viewDate, 'MMMM yyyy')}</h2>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1))} className="p-2 rounded-xl" style={{ background: '#FDF8F5' }}>›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-xs font-medium py-2" style={{ color: '#9CA3AF' }}>{d}</div>
            ))}
          </div>

          {/* Day grid */}
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
                  <span className="text-sm" style={{ color: isSelected ? 'white' : isToday ? '#A08EC0' : '#374151', fontWeight: isToday ? '600' : '400' }}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'white' : (EVENT_COLORS[e.event_type ?? 'personal'] ?? '#C4B5D5') }} />
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
              {selectedDayEvents.map(ev => (
                <div key={ev.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#EDE8E3', borderLeft: `4px solid ${EVENT_COLORS[ev.event_type ?? 'personal'] ?? '#C4B5D5'}` }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>{ev.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {ev.all_day ? 'All day' : format(parseISO(ev.start_at), 'h:mm a')}
                        {ev.location && ` · ${ev.location}`}
                      </p>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="text-xs p-1 rounded" style={{ color: '#D1D5DB' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
