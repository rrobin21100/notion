'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const GROCERY_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Bakery', 'Frozen', 'Pantry', 'Beverages', 'Snacks', 'Household', 'Other']

export default function ShoppingPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'lists' | 'pantry'>('lists')
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [items, setItems] = useState<{ id: string; name: string; quantity: string | null; category: string | null; checked: boolean }[]>([])
  const [pantryItems, setPantryItems] = useState<{ id: string; name: string; quantity: number | null; unit: string | null; low_threshold: number | null; category: string | null; expiry_date: string | null }[]>([])

  const [newListName, setNewListName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('')
  const [newItemCat, setNewItemCat] = useState('')
  const [newPantryName, setNewPantryName] = useState('')
  const [newPantryQty, setNewPantryQty] = useState('')
  const [newPantryUnit, setNewPantryUnit] = useState('')
  const [newPantryThreshold, setNewPantryThreshold] = useState('')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [listsData, pantryData] = await Promise.all([
      supabase.from('shopping_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('pantry_items').select('*').eq('user_id', user.id).order('name'),
    ])
    if (listsData.data) {
      setLists(listsData.data)
      if (!activeListId && listsData.data.length > 0) setActiveListId(listsData.data[0].id)
    }
    if (pantryData.data) setPantryItems(pantryData.data)
  }, [supabase, activeListId])

  const loadItems = useCallback(async () => {
    if (!activeListId) return
    const { data } = await supabase.from('shopping_items').select('*').eq('list_id', activeListId).order('category').order('checked').order('added_at')
    if (data) setItems(data)
  }, [supabase, activeListId])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadItems() }, [loadItems])

  async function createList() {
    if (!newListName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('shopping_lists').insert({ user_id: user.id, name: newListName.trim() }).select().single()
    if (data) setActiveListId(data.id)
    setNewListName('')
    await loadData()
  }

  async function addItem() {
    if (!newItemName.trim() || !activeListId) return
    await supabase.from('shopping_items').insert({ list_id: activeListId, name: newItemName.trim(), quantity: newItemQty || null, category: newItemCat || null })
    setNewItemName('')
    setNewItemQty('')
    await loadItems()
  }

  async function toggleItem(id: string, checked: boolean) {
    await supabase.from('shopping_items').update({ checked: !checked }).eq('id', id)
    await loadItems()
  }

  async function deleteItem(id: string) {
    await supabase.from('shopping_items').delete().eq('id', id)
    await loadItems()
  }

  async function addPantryItem() {
    if (!newPantryName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('pantry_items').insert({
      user_id: user.id,
      name: newPantryName.trim(),
      quantity: newPantryQty ? parseFloat(newPantryQty) : null,
      unit: newPantryUnit || null,
      low_threshold: newPantryThreshold ? parseFloat(newPantryThreshold) : null,
    })
    setNewPantryName('')
    setNewPantryQty('')
    setNewPantryUnit('')
    setNewPantryThreshold('')
    await loadData()
  }

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)
  const lowItems = pantryItems.filter(p => p.quantity !== null && p.low_threshold !== null && p.quantity <= p.low_threshold)

  const grouped = unchecked.reduce<Record<string, typeof unchecked>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#374151' }}>Shopping</h1>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Shopping lists and pantry tracking</p>

      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border inline-flex" style={{ borderColor: '#EDE8E3' }}>
        {(['lists', 'pantry'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
            style={{ background: tab === t ? '#E8856A' : 'transparent', color: tab === t ? 'white' : '#6B7280' }}>
            {t === 'lists' ? '🛒 Lists' : '🥫 Pantry'}
          </button>
        ))}
      </div>

      {tab === 'lists' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lists sidebar */}
          <div>
            <div className="flex gap-2 mb-3">
              <input type="text" value={newListName} onChange={e => setNewListName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createList()} placeholder="New list name" className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <button onClick={createList} className="px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#E8856A' }}>+</button>
            </div>
            <div className="space-y-1">
              {lists.map(list => (
                <button key={list.id} onClick={() => setActiveListId(list.id)} className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: activeListId === list.id ? '#FDF0EC' : 'white', color: activeListId === list.id ? '#E8856A' : '#374151', border: `1px solid ${activeListId === list.id ? '#E8856A30' : '#EDE8E3'}` }}>
                  🛒 {list.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active list */}
          <div className="lg:col-span-2">
            {activeListId ? (
              <>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="Add item" className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                  <input type="text" value={newItemQty} onChange={e => setNewItemQty(e.target.value)} placeholder="Qty" className="w-16 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
                  <select value={newItemCat} onChange={e => setNewItemCat(e.target.value)} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
                    <option value="">Category</option>
                    {GROCERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={addItem} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#E8856A' }}>Add</button>
                </div>

                {items.length === 0 && <p className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>This list is empty. Add your first item above.</p>}

                {Object.entries(grouped).map(([cat, catItems]) => (
                  <div key={cat} className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>{cat}</p>
                    <div className="space-y-1">
                      {catItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border px-4 py-3" style={{ borderColor: '#EDE8E3' }}>
                          <button onClick={() => toggleItem(item.id, item.checked)} className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                            style={{ borderColor: item.checked ? '#E8856A' : '#EDE8E3', background: item.checked ? '#E8856A' : 'transparent' }}>
                            {item.checked && <span className="text-white text-xs">✓</span>}
                          </button>
                          <span className="flex-1 text-sm" style={{ color: '#374151', textDecoration: item.checked ? 'line-through' : 'none' }}>
                            {item.name} {item.quantity && <span style={{ color: '#9CA3AF' }}>({item.quantity})</span>}
                          </span>
                          <button onClick={() => deleteItem(item.id)} className="text-xs" style={{ color: '#D1D5DB' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {checked.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#9CA3AF' }}>Checked ({checked.length})</p>
                    <div className="space-y-1 opacity-50">
                      {checked.map(item => (
                        <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border px-4 py-3" style={{ borderColor: '#EDE8E3' }}>
                          <button onClick={() => toggleItem(item.id, item.checked)} className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: '#E8856A', background: '#E8856A' }}>
                            <span className="text-white text-xs">✓</span>
                          </button>
                          <span className="flex-1 text-sm line-through" style={{ color: '#9CA3AF' }}>{item.name}</span>
                          <button onClick={() => deleteItem(item.id)} className="text-xs" style={{ color: '#D1D5DB' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center py-12 text-sm" style={{ color: '#9CA3AF' }}>Select or create a list to get started</p>
            )}
          </div>
        </div>
      )}

      {tab === 'pantry' && (
        <div className="space-y-6">
          {lowItems.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
              <p className="font-medium text-sm mb-2" style={{ color: '#C2410C' }}>⚠ Running low</p>
              <div className="flex gap-2 flex-wrap">
                {lowItems.map(item => (
                  <span key={item.id} className="text-xs px-2 py-1 rounded-lg bg-orange-100 text-orange-700">{item.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add pantry item</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <input type="text" value={newPantryName} onChange={e => setNewPantryName(e.target.value)} placeholder="Item name" className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newPantryQty} onChange={e => setNewPantryQty(e.target.value)} placeholder="Qty" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newPantryUnit} onChange={e => setNewPantryUnit(e.target.value)} placeholder="Unit (cups, oz…)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newPantryThreshold} onChange={e => setNewPantryThreshold(e.target.value)} placeholder="Low alert threshold" className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addPantryItem} disabled={!newPantryName} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#E8856A' }}>Add item</button>
          </div>

          <div className="space-y-2">
            {pantryItems.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No pantry items yet.</p>}
            {pantryItems.map(item => {
              const isLow = item.quantity !== null && item.low_threshold !== null && item.quantity <= item.low_threshold
              return (
                <div key={item.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: isLow ? '#FED7AA' : '#EDE8E3' }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#374151' }}>🥫 {item.name}</p>
                    {item.quantity !== null && <p className="text-xs mt-0.5" style={{ color: isLow ? '#C2410C' : '#9CA3AF' }}>{item.quantity} {item.unit}{isLow ? ' — running low!' : ''}</p>}
                  </div>
                  {item.expiry_date && <span className="text-xs" style={{ color: '#9CA3AF' }}>Exp: {item.expiry_date}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
