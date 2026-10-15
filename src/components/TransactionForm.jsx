import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { todayStr } from '../utils/helpers'

export default function TransactionForm({ type, initial, defaultDate, expenseKind, onSaved }) {
  const { t, state, dispatch } = useApp()
  const categories = state.categories.filter((c) => c.type === type)

  const [form, setForm] = useState({
    amount: initial?.amount || '',
    description: initial?.description || '',
    category: initial?.category || categories[0]?.id || '',
    date: initial?.date || defaultDate || todayStr(),
  })

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.date) return
    const payload = {
      type,
      amount: Number(form.amount),
      description: form.description,
      category: form.category,
      date: form.date,
      ...(type === 'expense' && (initial?.expenseKind || expenseKind)
        ? { expenseKind: initial?.expenseKind || expenseKind }
        : {}),
    }
    if (initial) {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: initial.id, ...payload } })
    } else {
      dispatch({ type: 'ADD_TRANSACTION', payload })
    }
    onSaved?.()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">{t.common.amount} *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="input"
          placeholder="0"
          value={form.amount}
          onChange={(e) => update('amount', e.target.value)}
          autoFocus
          required
        />
      </div>

      <div>
        <label className="label">{t.common.category} *</label>
        <select className="input" value={form.category} onChange={(e) => update('category', e.target.value)} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t.categories[c.id] || c.id}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">{t.common.description}</label>
        <input
          type="text"
          className="input"
          placeholder={t.common.description}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div>
        <label className="label">{t.common.date} *</label>
        <input
          type="date"
          className="input"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onSaved} className="btn-ghost">
          {t.common.cancel}
        </button>
        <button type="submit" className="btn-primary">
          {t.common.save}
        </button>
      </div>
    </form>
  )
}
