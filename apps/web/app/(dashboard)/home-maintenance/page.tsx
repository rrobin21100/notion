'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, differenceInDays } from 'date-fns'

const HOME_CATEGORIES = ['Appliance', 'HVAC', 'Plumbing', 'Electrical', 'Roofing', 'Exterior', 'Interior', 'Lawn', 'Vehicle', 'Other']
const CAT_ICONS: Record<string, string> = {
  Appliance: '🍳', HVAC: '❄️', Plumbing: '🚿', Electrical: '⚡', Roofing: '🏠',
  Exterior: '🪟', Interior: '🛋️', Lawn: '🌿', Vehicle: '🚗', Other: '🔧',
}

export default function HomeMaintenancePage() {
  const supabase = createClient()
  const [items, setItems] = useState<{
    id: string; name: string; category: string | null; brand: string | null; model: string | null; purchase_date: string | null; warranty_expires: string | null; notes: string | null
  }[]>([])
  const [logs, setLogs] = useState<{
    id: string; item_id: string | null; description: string; cost: number | null; provider: string | null; performed_at: string; next_service_date: string | null
  }[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', category: '', brand: '', model: '', purchase_date: '', warranty_expires: '', notes: '' })
  const [newLog, setNewLog] = useState({ description: '', cost: '', provider: '', performed_at: format(new Date(), 'yyyy-MM-dd'), next_service_date: '' })

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [itemsData, logsData] = await Promise.all([
      supabase.from('home_items').select('*').eq('user_id', user.id).order('category').order('name'),
      supabase.from('maintenance_logs').select('*').eq('user_id', user.id).order('performed_at', { ascending: false }),
    ])
    if (itemsData.data) {
      setItems(itemsData.data)
      if (!selectedItemId && itemsData.data.length > 0) setSelectedItemId(itemsData.data[0].id)
    }
    if (logsData.data) setLogs(logsData.data)
  }, [supabase, selectedItemId])

  useEffect(() => { loadData() }, [loadData])

  async function addItem() {
    if (!newItem.name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('home_items').insert({
      user_id: user.id,
      name: newItem.name,
      category: newItem.category || null,
      brand: newItem.brand || null,
      model: newItem.model || null,
      purchase_date: newItem.purchase_date || null,
      warranty_expires: newItem.warranty_expires || null,
      notes: newItem.notes || null,
    }).select().single()
    if (data) setSelectedItemId(data.id)
    setNewItem({ name: '', category: '', brand: '', model: '', purchase_date: '', warranty_expires: '', notes: '' })
    setShowItemForm(false)
    await loadData()
  }

  async function addLog() {
    if (!newLog.description.trim() || !selectedItemId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('maintenance_logs').insert({
      user_id: user.id,
      item_id: selectedItemId,
      description: newLog.description,
      cost: newLog.cost ? parseFloat(newLog.cost) : null,
      provider: newLog.provider || null,
      performed_at: newLog.performed_at,
      next_service_date: newLog.next_service_date || null,
    })
    setNewLog({ description: '', cost: '', provider: '', performed_at: format(new Date(), 'yyyy-MM-dd'), next_service_date: '' })
    await loadData()
  }

  const selectedItem = items.find(i => i.id === selectedItemId)
  const selectedLogs = logs.filter(l => l.item_id === selectedItemId)

  const warrantyExpiringSoon = items.filter(i => {
    if (!i.warranty_expires) return false
    const days = differenceInDays(new Date(i.warranty_expires), new Date())
    return days >= 0 && days <= 30
  })

  const upcomingService = logs.filter(l => {
    if (!l.next_service_date) return false
    return differenceInDays(new Date(l.next_service_date), new Date()) <= 14
  })

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#374151' }}>Home Maintenance</h1>
        <button onClick={() => setShowItemForm(!showItemForm)} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#CDB4DB', color: '#374151' }}>
          + Add item
        </button>
      </div>

      {/* Alerts */}
      {(warrantyExpiringSoon.length > 0 || upcomingService.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {warrantyExpiringSoon.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="font-medium text-sm mb-1" style={{ color: '#92400E' }}>⚠️ Warranty expiring soon</p>
              {warrantyExpiringSoon.map(i => <p key={i.id} className="text-xs" style={{ color: '#78350F' }}>{i.name} — expires {i.warranty_expires}</p>)}
            </div>
          )}
          {upcomingService.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="font-medium text-sm mb-1" style={{ color: '#1E40AF' }}>📅 Service due soon</p>
              {upcomingService.map(l => <p key={l.id} className="text-xs" style={{ color: '#1E3A8A' }}>{l.description} — {l.next_service_date}</p>)}
            </div>
          )}
        </div>
      )}

      {showItemForm && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#EDE8E3' }}>
          <p className="font-medium mb-4" style={{ color: '#374151' }}>Add home item</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Item name (e.g. HVAC Unit)" className="col-span-2 sm:col-span-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
              <option value="">Category</option>
              {HOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="text" value={newItem.brand} onChange={e => setNewItem({ ...newItem, brand: e.target.value })} placeholder="Brand" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="text" value={newItem.model} onChange={e => setNewItem({ ...newItem, model: e.target.value })} placeholder="Model" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="date" value={newItem.purchase_date} onChange={e => setNewItem({ ...newItem, purchase_date: e.target.value })} placeholder="Purchase date" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            <input type="date" value={newItem.warranty_expires} onChange={e => setNewItem({ ...newItem, warranty_expires: e.target.value })} placeholder="Warranty expires" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} disabled={!newItem.name} className="px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: '#CDB4DB', color: '#374151' }}>Add item</button>
            <button onClick={() => setShowItemForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium" style={{ color: '#9CA3AF' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items sidebar */}
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border" style={{ borderColor: '#EDE8E3' }}>
              <p className="text-3xl mb-2">🏡</p>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Add your home items to start tracking maintenance</p>
            </div>
          ) : Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                {CAT_ICONS[cat] ?? '🔧'} {cat}
              </p>
              <div className="space-y-1">
                {catItems.map(item => {
                  const warrantyDays = item.warranty_expires ? differenceInDays(new Date(item.warranty_expires), new Date()) : null
                  return (
                    <button key={item.id} onClick={() => setSelectedItemId(item.id)} className="w-full text-left bg-white rounded-xl border p-3 transition-all"
                      style={{ borderColor: selectedItemId === item.id ? '#CDB4DB' : '#EDE8E3' }}>
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>{item.name}</p>
                      {item.brand && <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.brand} {item.model}</p>}
                      {warrantyDays !== null && warrantyDays <= 30 && warrantyDays >= 0 && (
                        <p className="text-xs mt-0.5" style={{ color: '#D97706' }}>⚠ Warranty in {warrantyDays}d</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Item detail */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#EDE8E3' }}>
              <div className="flex items-start gap-3 mb-6">
                <span className="text-3xl">{CAT_ICONS[selectedItem.category ?? 'Other'] ?? '🔧'}</span>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: '#374151' }}>{selectedItem.name}</h2>
                  <p className="text-sm" style={{ color: '#9CA3AF' }}>
                    {selectedItem.brand && `${selectedItem.brand} ${selectedItem.model ?? ''}`}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color: '#9CA3AF' }}>
                    {selectedItem.purchase_date && <span>Purchased: {selectedItem.purchase_date}</span>}
                    {selectedItem.warranty_expires && <span>Warranty: {selectedItem.warranty_expires}</span>}
                  </div>
                </div>
              </div>

              {/* Log service */}
              <p className="font-medium text-sm mb-3" style={{ color: '#374151' }}>Service history ({selectedLogs.length})</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                <input type="text" value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })} placeholder="Service description" className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="text" value={newLog.provider} onChange={e => setNewLog({ ...newLog, provider: e.target.value })} placeholder="Provider" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="number" value={newLog.cost} onChange={e => setNewLog({ ...newLog, cost: e.target.value })} placeholder="Cost ($)" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="date" value={newLog.performed_at} onChange={e => setNewLog({ ...newLog, performed_at: e.target.value })} className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                <input type="date" value={newLog.next_service_date} onChange={e => setNewLog({ ...newLog, next_service_date: e.target.value })} placeholder="Next service date" className="px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              </div>
              <button onClick={addLog} disabled={!newLog.description} className="px-4 py-2 rounded-xl text-sm font-medium mb-4 disabled:opacity-60" style={{ background: '#CDB4DB', color: '#374151' }}>
                Log service
              </button>

              <div className="space-y-2">
                {selectedLogs.length === 0 && <p className="text-sm" style={{ color: '#9CA3AF' }}>No service history yet.</p>}
                {selectedLogs.map(log => (
                  <div key={log.id} className="px-4 py-3 rounded-xl" style={{ background: '#F5EEF8' }}>
                    <div className="flex justify-between">
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>{log.description}</p>
                      {log.cost && <p className="text-sm font-medium" style={{ color: '#9B59B6' }}>${log.cost}</p>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                      {log.performed_at}{log.provider && ` · ${log.provider}`}
                      {log.next_service_date && ` · Next: ${log.next_service_date}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16" style={{ color: '#9CA3AF' }}>
              <p className="text-4xl mb-3">🏡</p>
              <p>Select an item to view its history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
