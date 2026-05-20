'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const RECORD_TYPES = ['allergy', 'vaccination', 'condition', 'surgery', 'other']
const RECORD_ICONS: Record<string, string> = { allergy: '⚠️', vaccination: '💉', condition: '🩺', surgery: '🏥', other: '📋' }

export default function MedicalPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'records' | 'contacts' | 'insurance'>('records')
  const [records, setRecords] = useState<{ id: string; record_type: string; name: string; details: string | null; date_recorded: string | null; provider: string | null }[]>([])
  const [contacts, setContacts] = useState<{ id: string; name: string; relationship: string | null; phone: string | null; email: string | null; is_primary: boolean }[]>([])
  const [insurance, setInsurance] = useState<{ id: string; provider: string; plan_name: string | null; member_id: string | null; group_number: string | null }[]>([])
  const [newRecord, setNewRecord] = useState({ record_type: 'allergy', name: '', details: '', date_recorded: '', provider: '' })
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '', email: '', is_primary: false })
  const [newIns, setNewIns] = useState({ provider: '', plan_name: '', member_id: '', group_number: '', effective_date: '' })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [recData, conData, insData] = await Promise.all([
      supabase.from('medical_records').select('*').eq('user_id', user.id).order('record_type').order('name'),
      supabase.from('emergency_contacts').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
      supabase.from('insurance_info').select('*').eq('user_id', user.id).order('provider'),
    ])
    if (recData.data) setRecords(recData.data)
    if (conData.data) setContacts(conData.data)
    if (insData.data) setInsurance(insData.data)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function addRecord() {
    if (!newRecord.name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('medical_records').insert({ user_id: user.id, ...newRecord, details: newRecord.details || null, date_recorded: newRecord.date_recorded || null, provider: newRecord.provider || null })
    setNewRecord({ record_type: 'allergy', name: '', details: '', date_recorded: '', provider: '' })
    await loadData()
  }

  async function addContact() {
    if (!newContact.name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('emergency_contacts').insert({ user_id: user.id, ...newContact, relationship: newContact.relationship || null, phone: newContact.phone || null, email: newContact.email || null })
    setNewContact({ name: '', relationship: '', phone: '', email: '', is_primary: false })
    await loadData()
  }

  async function addInsurance() {
    if (!newIns.provider.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('insurance_info').insert({ user_id: user.id, ...newIns, plan_name: newIns.plan_name || null, member_id: newIns.member_id || null, group_number: newIns.group_number || null, effective_date: newIns.effective_date || null })
    setNewIns({ provider: '', plan_name: '', member_id: '', group_number: '', effective_date: '' })
    await loadData()
  }

  async function deleteRecord(id: string) {
    await supabase.from('medical_records').delete().eq('id', id)
    await loadData()
  }

  const grouped = records.reduce<Record<string, typeof records>>((acc, r) => {
    if (!acc[r.record_type]) acc[r.record_type] = []
    acc[r.record_type].push(r)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#374151' }}>Medical</h1>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Health records, emergency contacts, and insurance info</p>

      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border inline-flex" style={{ borderColor: '#EDE8E3' }}>
        {([['records', '📋 Records'], ['contacts', '📞 Contacts'], ['insurance', '🛡️ Insurance']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === id ? '#ADB5BD' : 'transparent', color: tab === id ? 'white' : '#6B7280' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add medical record</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <select value={newRecord.record_type} onChange={e => setNewRecord({ ...newRecord, record_type: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
                {RECORD_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <input type="text" value={newRecord.name} onChange={e => setNewRecord({ ...newRecord, name: e.target.value })} placeholder="Name (e.g. Penicillin, MMR)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newRecord.provider} onChange={e => setNewRecord({ ...newRecord, provider: e.target.value })} placeholder="Provider / Doctor" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <textarea value={newRecord.details} onChange={e => setNewRecord({ ...newRecord, details: e.target.value })} placeholder="Details / notes" rows={2} className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="date" value={newRecord.date_recorded} onChange={e => setNewRecord({ ...newRecord, date_recorded: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addRecord} disabled={!newRecord.name} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#ADB5BD' }}>Add record</button>
          </div>

          {Object.entries(grouped).map(([type, typeRecords]) => (
            <div key={type}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
                {RECORD_ICONS[type]} {type}
              </p>
              <div className="space-y-2">
                {typeRecords.map(rec => (
                  <div key={rec.id} className="bg-white rounded-2xl border px-5 py-4 flex items-start justify-between" style={{ borderColor: '#EDE8E3' }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>{rec.name}</p>
                      {rec.details && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{rec.details}</p>}
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {rec.provider && `${rec.provider} · `}{rec.date_recorded}
                      </p>
                    </div>
                    <button onClick={() => deleteRecord(rec.id)} className="text-xs ml-4 flex-shrink-0" style={{ color: '#D1D5DB' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {records.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No medical records yet.</p>}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add emergency contact</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Full name" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newContact.relationship} onChange={e => setNewContact({ ...newContact, relationship: e.target.value })} placeholder="Relationship (e.g. Spouse)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="tel" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Phone number" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="Email" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" id="primary" checked={newContact.is_primary} onChange={e => setNewContact({ ...newContact, is_primary: e.target.checked })} className="rounded" />
              <label htmlFor="primary" className="text-sm" style={{ color: '#374151' }}>Primary contact</label>
            </div>
            <button onClick={addContact} disabled={!newContact.name} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#ADB5BD' }}>Add contact</button>
          </div>

          <div className="space-y-2">
            {contacts.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No emergency contacts yet.</p>}
            {contacts.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border px-5 py-4" style={{ borderColor: c.is_primary ? '#F4A261' : '#EDE8E3' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>👤 {c.name}</p>
                      {c.is_primary && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF4EC', color: '#F4A261' }}>Primary</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {c.relationship && `${c.relationship} · `}
                      {c.phone && `📱 ${c.phone}`}
                      {c.email && ` · ✉️ ${c.email}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'insurance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add insurance plan</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <input type="text" value={newIns.provider} onChange={e => setNewIns({ ...newIns, provider: e.target.value })} placeholder="Insurance provider" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newIns.plan_name} onChange={e => setNewIns({ ...newIns, plan_name: e.target.value })} placeholder="Plan name" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newIns.member_id} onChange={e => setNewIns({ ...newIns, member_id: e.target.value })} placeholder="Member ID" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newIns.group_number} onChange={e => setNewIns({ ...newIns, group_number: e.target.value })} placeholder="Group number" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="date" value={newIns.effective_date} onChange={e => setNewIns({ ...newIns, effective_date: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addInsurance} disabled={!newIns.provider} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#ADB5BD' }}>Add plan</button>
          </div>

          <div className="space-y-3">
            {insurance.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No insurance plans yet.</p>}
            {insurance.map(ins => (
              <div key={ins.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🛡️</span>
                  <p className="font-semibold" style={{ color: '#374151' }}>{ins.provider}</p>
                  {ins.plan_name && <span className="text-sm" style={{ color: '#9CA3AF' }}>· {ins.plan_name}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {ins.member_id && <div><span style={{ color: '#9CA3AF' }}>Member ID: </span><span style={{ color: '#374151' }}>{ins.member_id}</span></div>}
                  {ins.group_number && <div><span style={{ color: '#9CA3AF' }}>Group #: </span><span style={{ color: '#374151' }}>{ins.group_number}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
