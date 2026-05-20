'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfWeek, addDays } from 'date-fns'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

export default function MealsPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'planner' | 'log'>('planner')
  const [weekStart, setWeekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  const [planEntries, setPlanEntries] = useState<{
    id: string; plan_id: string; day_of_week: number; meal_type: string; recipe_name: string; calories: number | null
  }[]>([])
  const [planId, setPlanId] = useState<string | null>(null)
  const [nutritionLogs, setNutritionLogs] = useState<{
    id: string; food_name: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; meal_type: string | null; logged_at: string
  }[]>([])
  const [editCell, setEditCell] = useState<{ day: number; meal: string } | null>(null)
  const [cellValue, setCellValue] = useState('')
  const [newLog, setNewLog] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', meal_type: 'breakfast' })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let currentPlanId = planId
    if (!currentPlanId) {
      const { data: existing } = await supabase.from('meal_plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).single()
      if (existing) {
        currentPlanId = existing.id
        setPlanId(existing.id)
      } else {
        const { data: created } = await supabase.from('meal_plans').insert({ user_id: user.id, week_start: weekStart }).select('id').single()
        if (created) {
          currentPlanId = created.id
          setPlanId(created.id)
        }
      }
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const [entriesData, logsData] = await Promise.all([
      currentPlanId ? supabase.from('meal_plan_entries').select('*').eq('plan_id', currentPlanId) : Promise.resolve({ data: [] }),
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', todayStr).order('logged_at', { ascending: false }),
    ])
    if (entriesData.data) setPlanEntries(entriesData.data)
    if (logsData.data) setNutritionLogs(logsData.data)
  }, [supabase, weekStart, planId])

  useEffect(() => { loadData() }, [loadData])

  async function saveCell(day: number, meal: string, value: string) {
    if (!planId) return
    const existing = planEntries.find(e => e.plan_id === planId && e.day_of_week === day && e.meal_type === meal)
    if (existing) {
      if (value.trim()) {
        await supabase.from('meal_plan_entries').update({ recipe_name: value }).eq('id', existing.id)
      } else {
        await supabase.from('meal_plan_entries').delete().eq('id', existing.id)
      }
    } else if (value.trim()) {
      await supabase.from('meal_plan_entries').insert({ plan_id: planId, day_of_week: day, meal_type: meal, recipe_name: value })
    }
    setEditCell(null)
    setCellValue('')
    await loadData()
  }

  async function logFood() {
    if (!newLog.food_name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('nutrition_logs').insert({
      user_id: user.id,
      food_name: newLog.food_name,
      calories: newLog.calories ? parseInt(newLog.calories) : null,
      protein_g: newLog.protein_g ? parseFloat(newLog.protein_g) : null,
      carbs_g: newLog.carbs_g ? parseFloat(newLog.carbs_g) : null,
      fat_g: newLog.fat_g ? parseFloat(newLog.fat_g) : null,
      meal_type: newLog.meal_type,
    })
    setNewLog({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', meal_type: 'breakfast' })
    await loadData()
  }

  function getEntry(day: number, meal: string) {
    return planEntries.find(e => e.day_of_week === day && e.meal_type === meal)
  }

  const todayCalories = nutritionLogs.reduce((s, l) => s + (l.calories ?? 0), 0)
  const todayProtein = nutritionLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0)
  const todayCarbs = nutritionLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0)
  const todayFat = nutritionLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#374151' }}>Meals</h1>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Weekly meal planner and nutrition tracking</p>

      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border inline-flex" style={{ borderColor: '#EDE8E3' }}>
        {(['planner', 'log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={{ background: tab === t ? '#95D5B2' : 'transparent', color: tab === t ? '#374151' : '#6B7280' }}>
            {t === 'planner' ? '📅 Meal Planner' : '📊 Nutrition Log'}
          </button>
        ))}
      </div>

      {tab === 'planner' && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => { setPlanId(null); setWeekStart(format(addDays(new Date(weekStart), -7), 'yyyy-MM-dd')) }} className="px-3 py-1.5 rounded-xl text-sm border" style={{ borderColor: '#EDE8E3' }}>‹ Prev</button>
            <span className="font-medium text-sm" style={{ color: '#374151' }}>Week of {format(new Date(weekStart + 'T12:00:00'), 'MMM d, yyyy')}</span>
            <button onClick={() => { setPlanId(null); setWeekStart(format(addDays(new Date(weekStart), 7), 'yyyy-MM-dd')) }} className="px-3 py-1.5 rounded-xl text-sm border" style={{ borderColor: '#EDE8E3' }}>Next ›</button>
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#EDE8E3' }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#FDF8F5' }}>
                    <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#9CA3AF', width: '100px' }}>Meal</th>
                    {DAYS.map(d => <th key={d} className="text-center px-3 py-3 text-xs font-semibold" style={{ color: '#9CA3AF' }}>{d.slice(0, 3)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_TYPES.map(meal => (
                    <tr key={meal} style={{ borderTop: '1px solid #EDE8E3' }}>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: '#374151' }}>
                        {MEAL_ICONS[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                      </td>
                      {DAYS.map((_, dayIdx) => {
                        const entry = getEntry(dayIdx, meal)
                        const isEditing = editCell?.day === dayIdx && editCell?.meal === meal
                        return (
                          <td key={dayIdx} className="px-2 py-2 text-center">
                            {isEditing ? (
                              <input
                                autoFocus
                                type="text"
                                value={cellValue}
                                onChange={e => setCellValue(e.target.value)}
                                onBlur={() => saveCell(dayIdx, meal, cellValue)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveCell(dayIdx, meal, cellValue)
                                  if (e.key === 'Escape') { setEditCell(null); setCellValue('') }
                                }}
                                className="w-full px-2 py-1 rounded-lg border text-xs outline-none text-center"
                                style={{ borderColor: '#95D5B2' }}
                              />
                            ) : (
                              <button
                                onClick={() => { setEditCell({ day: dayIdx, meal }); setCellValue(entry?.recipe_name ?? '') }}
                                className="w-full px-2 py-1.5 rounded-lg text-xs transition-colors min-h-[32px]"
                                style={{ background: entry ? '#EDFBF3' : '#FAFAFA', color: entry ? '#374151' : '#C8C8C8' }}
                              >
                                {entry?.recipe_name ?? '+'}
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-6">
          {/* Macro summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: `${Math.round(todayCalories)}`, unit: 'kcal', color: '#E8856A' },
              { label: 'Protein', value: `${Math.round(todayProtein)}`, unit: 'g', color: '#A8C5A0' },
              { label: 'Carbs', value: `${Math.round(todayCarbs)}`, unit: 'g', color: '#F5C842' },
              { label: 'Fat', value: `${Math.round(todayFat)}`, unit: 'g', color: '#F4A261' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border p-3 text-center" style={{ borderColor: '#EDE8E3' }}>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}<span className="text-xs font-normal ml-0.5">{s.unit}</span></p>
              </div>
            ))}
          </div>

          {/* Log food */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Log food</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <input type="text" value={newLog.food_name} onChange={e => setNewLog({ ...newLog, food_name: e.target.value })} placeholder="Food name" className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <select value={newLog.meal_type} onChange={e => setNewLog({ ...newLog, meal_type: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
                {MEAL_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input type="number" value={newLog.calories} onChange={e => setNewLog({ ...newLog, calories: e.target.value })} placeholder="Calories" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLog.protein_g} onChange={e => setNewLog({ ...newLog, protein_g: e.target.value })} placeholder="Protein (g)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLog.carbs_g} onChange={e => setNewLog({ ...newLog, carbs_g: e.target.value })} placeholder="Carbs (g)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLog.fat_g} onChange={e => setNewLog({ ...newLog, fat_g: e.target.value })} placeholder="Fat (g)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={logFood} disabled={!newLog.food_name} className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: '#95D5B2', color: '#374151' }}>Log food</button>
          </div>

          {/* Today's log */}
          <div className="space-y-2">
            {nutritionLogs.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No food logged today.</p>}
            {nutritionLogs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: '#EDE8E3' }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#374151' }}>{log.food_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {MEAL_ICONS[log.meal_type ?? 'breakfast']} {log.meal_type}
                    {log.protein_g && ` · ${log.protein_g}g protein`}
                    {log.carbs_g && ` · ${log.carbs_g}g carbs`}
                    {log.fat_g && ` · ${log.fat_g}g fat`}
                  </p>
                </div>
                {log.calories && <p className="font-bold text-sm" style={{ color: '#E8856A' }}>{log.calories} kcal</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
