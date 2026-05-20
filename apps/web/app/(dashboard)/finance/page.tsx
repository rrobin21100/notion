'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const DEFAULT_CATEGORIES = [
  { name: 'Housing', color: '#C4B5D5', icon: '🏠' },
  { name: 'Food & Dining', color: '#A8C5A0', icon: '🍽️' },
  { name: 'Transport', color: '#7BC8E2', icon: '🚗' },
  { name: 'Health', color: '#F4A261', icon: '💊' },
  { name: 'Shopping', color: '#E8856A', icon: '🛍️' },
  { name: 'Entertainment', color: '#F5C842', icon: '🎬' },
  { name: 'Utilities', color: '#ADB5BD', icon: '💡' },
  { name: 'Savings', color: '#74C69D', icon: '🏦' },
]

export default function FinancePage() {
  const supabase = createClient()
  const [categories, setCategories] = useState<{ id: string; name: string; monthly_budget: number; color: string | null; icon: string | null }[]>([])
  const [expenses, setExpenses] = useState<{ id: string; category_id: string | null; amount: number; description: string | null; merchant: string | null; spent_at: string }[]>([])
  const [tab, setTab] = useState<'overview' | 'expenses' | 'categories'>('overview')
  const [newExp, setNewExp] = useState({ amount: '', category_id: '', description: '', merchant: '', spent_at: format(new Date(), 'yyyy-MM-dd') })
  const [newCat, setNewCat] = useState({ name: '', monthly_budget: '', color: '#A8C5A0', icon: '💰' })
  const [loading, setLoading] = useState(false)

  const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const thisMonthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [catData, expData] = await Promise.all([
      supabase.from('budget_categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('spent_at', thisMonthStart).lte('spent_at', thisMonthEnd).order('spent_at', { ascending: false }),
    ])
    if (catData.data) setCategories(catData.data)
    if (expData.data) setExpenses(expData.data)
  }, [supabase, thisMonthStart, thisMonthEnd])

  useEffect(() => { loadData() }, [loadData])

  async function addExpense() {
    if (!newExp.amount) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('expenses').insert({
      user_id: user.id,
      amount: parseFloat(newExp.amount),
      category_id: newExp.category_id || null,
      description: newExp.description || null,
      merchant: newExp.merchant || null,
      spent_at: newExp.spent_at,
    })
    setNewExp({ amount: '', category_id: '', description: '', merchant: '', spent_at: format(new Date(), 'yyyy-MM-dd') })
    await loadData()
    setLoading(false)
  }

  async function addCategory() {
    if (!newCat.name || !newCat.monthly_budget) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('budget_categories').insert({
      user_id: user.id,
      name: newCat.name,
      monthly_budget: parseFloat(newCat.monthly_budget),
      color: newCat.color,
      icon: newCat.icon,
    })
    setNewCat({ name: '', monthly_budget: '', color: '#A8C5A0', icon: '💰' })
    await loadData()
    setLoading(false)
  }

  async function seedDefaultCategories() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('budget_categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ user_id: user.id, name: c.name, monthly_budget: 0, color: c.color, icon: c.icon }))
    )
    await loadData()
    setLoading(false)
  }

  const totalBudget = categories.reduce((s, c) => s + c.monthly_budget, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const remaining = totalBudget - totalSpent

  function categorySpent(catId: string) {
    return expenses.filter(e => e.category_id === catId).reduce((s, e) => s + e.amount, 0)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#374151' }}>Finance</h1>
      <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>{format(new Date(), 'MMMM yyyy')} · Budget tracker</p>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Monthly budget', value: `$${totalBudget.toFixed(0)}`, color: '#74C69D' },
          { label: 'Spent this month', value: `$${totalSpent.toFixed(0)}`, color: '#E8856A' },
          { label: 'Remaining', value: `$${remaining.toFixed(0)}`, color: remaining >= 0 ? '#A8C5A0' : '#EF4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#EDE8E3' }}>
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 border inline-flex" style={{ borderColor: '#EDE8E3' }}>
        {([['overview', '📊 Overview'], ['expenses', '💳 Expenses'], ['categories', '🏷️ Categories']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: tab === id ? '#74C69D' : 'transparent', color: tab === id ? 'white' : '#6B7280' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💰</p>
              <p className="font-medium mb-2" style={{ color: '#374151' }}>No budget categories yet</p>
              <button onClick={seedDefaultCategories} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: '#74C69D' }}>
                Add default categories
              </button>
            </div>
          ) : categories.map(cat => {
            const spent = categorySpent(cat.id)
            const pct = cat.monthly_budget > 0 ? Math.min((spent / cat.monthly_budget) * 100, 100) : 0
            const over = spent > cat.monthly_budget && cat.monthly_budget > 0
            return (
              <div key={cat.id} className="bg-white rounded-2xl border px-5 py-4" style={{ borderColor: '#EDE8E3' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon ?? '💰'}</span>
                    <span className="font-medium text-sm" style={{ color: '#374151' }}>{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium" style={{ color: over ? '#EF4444' : '#374151' }}>${spent.toFixed(0)}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}> / ${cat.monthly_budget.toFixed(0)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? '#EF4444' : (cat.color ?? '#74C69D') }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add expense</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <input type="number" value={newExp.amount} onChange={e => setNewExp({ ...newExp, amount: e.target.value })} placeholder="Amount ($)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <select value={newExp.category_id} onChange={e => setNewExp({ ...newExp, category_id: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }}>
                <option value="">Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="text" value={newExp.merchant} onChange={e => setNewExp({ ...newExp, merchant: e.target.value })} placeholder="Merchant" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} placeholder="Description" className="col-span-2 px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="date" value={newExp.spent_at} onChange={e => setNewExp({ ...newExp, spent_at: e.target.value })} className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addExpense} disabled={loading || !newExp.amount} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#74C69D' }}>Log expense</button>
          </div>

          <div className="space-y-2">
            {expenses.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>No expenses logged this month.</p>}
            {expenses.map(exp => {
              const cat = categories.find(c => c.id === exp.category_id)
              return (
                <div key={exp.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: '#EDE8E3' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat?.icon ?? '💳'}</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#374151' }}>{exp.merchant || exp.description || 'Expense'}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>{cat?.name ?? 'Uncategorized'} · {exp.spent_at}</p>
                    </div>
                  </div>
                  <p className="font-bold" style={{ color: '#E8856A' }}>-${exp.amount.toFixed(2)}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#EDE8E3' }}>
            <p className="font-medium mb-4" style={{ color: '#374151' }}>Add budget category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <input type="text" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="Category name" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="number" value={newCat.monthly_budget} onChange={e => setNewCat({ ...newCat, monthly_budget: e.target.value })} placeholder="Monthly budget ($)" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
              <input type="text" value={newCat.icon} onChange={e => setNewCat({ ...newCat, icon: e.target.value })} placeholder="Icon emoji" className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: '#EDE8E3', background: '#FDF8F5' }} />
            </div>
            <button onClick={addCategory} disabled={loading || !newCat.name || !newCat.monthly_budget} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60" style={{ background: '#74C69D' }}>Add category</button>
          </div>

          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl border px-5 py-4 flex items-center justify-between" style={{ borderColor: '#EDE8E3' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon ?? '💰'}</span>
                  <p className="font-medium text-sm" style={{ color: '#374151' }}>{cat.name}</p>
                </div>
                <p className="text-sm font-medium" style={{ color: '#74C69D' }}>${cat.monthly_budget}/mo</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
