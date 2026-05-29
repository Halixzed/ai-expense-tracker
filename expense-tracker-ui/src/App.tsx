import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  Utensils, Car, Tv, ShoppingBag, Heart,
  Home, Zap, BookOpen, Plane, Package, Settings, LogOut
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { authFetch, getUser, loginWithGoogle, logout } from './auth'

const API = import.meta.env.VITE_API_URL

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Utensils, Car, Tv, ShoppingBag, Heart,
  Home, Zap, BookOpen, Plane, Package
}

const CATEGORY_COLOURS: Record<string, string> = {
  'Food & Dining':  'bg-orange-300',
  'Transport':      'bg-blue-300',
  'Entertainment':  'bg-purple-300',
  'Shopping':       'bg-pink-300',
  'Health':         'bg-green-300',
  'Housing':        'bg-red-300',
  'Utilities':      'bg-cyan-300',
  'Education':      'bg-indigo-300',
  'Travel':         'bg-teal-300',
  'Other':          'bg-gray-300',
}

const CATEGORY_HEX: Record<string, string> = {
  'Food & Dining':  '#fdba74',
  'Transport':      '#93c5fd',
  'Entertainment':  '#d8b4fe',
  'Shopping':       '#f9a8d4',
  'Health':         '#86efac',
  'Housing':        '#fca5a5',
  'Utilities':      '#67e8f9',
  'Education':      '#a5b4fc',
  'Travel':         '#5eead4',
  'Other':          '#d1d5db',
}

const CURRENCY_SYMBOLS: Record<string, string> = { GBP: '£', USD: '$', EUR: '€' }

interface Category { id: number; name: string; icon: string }
interface Expense { id: number; description: string; amount: number; categoryId: number; categoryName: string; categoryIcon: string; date: string }
interface UserSettings { id: number; monthlyIncome: number; savingsGoalPercent: number; currency: string }
interface CategoryBudget { id: number; categoryId: number; monthlyLimit: number; category: Category }

const btnBase = 'border-4 border-black font-bold uppercase px-4 py-2 -skew-x-3 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-100 cursor-pointer'
const inputBase = 'border-4 border-black px-3 py-2 w-full focus:outline-none focus:ring-0 bg-white text-black font-medium'

// ── Radial Gauge ──────────────────────────────────────────────────────────────
function RadialGauge({ value, max, label, colour, sym }: { value: number; max: number; label: string; colour: string; sym: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const data = [
    { value: pct * 100 },
    { value: (1 - pct) * 100 },
  ]
  const isOver = value > max && max > 0
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <PieChart width={144} height={144}>
          <Pie data={data} cx={68} cy={68} innerRadius={48} outerRadius={68}
            startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={isOver ? '#f87171' : colour} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-lg text-black leading-tight">{sym}{value.toFixed(0)}</span>
          <span className="font-bold text-[10px] text-black uppercase leading-tight">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span className="font-black text-xs uppercase text-black mt-1 text-center">{label}</span>
    </div>
  )
}

// ── Category Budget Chart ─────────────────────────────────────────────────────
function BudgetChart({ budgets, thisMonthExpenses, categories, sym }: {
  budgets: CategoryBudget[]; thisMonthExpenses: Expense[]; categories: Category[]; sym: string
}) {
  const data = budgets.map(b => {
    const cat = categories.find(c => c.id === b.categoryId)
    const spent = thisMonthExpenses.filter(e => e.categoryId === b.categoryId).reduce((s, e) => s + e.amount, 0)
    return { name: cat?.name ?? '', spent: parseFloat(spent.toFixed(2)), limit: parseFloat(b.monthlyLimit.toFixed(2)), colour: CATEGORY_HEX[cat?.name ?? ''] ?? '#d1d5db' }
  })

  return (
    <ResponsiveContainer width="100%" height={data.length * 48 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontWeight: 700, fontSize: 11 }} tickFormatter={v => `${sym}${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontWeight: 700, fontSize: 11 }} width={90} />
        <Tooltip formatter={(v) => `${sym}${Number(v).toFixed(2)}`} contentStyle={{ border: '3px solid black', borderRadius: 0, fontWeight: 700 }} />
        <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
        <Bar dataKey="spent" name="Spent" radius={0}>
          {data.map((entry, i) => <Cell key={i} fill={entry.colour} stroke="black" strokeWidth={1} />)}
        </Bar>
        <Bar dataKey="limit" name="Budget" fill="#e5e7eb" stroke="black" strokeWidth={1} radius={0} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── All Time Donut ────────────────────────────────────────────────────────────
function AllTimeDonut({ expenses, categories, sym }: { expenses: Expense[]; categories: Category[]; sym: string }) {
  const data = categories
    .map(cat => ({ name: cat.name, value: parseFloat(expenses.filter(e => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0).toFixed(2)), colour: CATEGORY_HEX[cat.name] ?? '#d1d5db' }))
    .filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2} stroke="black">
          {data.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
        </Pie>
        <Tooltip formatter={(v) => `${sym}${Number(v).toFixed(2)}`} contentStyle={{ border: '3px solid black', borderRadius: 0, fontWeight: 700 }} />
        <Legend wrapperStyle={{ fontWeight: 700, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Category Badge ────────────────────────────────────────────────────────────
function CategoryBadge({ name, icon }: { name: string; icon: string }) {
  const Icon = ICON_MAP[icon]
  return (
    <span className={`${CATEGORY_COLOURS[name] ?? 'bg-gray-300'} border-2 border-black px-2 py-0.5 text-sm font-bold inline-flex items-center gap-1 whitespace-nowrap`}>
      {Icon && <Icon size={14} />}
      {name}
    </span>
  )
}

// ── Category Picker ───────────────────────────────────────────────────────────
function CategoryPicker({ categories, selected, onChange }: { categories: Category[]; selected: number | ''; onChange: (id: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {categories.map(cat => {
        const Icon = ICON_MAP[cat.icon]
        const isSelected = selected === cat.id
        const colour = CATEGORY_COLOURS[cat.name] ?? 'bg-gray-300'
        return (
          <button key={cat.id} type="button" onClick={() => onChange(cat.id)}
            className={`flex flex-col items-center justify-center gap-1 p-2 border-4 border-black font-bold uppercase cursor-pointer transition-all duration-100 min-h-[64px]
              ${isSelected ? 'bg-black text-yellow-300 shadow-none translate-x-1 translate-y-1' : `${colour} text-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]`}`}>
            {Icon && <Icon size={16} className={isSelected ? 'text-yellow-300' : 'text-black'} strokeWidth={2.5} />}
            <span className={`text-[9px] leading-tight text-center line-clamp-2 ${isSelected ? 'text-yellow-300' : 'text-black'}`}>{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const [settings, setSettings] = useState<UserSettings>({ id: 1, monthlyIncome: 0, savingsGoalPercent: 20, currency: 'GBP' })
  const [budgets, setBudgets] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authFetch(`${API}/settings`).then(r => r.json())
      .then(({ settings: s, budgets: b }: { settings: UserSettings; budgets: CategoryBudget[] }) => {
        if (s) setSettings(s)
        const budgetMap: Record<number, string> = {}
        b.forEach(b => { budgetMap[b.categoryId] = String(b.monthlyLimit) })
        setBudgets(budgetMap)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await authFetch(`${API}/settings`, { method: 'PUT', body: JSON.stringify(settings) })
    await Promise.all(Object.entries(budgets).map(([catId, limit]) =>
      authFetch(`${API}/settings/budgets/${catId}`, { method: 'PUT', body: JSON.stringify({ monthlyLimit: parseFloat(limit) || 0 }) })
    ))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sym = CURRENCY_SYMBOLS[settings.currency] ?? settings.currency

  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase text-black">Settings</h2>
        <button onClick={onClose} className={`${btnBase} bg-yellow-300 text-black text-sm`}>Close</button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <h3 className="font-black uppercase text-black mb-3">Income & Savings</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="font-bold text-black text-sm uppercase block mb-1">Monthly Income ({sym})</label>
              <input className={inputBase} type="number" step="0.01" value={settings.monthlyIncome} onChange={e => setSettings({ ...settings, monthlyIncome: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="font-bold text-black text-sm uppercase block mb-1">Savings Goal (%)</label>
              <input className={inputBase} type="number" min="0" max="100" value={settings.savingsGoalPercent} onChange={e => setSettings({ ...settings, savingsGoalPercent: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="font-bold text-black text-sm uppercase block mb-1">Currency</label>
              <select className="border-4 border-black px-3 py-2 w-full focus:outline-none bg-white text-black font-medium cursor-pointer" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}>
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
          <h3 className="font-black uppercase text-black mb-3">Monthly Budget per Category</h3>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0"><CategoryBadge name={cat.name} icon={cat.icon} /></div>
                <div className="w-28 flex-shrink-0">
                  <input className={inputBase} type="number" step="0.01" placeholder={`${sym}0`} value={budgets[cat.id] ?? ''} onChange={e => setBudgets({ ...budgets, [cat.id]: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className={`${btnBase} ${saved ? 'bg-green-400' : 'bg-yellow-300'} text-black w-full`}>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
function LoginPage() {
  return (
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center p-6">
      <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] p-10 max-w-sm w-full text-center">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black mb-2">Expense Tracker</h1>
        <p className="text-black font-medium mb-8">Track your spending. Stay in control.</p>
        <button onClick={loginWithGoogle}
          className="border-4 border-black font-black uppercase px-6 py-3 -skew-x-3 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-100 cursor-pointer bg-yellow-300 text-black w-full text-lg">
          Sign in with Google
        </button>
      </div>
    </div>
  )
}

function App() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const [form, setForm] = useState({ description: '', amount: '', categoryId: '' as number | '', date: '' })
  const [editing, setEditing] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const loadAll = () =>
    Promise.all([
      authFetch(`${API}/expenses`).then(r => r.json()),
      authFetch(`${API}/categories`).then(r => r.json()),
      authFetch(`${API}/settings`).then(r => r.json()),
    ]).then(([exp, cats, { settings: s, budgets: b }]) => {
      setExpenses(exp); setCategories(cats)
      if (s) setSettings(s); setBudgets(b)
    })

  useEffect(() => {
    getUser().then(user => {
      if (user) {
        setAuthed(true)
        setUserEmail(user.signInDetails?.loginId ?? null)
      } else {
        setAuthed(false)
      }
    })
  }, [])

  useEffect(() => {
    if (authed) {
      loadAll().catch(err => setError(err.message)).finally(() => setLoading(false))
    }
  }, [authed])

  if (authed === null) return (
    <div className="min-h-screen bg-yellow-300 flex items-center justify-center">
      <p className="font-black text-black uppercase text-xl">Loading...</p>
    </div>
  )

  if (authed === false) return <LoginPage />

  const sym = settings ? (CURRENCY_SYMBOLS[settings.currency] ?? settings.currency) : '£'
  const now = new Date()
  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const totalSpentThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0)
  const totalAllTime = expenses.reduce((s, e) => s + e.amount, 0)
  const savingsTarget = settings ? (settings.monthlyIncome * settings.savingsGoalPercent) / 100 : 0
  const spendingBudget = settings ? settings.monthlyIncome - savingsTarget : 0

  const handleEdit = async (id: number) => {
    if (!editing) return
    try {
      const res = await authFetch(`${API}/expenses/${id}`, { method: 'PUT', body: JSON.stringify({ ...editing, amount: parseFloat(String(editing.amount)) }) })
      if (!res.ok) throw new Error('Failed to update expense')
      const updated: Expense = await res.json()
      setExpenses(expenses.map(e => e.id === id ? updated : e))
      setEditing(null)
    } catch (err: any) { setError(err.message) }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`${API}/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete expense')
      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err: any) { setError(err.message) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { setError('Please select a category'); return }
    setSubmitting(true)
    try {
      const res = await authFetch(`${API}/expenses`, { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount as string), categoryId: form.categoryId }) })
      if (!res.ok) throw new Error('Failed to add expense')
      setExpenses([...expenses, await res.json()])
      setForm({ description: '', amount: '', categoryId: '', date: '' })
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-yellow-300 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-4 sm:p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black">Expense Tracker</h1>
            {userEmail && <p className="text-black font-medium mt-1 text-sm">{userEmail}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setShowSettings(s => !s)} className={`${btnBase} ${showSettings ? 'bg-black text-yellow-300' : 'bg-yellow-300 text-black'}`}>
              <Settings size={20} />
            </button>
            <button onClick={() => logout()} className={`${btnBase} bg-red-400 text-black`}>
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border-4 border-black bg-red-400 shadow-[4px_4px_0_0_#000] p-4 mb-6 flex justify-between items-center font-bold text-black">
            <span className="text-sm">! {error}</span>
            <button onClick={() => setError(null)} className="ml-4 underline cursor-pointer text-sm">Dismiss</button>
          </div>
        )}

        {/* Settings */}
        {showSettings && <SettingsPanel categories={categories} onClose={() => { setShowSettings(false); loadAll() }} />}

        {/* This Month Widgets */}
        {!loading && settings && settings.monthlyIncome > 0 && (
          <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-black uppercase mb-4 text-black">This Month</h2>

            {/* Gauges */}
            <div className="flex justify-around mb-6">
              <RadialGauge value={totalSpentThisMonth} max={spendingBudget} label="Spent" colour="#60a5fa" sym={sym} />
              <RadialGauge value={Math.max(spendingBudget - totalSpentThisMonth, 0)} max={savingsTarget} label={`Save ${settings.savingsGoalPercent}%`} colour="#4ade80" sym={sym} />
            </div>

            {/* Category Budgets Chart */}
            {budgets.length > 0 && (
              <div className="border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                <h3 className="font-black uppercase text-black text-sm mb-3">Budget vs Spent</h3>
                <BudgetChart budgets={budgets} thisMonthExpenses={thisMonthExpenses} categories={categories} sym={sym} />
              </div>
            )}
          </div>
        )}

        {/* All Time */}
        {!loading && expenses.length > 0 && (
          <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-black uppercase mb-2 text-black">All Time</h2>
            <div className="border-4 border-black bg-yellow-300 p-4 mb-4 flex justify-between items-center">
              <span className="font-black text-black uppercase">Total Spent</span>
              <span className="font-black text-black text-2xl">{sym}{totalAllTime.toFixed(2)}</span>
            </div>
            <AllTimeDonut expenses={expenses} categories={categories} sym={sym} />
          </div>
        )}

        {/* Add Expense Form */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-black uppercase mb-4 text-black">Add New Expense</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input className={inputBase} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Description is required')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
            <input className={inputBase} placeholder={`Amount (${sym})`} type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Enter a valid amount')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
            <div>
              <p className="font-black uppercase text-black text-sm mb-2">Category</p>
              <CategoryPicker categories={categories} selected={form.categoryId} onChange={id => setForm({ ...form, categoryId: id })} />
            </div>
            <DatePicker selected={form.date ? new Date(form.date) : null} onChange={(date: Date | null) => setForm({ ...form, date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="yyyy-MM-dd" placeholderText="Select a date" className={inputBase} required />
            <button type="submit" disabled={submitting} className={`${btnBase} bg-yellow-300 w-full text-black`}>
              {submitting ? 'Adding...' : '+ Add Expense'}
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-4 sm:p-6">
          <h2 className="text-xl font-black uppercase mb-4 text-black">Your Expenses</h2>
          {loading ? <p className="font-bold text-black">Loading...</p>
            : expenses.length === 0 ? <p className="font-bold text-black">No expenses yet. Add one above!</p>
            : (
              <ul className="flex flex-col gap-3">
                {expenses.map(e => (
                  <li key={e.id} className="border-4 border-black p-3 sm:p-4 shadow-[4px_4px_0_0_#000]">
                    {editing?.id === e.id ? (
                      <div className="flex flex-col gap-3">
                        <input className={inputBase} placeholder="Description" value={editing.description} onChange={ev => setEditing({ ...editing, description: ev.target.value })} />
                        <input className={inputBase} placeholder={`Amount (${sym})`} type="number" step="0.01" value={editing.amount} onChange={ev => setEditing({ ...editing, amount: parseFloat(ev.target.value) })} />
                        <div>
                          <p className="font-black uppercase text-black text-sm mb-2">Category</p>
                          <CategoryPicker categories={categories} selected={editing.categoryId} onChange={id => setEditing({ ...editing, categoryId: id })} />
                        </div>
                        <DatePicker selected={editing.date ? new Date(editing.date) : null} onChange={(date: Date | null) => setEditing({ ...editing!, date: date ? date.toISOString().split('T')[0] : '' })} dateFormat="yyyy-MM-dd" placeholderText="Select a date" className={inputBase} />
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(e.id)} className={`${btnBase} bg-green-400 text-black text-sm`}>Save</button>
                          <button onClick={() => setEditing(null)} className={`${btnBase} bg-white text-black text-sm`}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black text-base sm:text-lg truncate">{e.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <CategoryBadge name={e.categoryName} icon={e.categoryIcon} />
                            <span className="text-sm font-medium text-black">{e.date.slice(0, 10)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-black text-lg text-black whitespace-nowrap">{sym}{e.amount.toFixed(2)}</span>
                          <button onClick={() => setEditing(e)} className={`${btnBase} bg-blue-300 text-black text-xs px-2 py-1`}>Edit</button>
                          <button onClick={() => handleDelete(e.id)} className={`${btnBase} bg-red-400 text-black text-xs px-2 py-1`}>Del</button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
        </div>

      </div>
    </div>
  )
}

export default App
