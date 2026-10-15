import { useState } from 'react'
import { useApp, getNextRunDate, toDateStr } from '../store/AppContext'
import { formatCurrency, formatDate } from '../utils/helpers'
import Modal from './ui/Modal'
import { IconPlus, IconEdit, IconTrash, IconArrowUp, IconArrowDown, IconRepeat } from './ui/Icons'

function emptyForm() {
  return {
    type: 'expense',
    amount: '',
    description: '',
    category: '',
    frequency: 'monthly',
    dayOfMonth: new Date().getDate(),
    weekday: new Date().getDay(),
    startDate: toDateStr(new Date()),
    endDate: '',
  }
}

function RecurringForm({ initial, onSaved }) {
  const { t, state, dispatch } = useApp()
  const [form, setForm] = useState(initial || emptyForm())

  const categories = state.categories.filter((c) => c.type === form.type)
  if (form.category && !categories.find((c) => c.id === form.category)) {
    form.category = categories[0]?.id || ''
  }

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.category || !form.startDate) return
    const payload = {
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
      category: form.category,
      frequency: form.frequency,
      dayOfMonth: Number(form.dayOfMonth) || 1,
      weekday: Number(form.weekday) || 0,
      startDate: form.startDate,
      endDate: form.endDate || null,
    }
    if (initial) {
      dispatch({ type: 'UPDATE_RECURRING', payload: { id: initial.id, ...payload } })
    } else {
      dispatch({ type: 'ADD_RECURRING', payload })
    }
    onSaved?.()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => update('type', 'expense')}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
            form.type === 'expense' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-600'
          }`}
        >
          {t.nav.expenses}
        </button>
        <button
          type="button"
          onClick={() => update('type', 'income')}
          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
            form.type === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-600'
          }`}
        >
          {t.nav.income}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t.common.amount} *</label>
          <input type="number" min="0" step="0.01" className="input" value={form.amount}
            onChange={(e) => update('amount', e.target.value)} autoFocus required />
        </div>
        <div>
          <label className="label">{t.common.category} *</label>
          <select className="input" value={form.category} onChange={(e) => update('category', e.target.value)} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{t.categories[c.id] || c.id}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">{t.common.description}</label>
        <input type="text" className="input" placeholder={t.common.description} value={form.description}
          onChange={(e) => update('description', e.target.value)} />
      </div>

      <div>
        <label className="label">{t.recurring.frequency}</label>
        <div className="grid grid-cols-3 gap-2">
          {['daily', 'weekly', 'monthly'].map((f) => (
            <button key={f} type="button" onClick={() => update('frequency', f)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                form.frequency === f ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
              }`}>
              {t.recurring[f]}
            </button>
          ))}
        </div>
      </div>

      {form.frequency === 'monthly' && (
        <div>
          <label className="label">{t.recurring.dayOfMonth}</label>
          <select className="input" value={form.dayOfMonth} onChange={(e) => update('dayOfMonth', e.target.value)}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {form.frequency === 'weekly' && (
        <div>
          <label className="label">{t.recurring.weekday}</label>
          <select className="input" value={form.weekday} onChange={(e) => update('weekday', e.target.value)}>
            {t.recurring.weekdays.map((w, i) => (
              <option key={i} value={i}>{w}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t.recurring.startDate} *</label>
          <input type="date" className="input" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} required />
        </div>
        <div>
          <label className="label">{t.recurring.endDate}</label>
          <input type="date" className="input" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onSaved} className="btn-ghost">{t.common.cancel}</button>
        <button type="submit" className="btn-primary">{t.common.save}</button>
      </div>
    </form>
  )
}

export default function Recurring() {
  const { t, state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleDelete = (id) => {
    if (window.confirm(t.common.confirmDelete)) {
      dispatch({ type: 'DELETE_RECURRING', payload: id })
    }
  }

  const runNow = (id) => {
    dispatch({ type: 'RUN_RECURRING_NOW', payload: id })
  }

  const openAdd = () => { setEditing(null); setOpen(true) }
  const openEdit = (r) => { setEditing(r); setOpen(true) }

  const today = toDateStr(new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t.recurring.title}</h1>
          <p className="text-sm text-slate-500">{t.recurring.subtitle}</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <IconPlus width={16} height={16} /> {t.recurring.addRecurring}
        </button>
      </div>

      <div className="card p-4 bg-brand-50 border-brand-100">
        <div className="flex items-center gap-2 text-sm text-brand-700">
          <IconRepeat width={16} height={16} />
          <span>{t.recurring.autoApplied}</span>
        </div>
      </div>

      {state.recurring.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <IconRepeat width={28} height={28} />
          </div>
          <p className="text-slate-400">{t.common.noData}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.recurring.map((r) => {
            const cat = state.categories.find((c) => c.id === r.category)
            const nextRun = getNextRunDate(r, today)
            const isIncome = r.type === 'income'
            return (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      {isIncome ? <IconArrowUp width={20} height={20} /> : <IconArrowDown width={20} height={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{r.description || t.categories[r.category]}</p>
                      <span className={`badge ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {t.categories[r.category]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-extrabold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(r.amount, state.currency)}
                    </p>
                    <p className="text-xs text-slate-500">{t.recurring[r.frequency]}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">{t.recurring.nextRun}</p>
                    <p className="font-semibold text-slate-700">{nextRun ? formatDate(nextRun) : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2">
                    <p className="text-slate-500">{t.recurring.lastRun}</p>
                    <p className="font-semibold text-slate-700">{r.lastRunDate ? formatDate(r.lastRunDate) : '—'}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => runNow(r.id)} className="btn-ghost flex-1 border border-slate-200 text-xs">
                    ▶ {t.recurring.runNow}
                  </button>
                  <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600">
                    <IconEdit width={16} height={16} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? t.recurring.editRecurring : t.recurring.addRecurring}>
        <RecurringForm initial={editing} onSaved={() => setOpen(false)} />
      </Modal>
    </div>
  )
}
