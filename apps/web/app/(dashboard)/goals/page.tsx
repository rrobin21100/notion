'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const GOAL_CATEGORIES = ['Health', 'Fitness', 'Finance', 'Career', 'Education', 'Personal', 'Travel', 'Relationships', 'Home', 'Hobbies']

export default function GoalsPage() {
  const supabase = createClient()
  const [goals, setGoals] = useState<{
    id: string; title: string; description: string | null; category: string | null; target_date: string | null; progress_percent: number; status: string
  }[]>([])
  const [milestones, setMilestones] = useState<{ id: string; goal_id: string; title: string; completed: boolean }[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: '', target_date: '' })
  const [newMilestone, setNewMilestone] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [goalsData, msData] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('goal_milestones').select('*').order('goal_id'),
    ])
    if (goalsData.data) {
      setGoals(goalsData.data)
      if (!selectedGoalId && goalsData.data.length > 0) setSelectedGoalId(goalsData.data[0].id)
    }
    if (msData.data) setMilestones(msData.data)
  }, [supabase, selectedGoalId])

  useEffect(() => { loadData() }, [loadData])

  async function addGoal() {
    if (!newGoal.title.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('goals').insert({
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description || null,
      category: newGoal.category || null,
      target_date: newGoal.target_date || null,
    }).select().single()
    if (data) setSelectedGoalId(data.id)
    setNewGoal({ title: '', description: '', category: '', target_date: '' })
    setShowForm(false)
    await loadData()
    setLoading(false)
  }

  async function addMilestone() {
    if (!newMilestone.trim() || !selectedGoalId) return
    await supabase.from('goal_milestones').insert({ goal_id: selectedGoalId, title: newMilestone.trim() })
    setNewMilestone('')
    await loadData()
  }

  async function toggleMilestone(id: string, completed: boolean) {
    await supabase.from('goal_milestones').update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null }).eq('id', id)
    // Update progress on goal
    if (selectedGoalId) {
      const goalMs = milestones.filter(m => m.goal_id === selectedGoalId)
      const doneCount = goalMs.filter(m => m.id === id ? !completed : m.completed).length
      const pct = goalMs.length > 0 ? Math.round((doneCount / goalMs.length) * 100) : 0
      await supabase.from('goals').update({ progress_percent: pct }).eq('id', selectedGoalId)
    }
    await loadData()
  }

  async function updateProgress(goalId: string, pct: number) {
    await supabase.from('goals').update({ progress_percent: pct }).eq('id', goalId)
    await loadData()
  }

  async function completeGoal(goalId: string) {
    await supabase.from('goals').update({ status: 'completed', progress_percent: 100 }).eq('id', goalId)
    await loadData()
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const selectedGoal = goals.find(g => g.id === selectedGoalId)
  const selectedMilestones = milestones.filter(m => m.goal_id === selectedGoalId)

  const statusColor = (status: string) => status === 'completed' ? '#A8C5A0' : '#FFB3C1'

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Goals</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#FFB3C1', color: '#374151' }}>
          + New goal
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{activeGoals.length} active · {completedGoals.length} completed</p>

      {showForm && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#EDE8E3' }}>
          <p className="font-medium mb-4" style={{ color: '#374151' }}>New goal</p>
          <div className="space-y-3 mb-4">
            <input type="text" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Goal title" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <textarea value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <div className="grid grid-cols-2 gap-3">
              <select value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
                <option value="">Category</option>
                {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={newGoal.target_date} onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addGoal} disabled={loading || !newGoal.title} className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: '#FFB3C1', color: '#374151' }}>Create goal</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ color: '#9CA3AF' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals list */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Active ({activeGoals.length})</p>
          <div className="space-y-2 mb-6">
            {activeGoals.map(goal => (
              <button key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className="w-full text-left bg-white rounded-2xl border p-4 transition-all" style={{ borderColor: selectedGoalId === goal.id ? '#FFB3C1' : '#EDE8E3' }}>
                <p className="font-medium text-sm mb-1" style={{ color: '#374151' }}>{goal.title}</p>
                {goal.category && <span className="text-xs px-2 py-0.5 rounded-full mr-2" style={{ background: '#FEF0F4', color: '#E06C89' }}>{goal.category}</span>}
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                  <div className="h-full rounded-full" style={{ width: `${goal.progress_percent}%`, background: '#FFB3C1' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{goal.progress_percent}% complete</p>
              </button>
            ))}
          </div>
          {completedGoals.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Completed ({completedGoals.length})</p>
              <div className="space-y-2 opacity-60">
                {completedGoals.map(goal => (
                  <div key={goal.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#EDE8E3' }}>
                    <p className="font-medium text-sm line-through" style={{ color: '#9CA3AF' }}>{goal.title}</p>
                    <span className="text-xs" style={{ color: '#A8C5A0' }}>✓ Completed</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Goal detail */}
        <div className="lg:col-span-2">
          {selectedGoal ? (
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#EDE8E3' }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#374151' }}>{selectedGoal.title}</h2>
                  {selectedGoal.description && <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{selectedGoal.description}</p>}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedGoal.category && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF0F4', color: '#E06C89' }}>{selectedGoal.category}</span>}
                    {selectedGoal.target_date && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>🎯 {selectedGoal.target_date}</span>}
                  </div>
                </div>
                {selectedGoal.status === 'active' && (
                  <button onClick={() => completeGoal(selectedGoal.id)} className="text-xs px-3 py-1.5 rounded-xl border" style={{ borderColor: '#A8C5A0', color: '#A8C5A0' }}>
                    Mark complete
                  </button>
                )}
              </div>

              {/* Progress slider */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>Progress</span>
                  <span className="text-sm font-bold" style={{ color: '#FFB3C1' }}>{selectedGoal.progress_percent}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={selectedGoal.progress_percent}
                  onChange={e => updateProgress(selectedGoal.id, parseInt(e.target.value))}
                  className="w-full accent-pink-300"
                />
              </div>

              {/* Milestones */}
              <div>
                <p className="font-medium text-sm mb-3" style={{ color: '#374151' }}>
                  Milestones ({selectedMilestones.filter(m => m.completed).length}/{selectedMilestones.length})
                </p>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMilestone()} placeholder="Add a milestone…" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                  <button onClick={addMilestone} disabled={!newMilestone} className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: '#FFB3C1', color: '#374151' }}>Add</button>
                </div>
                <div className="space-y-2">
                  {selectedMilestones.length === 0 && <p className="text-sm" style={{ color: '#9CA3AF' }}>No milestones yet. Break this goal into steps.</p>}
                  {selectedMilestones.map(ms => (
                    <div key={ms.id} className="flex items-center gap-3 py-2">
                      <button onClick={() => toggleMilestone(ms.id, ms.completed)} className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: ms.completed ? '#FFB3C1' : '#EDE8E3', background: ms.completed ? '#FFB3C1' : 'transparent' }}>
                        {ms.completed && <span className="text-white text-xs">✓</span>}
                      </button>
                      <span className="text-sm" style={{ color: '#374151', textDecoration: ms.completed ? 'line-through' : 'none', opacity: ms.completed ? 0.6 : 1 }}>
                        {ms.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
              <p className="text-4xl mb-3">🎯</p>
              <p>Select a goal to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
