import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  Utensils, Car, Tv, ShoppingBag, Heart,
  Home, Zap, BookOpen, Plane, Package
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

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

interface Category {
  id: number
  name: string
  icon: string
}

interface Expense {
  id: number
  description: string
  amount: number
  categoryId: number
  categoryName: string
  categoryIcon: string
  date: string
}

const btnBase = 'border-4 border-black font-bold uppercase px-4 py-2 -skew-x-3 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all duration-100 cursor-pointer'
const inputBase = 'border-4 border-black px-3 py-2 w-full focus:outline-none focus:ring-0 bg-white text-black font-medium'

function CategoryBadge({ name, icon }: { name: string; icon: string }) {
  const Icon = ICON_MAP[icon]
  return (
    <span className={`${CATEGORY_COLOURS[name] ?? 'bg-gray-300'} border-2 border-black px-2 py-0.5 text-sm font-bold inline-flex items-center gap-1`}>
      {Icon && <Icon size={14} />}
      {name}
    </span>
  )
}

function CategoryPicker({ categories, selected, onChange }: {
  categories: Category[]
  selected: number | ''
  onChange: (id: number) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {categories.map(cat => {
        const Icon = ICON_MAP[cat.icon]
        const isSelected = selected === cat.id
        const colour = CATEGORY_COLOURS[cat.name] ?? 'bg-gray-300'
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onChange(cat.id)}
            className={`
              flex flex-col items-center justify-center gap-1 p-2 border-4 border-black
              font-bold text-xs uppercase text-black cursor-pointer transition-all duration-100
              ${isSelected
                ? 'bg-black text-white shadow-none translate-x-1 translate-y-1'
                : `${colour} shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]`
              }
            `}
          >
            {Icon && <Icon size={18} className={isSelected ? 'text-yellow-300' : 'text-black'} />}
            <span className={`leading-tight text-center ${isSelected ? 'text-yellow-300' : ''}`}>{cat.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ description: '', amount: '', categoryId: '' as number | '', date: '' })
  const [editing, setEditing] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/expenses`).then(r => r.json()),
      fetch(`${API}/categories`).then(r => r.json())
    ])
      .then(([exp, cats]) => {
        setExpenses(exp)
        setCategories(cats)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const byCategory = categories
    .map(cat => ({
      cat,
      total: expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
    }))
    .filter(c => c.total > 0)

  const handleEdit = async (id: number) => {
    if (!editing) return
    try {
      const res = await fetch(`${API}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editing, amount: parseFloat(String(editing.amount)) })
      })
      if (!res.ok) throw new Error('Failed to update expense')
      const updated: Expense = await res.json()
      setExpenses(expenses.map(e => e.id === id ? updated : e))
      setEditing(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API}/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete expense')
      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.categoryId) { setError('Please select a category'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount as string), categoryId: form.categoryId })
      })
      if (!res.ok) throw new Error('Failed to add expense')
      const created: Expense = await res.json()
      setExpenses([...expenses, created])
      setForm({ description: '', amount: '', categoryId: '', date: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-yellow-300 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-6 mb-6">
          <h1 className="text-4xl font-black uppercase tracking-tight text-black">Expense Tracker</h1>
          <p className="text-black font-medium mt-1">Track your spending. Stay in control.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="border-4 border-black bg-red-400 shadow-[4px_4px_0_0_#000] p-4 mb-6 flex justify-between items-center font-bold text-black">
            <span>! {error}</span>
            <button onClick={() => setError(null)} className="ml-4 underline cursor-pointer">Dismiss</button>
          </div>
        )}

        {/* Summary */}
        {!loading && expenses.length > 0 && (
          <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-6 mb-6">
            <h2 className="text-xl font-black uppercase mb-4 text-black">Summary</h2>
            <div className="border-4 border-black bg-yellow-300 p-4 mb-4 flex justify-between items-center">
              <span className="font-black text-black uppercase text-lg">Total Spent</span>
              <span className="font-black text-black text-2xl">£{total.toFixed(2)}</span>
            </div>
            <div className="flex flex-col gap-2">
              {byCategory.map(({ cat, total: catTotal }) => (
                <div key={cat.id} className="flex justify-between items-center border-2 border-black px-3 py-2">
                  <CategoryBadge name={cat.name} icon={cat.icon} />
                  <span className="font-bold text-black">£{catTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Expense Form */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-6 mb-6">
          <h2 className="text-xl font-black uppercase mb-4 text-black">Add New Expense</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input className={inputBase} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Description is required')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
            <input className={inputBase} placeholder="Amount (£)" type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Enter a valid amount')} onInput={e => (e.target as HTMLInputElement).setCustomValidity('')} />
            <div>
              <p className="font-black uppercase text-black text-sm mb-2">Category</p>
              <CategoryPicker categories={categories} selected={form.categoryId} onChange={id => setForm({ ...form, categoryId: id })} />
            </div>
            <DatePicker
              selected={form.date ? new Date(form.date) : null}
              onChange={(date) => setForm({ ...form, date: date ? date.toISOString().split('T')[0] : '' })}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select a date"
              className={inputBase}
              required
            />
            <button type="submit" disabled={submitting} className={`${btnBase} bg-yellow-300 w-full text-black`}>
              {submitting ? 'Adding...' : '+ Add Expense'}
            </button>
          </form>
        </div>

        {/* Expense List */}
        <div className="border-4 border-black bg-white shadow-[6px_6px_0_0_#000] p-6">
          <h2 className="text-xl font-black uppercase mb-4 text-black">Your Expenses</h2>
          {loading ? (
            <p className="font-bold text-black">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="font-bold text-black">No expenses yet. Add one above!</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {expenses.map(e => (
                <li key={e.id} className="border-4 border-black p-4 shadow-[4px_4px_0_0_#000]">
                  {editing?.id === e.id ? (
                    <div className="flex flex-col gap-3">
                      <input className={inputBase} placeholder="Description" value={editing.description} onChange={ev => setEditing({ ...editing, description: ev.target.value })} />
                      <input className={inputBase} placeholder="Amount (£)" type="number" step="0.01" value={editing.amount} onChange={ev => setEditing({ ...editing, amount: parseFloat(ev.target.value) })} />
                      <div>
                        <p className="font-black uppercase text-black text-sm mb-2">Category</p>
                        <CategoryPicker categories={categories} selected={editing.categoryId} onChange={id => setEditing({ ...editing, categoryId: id })} />
                      </div>
                      <DatePicker
                        selected={editing.date ? new Date(editing.date) : null}
                        onChange={(date) => setEditing({ ...editing, date: date ? date.toISOString().split('T')[0] : '' })}
                        dateFormat="yyyy-MM-dd"
                        placeholderText="Select a date"
                        className={inputBase}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(e.id)} className={`${btnBase} bg-green-400 text-black`}>Save</button>
                        <button onClick={() => setEditing(null)} className={`${btnBase} bg-white text-black`}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="font-black text-black text-lg">{e.description}</p>
                        <p className="font-medium text-black mt-1">
                          <CategoryBadge name={e.categoryName} icon={e.categoryIcon} />
                          <span className="ml-2">{e.date.slice(0, 10)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xl text-black whitespace-nowrap">£{e.amount.toFixed(2)}</span>
                        <button onClick={() => setEditing(e)} className={`${btnBase} bg-blue-300 text-black text-sm`}>Edit</button>
                        <button onClick={() => handleDelete(e.id)} className={`${btnBase} bg-red-400 text-black text-sm`}>Delete</button>
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
