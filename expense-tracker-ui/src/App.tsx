import { useEffect, useState } from 'react'

const API = 'https://vsps2x9gan.eu-west-2.awsapprunner.com/expenses'

interface Expense {
  id: number
  description: string
  amount: number
  category: string
  date: string
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [form, setForm] = useState({ description: '', amount: '', category: '', date: '' })
  const [editing, setEditing] = useState<Expense | null>(null)

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => setExpenses(data))
  }, [])

  const handleEdit = async (id: number) => {
    if (!editing) return
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editing, amount: parseFloat(String(editing.amount)) })
    })
    const updated: Expense = await res.json()
    setExpenses(expenses.map(e => e.id === id ? updated : e))
    setEditing(null)
  }

  const handleDelete = async (id: number) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    setExpenses(expenses.filter(e => e.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) })
    })
    const created: Expense = await res.json()
    setExpenses([...expenses, created])
    setForm({ description: '', amount: '', category: '', date: '' })
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>Expense Tracker</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
        <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required />
        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add Expense</button>
      </form>

      <ul>
        {expenses.map(e => (
          <li key={e.id} style={{ marginBottom: 12 }}>
            {editing?.id === e.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input value={editing.description} onChange={ev => setEditing({ ...editing, description: ev.target.value })} />
                <input type="number" value={editing.amount} onChange={ev => setEditing({ ...editing, amount: parseFloat(ev.target.value) })} />
                <input value={editing.category} onChange={ev => setEditing({ ...editing, category: ev.target.value })} />
                <input type="date" value={editing.date.slice(0, 10)} onChange={ev => setEditing({ ...editing, date: ev.target.value })} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleEdit(e.id)}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{e.date.slice(0, 10)} — {e.category} — {e.description} — £{e.amount}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditing(e)}>Edit</button>
                  <button onClick={() => handleDelete(e.id)} style={{ color: 'red' }}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
