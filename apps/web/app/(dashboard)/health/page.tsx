'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const WATER_GOAL_OZ = 64
const QUICK_AMOUNTS = [8, 12, 16, 20]

export default function HealthPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'water' | 'medications' | 'supplements' | 'labs'>('water')

  // Water state
  const [waterToday, setWaterToday] = useState(0)
  const [waterLogs, setWaterLogs] = useState<{ id: string; amount_oz: number; logged_at: string }[]>([])
  const [customOz, setCustomOz] = useState('')
  const [waterLoading, setWaterLoading] = useState(false)

  // Medications state
  const [medications, setMedications] = useState<{
    id: string; name: string; dosage: string | null; frequency: string | null; active: boolean
  }[]>([])
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('')
  const [newMedFreq, setNewMedFreq] = useState('daily')
  const [medLoading, setMedLoading] = useState(false)

  // Supplements state
  const [supplements, setSupplements] = useState<{
    id: string; name: string; dosage: string | null; frequency: string | null; active: boolean
  }[]>([])
  const [newSupName, setNewSupName] = useState('')
  const [newSupDosage, setNewSupDosage] = useState('')
  const [supLoading, setSupLoading] = useState(false)

  // Lab results state
  const [labResults, setLabResults] = useState<{
    id: string; test_name: string; value: number | null; unit: string | null; tested_at: string; reference_min: number | null; reference_max: number | null
  }[]>([])
  const [newLab, setNewLab] = useState({ test_name: '', value: '', unit: '', tested_at: new Date().toISOString().split('T')[0], reference_min: '', reference_max: '' })
  const [labLoading, setLabLoading] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [waterData, medData, supData, labData] = await Promise.all([
      supabase.from('water_logs').select('*').eq('user_id', user.id).gte('logged_at', todayStr).order('logged_at', { ascending: false }),
      supabase.from('medications').select('*').eq('user_id', user.id).eq('active', true).order('name'),
      supabase.from('supplements').select('*').eq('user_id', user.id).eq('active', true).order('name'),
      supabase.from('lab_results').select('*').eq('user_id', user.id).order('tested_at', { ascending: false }).limit(20),
    ])

    if (waterData.data) {
      setWaterLogs(waterData.data)
      setWaterToday(waterData.data.reduce((s, l) => s + l.amount_oz, 0))
    }
    if (medData.data) setMedications(medData.data)
    if (supData.data) setSupplements(supData.data)
    if (labData.data) setLabResults(labData.data)
  }, [supabase, todayStr])

  useEffect(() => { loadData() }, [loadData])

  async function logWater(oz: number) {
    setWaterLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('water_logs').insert({ user_id: user.id, amount_oz: oz })
    await loadData()
    setCustomOz('')
    setWaterLoading(false)
  }

  async function addMedication() {
    if (!newMedName.trim()) return
    setMedLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('medications').insert({
      user_id: user.id,
      name: newMedName.trim(),
      dosage: newMedDosage || null,
      frequency: newMedFreq,
    })
    setNewMedName('')
    setNewMedDosage('')
    await loadData()
    setMedLoading(false)
  }

  async function toggleMedication(id: string, active: boolean) {
    await supabase.from('medications').update({ active: !active }).eq('id', id)
    await loadData()
  }

  async function addSupplement() {
    if (!newSupName.trim()) return
    setSupLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('supplements').insert({
      user_id: user.id,
      name: newSupName.trim(),
      dosage: newSupDosage || null,
      frequency: 'daily',
    })
    setNewSupName('')
    setNewSupDosage('')
    await loadData()
    setSupLoading(false)
  }

  async function addLabResult() {
    if (!newLab.test_name.trim() || !newLab.tested_at) return
    setLabLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('lab_results').insert({
      user_id: user.id,
      test_name: newLab.test_name,
      value: newLab.value ? parseFloat(newLab.value) : null,
      unit: newLab.unit || null,
      tested_at: newLab.tested_at,
      reference_min: newLab.reference_min ? parseFloat(newLab.reference_min) : null,
      reference_max: newLab.reference_max ? parseFloat(newLab.reference_max) : null,
    })
    setNewLab({ test_name: '', value: '', unit: '', tested_at: todayStr, reference_min: '', reference_max: '' })
    await loadData()
    setLabLoading(false)
  }

  const waterPercent = Math.min((waterToday / WATER_GOAL_OZ) * 100, 100)

  const tabs = [
    { id: 'water', label: '💧 Water' },
    { id: 'medications', label: '💊 Meds' },
    { id: 'supplements', label: '🌿 Supps' },
    { id: 'labs', label: '🧪 Labs' },
  ] as const

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#374151' }}>Health</h1>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Track medications, supplements, water intake, and lab results</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border inline-flex" style={{ borderColor: '#EDE8E3' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === t.id ? '#A8C5A0' : 'transparent',
              color: tab === t.id ? 'white' : '#6B7280',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Water Tab */}
      {tab === 'water' && (
        <div className="space-y-6">
          {/* Progress ring */}
          <div className="bg-white rounded-2xl border p-6 flex items-center gap-6" style={{ borderColor: '#EDE8E3' }}>
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#EDE8E3" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#7BC8E2" strokeWidth="8"
                  strokeDasharray={`${waterPercent * 2.513} 251.3`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold" style={{ color: '#7BC8E2' }}>{Math.round(waterToday)}</span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>oz</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: '#374151' }}>{Math.round(waterToday)} / {WATER_GOAL_OZ} oz</p>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>{waterPercent >= 100 ? 'Goal reached! 🎉' : `${WATER_GOAL_OZ - Math.round(waterToday)} oz to go`}</p>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#EDE8E3', width: '200px' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${waterPercent}%`, background: '#7BC8E2' }} />
              </div>
            </div>
          </div>

          {/* Quick log buttons */}
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: '#374151' }}>Quick log</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map(oz => (
                <button
                  key={oz}
                  onClick={() => logWater(oz)}
                  disabled={waterLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-60"
                  style={{ borderColor: '#7BC8E2', color: '#7BC8E2', background: '#F0FBFF' }}
                >
                  +{oz} oz
                </button>
              ))}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customOz}
                  onChange={e => setCustomOz(e.target.value)}
                  placeholder="Custom oz"
                  className="w-28 px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
                />
                <button
                  onClick={() => customOz && logWater(parseFloat(customOz))}
                  disabled={!customOz || waterLoading}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: '#7BC8E2' }}
                >
                  Log
                </button>
              </div>
            </div>
          </div>

          {/* Today's log */}
          {waterLogs.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: '#374151' }}>Today's log</p>
              <div className="space-y-2">
                {waterLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between bg-white rounded-xl border px-4 py-3" style={{ borderColor: '#EDE8E3' }}>
                    <span className="text-sm" style={{ color: '#374151' }}>💧 {log.amount_oz} oz</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>
                      {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Medications Tab */}
      {tab === 'medications' && (
        <div className="space-y-6">
          {/* Add form */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add medication</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                value={newMedName}
                onChange={e => setNewMedName(e.target.value)}
                placeholder="Medication name"
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
              <input
                type="text"
                value={newMedDosage}
                onChange={e => setNewMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 10mg)"
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
              <select
                value={newMedFreq}
                onChange={e => setNewMedFreq(e.target.value)}
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              >
                <option value="daily">Daily</option>
                <option value="twice_daily">Twice daily</option>
                <option value="three_times_daily">3x daily</option>
                <option value="weekly">Weekly</option>
                <option value="as_needed">As needed</option>
              </select>
            </div>
            <button
              onClick={addMedication}
              disabled={medLoading || !newMedName}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#A8C5A0' }}
            >
              Add medication
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {medications.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No active medications. Add one above.</p>
            )}
            {medications.map(med => (
              <div key={med.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: '#EDE8E3' }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#374151' }}>{med.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {med.dosage && `${med.dosage} · `}{med.frequency?.replace(/_/g, ' ')}
                  </p>
                </div>
                <button
                  onClick={() => toggleMedication(med.id, med.active)}
                  className="text-xs px-3 py-1.5 rounded-lg border"
                  style={{ borderColor: '#EDE8E3', color: '#9CA3AF' }}
                >
                  Deactivate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplements Tab */}
      {tab === 'supplements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add supplement</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                value={newSupName}
                onChange={e => setNewSupName(e.target.value)}
                placeholder="Supplement name (e.g. Vitamin D)"
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
              <input
                type="text"
                value={newSupDosage}
                onChange={e => setNewSupDosage(e.target.value)}
                placeholder="Dosage (e.g. 2000 IU)"
                className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}
              />
            </div>
            <button
              onClick={addSupplement}
              disabled={supLoading || !newSupName}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#A8C5A0' }}
            >
              Add supplement
            </button>
          </div>

          <div className="space-y-2">
            {supplements.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No supplements yet. Add one above.</p>
            )}
            {supplements.map(sup => (
              <div key={sup.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: '#EDE8E3' }}>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#374151' }}>🌿 {sup.name}</p>
                  {sup.dosage && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sup.dosage}</p>}
                </div>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: '#F0F7EE', color: '#A8C5A0' }}>Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Results Tab */}
      {tab === 'labs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add lab result</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <input type="text" value={newLab.test_name} onChange={e => setNewLab({ ...newLab, test_name: e.target.value })} placeholder="Test name (e.g. Glucose)" className="px-3 py-2.5 rounded-xl border text-sm outline-none col-span-2 sm:col-span-1" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLab.value} onChange={e => setNewLab({ ...newLab, value: e.target.value })} placeholder="Value" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newLab.unit} onChange={e => setNewLab({ ...newLab, unit: e.target.value })} placeholder="Unit (e.g. mg/dL)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLab.reference_min} onChange={e => setNewLab({ ...newLab, reference_min: e.target.value })} placeholder="Ref min" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newLab.reference_max} onChange={e => setNewLab({ ...newLab, reference_max: e.target.value })} placeholder="Ref max" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="date" value={newLab.tested_at} onChange={e => setNewLab({ ...newLab, tested_at: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addLabResult} disabled={labLoading || !newLab.test_name} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#A8C5A0' }}>
              Add result
            </button>
          </div>

          <div className="space-y-2">
            {labResults.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No lab results yet.</p>
            )}
            {labResults.map(lab => {
              const inRange = lab.value !== null && lab.reference_min !== null && lab.reference_max !== null
                ? lab.value >= lab.reference_min && lab.value <= lab.reference_max
                : null
              return (
                <div key={lab.id} className="bg-white rounded-2xl border px-5 py-4" style={{ borderColor: '#EDE8E3' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>🧪 {lab.test_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {lab.tested_at}
                        {lab.reference_min && lab.reference_max && ` · Ref: ${lab.reference_min}–${lab.reference_max} ${lab.unit ?? ''}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" style={{ color: inRange === false ? '#EF4444' : inRange === true ? '#A8C5A0' : '#374151' }}>
                        {lab.value ?? '—'} {lab.unit}
                      </p>
                      {inRange !== null && (
                        <span className="text-xs" style={{ color: inRange ? '#A8C5A0' : '#EF4444' }}>
                          {inRange ? '✓ In range' : '⚠ Out of range'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
