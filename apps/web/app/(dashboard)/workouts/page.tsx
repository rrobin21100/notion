'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

const WORKOUT_TYPES = ['strength', 'cardio', 'yoga', 'hiit', 'pilates', 'sport', 'other']
const TYPE_ICONS: Record<string, string> = { strength: '🏋️', cardio: '🏃', yoga: '🧘', hiit: '⚡', pilates: '🤸', sport: '⚽', other: '💪' }

export default function WorkoutsPage() {
  const supabase = createClient()
  const [workouts, setWorkouts] = useState<{
    id: string; name: string; type: string | null; duration_minutes: number | null; calories_burned: number | null; performed_at: string; notes: string | null
  }[]>([])
  const [exercises, setExercises] = useState<{
    id: string; workout_id: string; exercise_name: string; sets: number | null; reps: number | null; weight_lbs: number | null; duration_seconds: number | null
  }[]>([])
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newWorkout, setNewWorkout] = useState({ name: '', type: 'strength', duration_minutes: '', calories_burned: '', notes: '', performed_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
  const [newEx, setNewEx] = useState({ exercise_name: '', sets: '', reps: '', weight_lbs: '', duration_seconds: '' })
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [woData, exData] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', user.id).order('performed_at', { ascending: false }).limit(30),
      supabase.from('workout_exercises').select('*').order('workout_id'),
    ])
    if (woData.data) {
      setWorkouts(woData.data)
      if (!selectedWorkoutId && woData.data.length > 0) setSelectedWorkoutId(woData.data[0].id)
    }
    if (exData.data) setExercises(exData.data)
  }, [supabase, selectedWorkoutId])

  useEffect(() => { loadData() }, [loadData])

  async function addWorkout() {
    if (!newWorkout.name.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('workouts').insert({
      user_id: user.id,
      name: newWorkout.name,
      type: newWorkout.type,
      duration_minutes: newWorkout.duration_minutes ? parseInt(newWorkout.duration_minutes) : null,
      calories_burned: newWorkout.calories_burned ? parseInt(newWorkout.calories_burned) : null,
      notes: newWorkout.notes || null,
      performed_at: newWorkout.performed_at,
    }).select().single()
    if (data) setSelectedWorkoutId(data.id)
    setNewWorkout({ name: '', type: 'strength', duration_minutes: '', calories_burned: '', notes: '', performed_at: format(new Date(), "yyyy-MM-dd'T'HH:mm") })
    setShowForm(false)
    await loadData()
    setLoading(false)
  }

  async function addExercise() {
    if (!newEx.exercise_name.trim() || !selectedWorkoutId) return
    await supabase.from('workout_exercises').insert({
      workout_id: selectedWorkoutId,
      exercise_name: newEx.exercise_name,
      sets: newEx.sets ? parseInt(newEx.sets) : null,
      reps: newEx.reps ? parseInt(newEx.reps) : null,
      weight_lbs: newEx.weight_lbs ? parseFloat(newEx.weight_lbs) : null,
      duration_seconds: newEx.duration_seconds ? parseInt(newEx.duration_seconds) : null,
    })
    setNewEx({ exercise_name: '', sets: '', reps: '', weight_lbs: '', duration_seconds: '' })
    await loadData()
  }

  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId)
  const selectedExercises = exercises.filter(e => e.workout_id === selectedWorkoutId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Workouts</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#F4A261' }}>
          + Log workout
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#EDE8E3' }}>
          <p className="font-medium mb-4" style={{ color: '#374151' }}>New workout</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <input type="text" value={newWorkout.name} onChange={e => setNewWorkout({ ...newWorkout, name: e.target.value })} placeholder="Workout name" className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <select value={newWorkout.type} onChange={e => setNewWorkout({ ...newWorkout, type: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
              {WORKOUT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <input type="number" value={newWorkout.duration_minutes} onChange={e => setNewWorkout({ ...newWorkout, duration_minutes: e.target.value })} placeholder="Duration (min)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="number" value={newWorkout.calories_burned} onChange={e => setNewWorkout({ ...newWorkout, calories_burned: e.target.value })} placeholder="Calories burned" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="datetime-local" value={newWorkout.performed_at} onChange={e => setNewWorkout({ ...newWorkout, performed_at: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <textarea value={newWorkout.notes} onChange={e => setNewWorkout({ ...newWorkout, notes: e.target.value })} placeholder="Notes" rows={2} className="col-span-3 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addWorkout} disabled={loading || !newWorkout.name} className="px-5 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#F4A261' }}>Save workout</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ color: '#9CA3AF' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workout list */}
        <div className="space-y-2">
          {workouts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: '#EDE8E3' }}>
              <p className="text-3xl mb-2">🏋️</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No workouts yet. Log your first!</p>
            </div>
          ) : workouts.map(wo => (
            <button key={wo.id} onClick={() => setSelectedWorkoutId(wo.id)} className="w-full text-left bg-white rounded-2xl border p-4 transition-all"
              style={{ borderColor: selectedWorkoutId === wo.id ? '#F4A261' : '#EDE8E3' }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TYPE_ICONS[wo.type ?? 'other'] ?? '💪'}</span>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#374151' }}>{wo.name}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {format(new Date(wo.performed_at), 'MMM d')}
                    {wo.duration_minutes && ` · ${wo.duration_minutes} min`}
                    {wo.calories_burned && ` · ${wo.calories_burned} cal`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Workout detail */}
        <div className="lg:col-span-2">
          {selectedWorkout ? (
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#EDE8E3' }}>
              <div className="flex items-start gap-4 mb-6">
                <span className="text-4xl">{TYPE_ICONS[selectedWorkout.type ?? 'other'] ?? '💪'}</span>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#374151' }}>{selectedWorkout.name}</h2>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                    <span>{format(new Date(selectedWorkout.performed_at), 'EEEE, MMM d · h:mm a')}</span>
                    {selectedWorkout.duration_minutes && <span>⏱ {selectedWorkout.duration_minutes} min</span>}
                    {selectedWorkout.calories_burned && <span>🔥 {selectedWorkout.calories_burned} cal</span>}
                  </div>
                  {selectedWorkout.notes && <p className="text-sm mt-2" style={{ color: '#6B7280' }}>{selectedWorkout.notes}</p>}
                </div>
              </div>

              {/* Add exercise */}
              <p className="font-medium text-sm mb-3" style={{ color: '#374151' }}>Exercises ({selectedExercises.length})</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                <input type="text" value={newEx.exercise_name} onChange={e => setNewEx({ ...newEx, exercise_name: e.target.value })} placeholder="Exercise name" className="col-span-2 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="number" value={newEx.sets} onChange={e => setNewEx({ ...newEx, sets: e.target.value })} placeholder="Sets" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="number" value={newEx.reps} onChange={e => setNewEx({ ...newEx, reps: e.target.value })} placeholder="Reps" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="number" value={newEx.weight_lbs} onChange={e => setNewEx({ ...newEx, weight_lbs: e.target.value })} placeholder="lbs" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              </div>
              <button onClick={addExercise} disabled={!newEx.exercise_name} className="px-4 py-2 rounded-xl text-sm font-medium text-white mb-4 disabled:opacity-60" style={{ background: '#F4A261' }}>
                Add exercise
              </button>

              <div className="space-y-2">
                {selectedExercises.length === 0 && <p className="text-sm" style={{ color: '#9CA3AF' }}>No exercises logged yet.</p>}
                {selectedExercises.map(ex => (
                  <div key={ex.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#FEF4EC' }}>
                    <p className="font-medium text-sm" style={{ color: '#374151' }}>{ex.exercise_name}</p>
                    <div className="flex gap-3 text-xs" style={{ color: '#9CA3AF' }}>
                      {ex.sets && <span>{ex.sets} sets</span>}
                      {ex.reps && <span>{ex.reps} reps</span>}
                      {ex.weight_lbs && <span>{ex.weight_lbs} lbs</span>}
                      {ex.duration_seconds && <span>{ex.duration_seconds}s</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
              <p className="text-4xl mb-3">🏋️</p>
              <p>Select a workout to see exercises</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
