import { useState, useRef } from 'react'
import { useApp } from '../store/AppContext'
import { IconPlus, IconTrash } from './ui/Icons'

const COLORS = ['#f97316', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#10b981', '#06b6d4', '#a855f7', '#eab308', '#64748b']

export default function Settings() {
  const { t, state, dispatch } = useApp()
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', color: COLORS[0] })
  const fileRef = useRef(null)

  const addCategory = (e) => {
    e.preventDefault()
    if (!newCat.name.trim()) return
    const id = newCat.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36)
    dispatch({ type: 'ADD_CATEGORY', payload: { id, name: newCat.name, type: newCat.type, color: newCat.color } })
    setNewCat({ name: '', type: 'expense', color: COLORS[0] })
  }

  const exportData = () => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monthly-hisab-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (confirm(t.settings.resetDataDesc + ' ' + t.common.yes + '?')) {
          dispatch({ type: 'IMPORT_DATA', payload: data })
        }
      } catch {
        alert('Invalid file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const resetData = () => {
    if (confirm(t.settings.resetDataDesc + ' ' + t.common.yes + '?')) {
      dispatch({ type: 'RESET_DATA' })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">{t.settings.title}</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.settings.language}</h3>
          <p className="mt-1 text-xs text-slate-500">{t.settings.language}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'bn', label: 'বাংলা' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: l.code })}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  state.language === l.code
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.settings.currency}</h3>
          <div className="mt-4">
            <select
              className="input"
              value={state.currency}
              onChange={(e) => dispatch({ type: 'SET_CURRENCY', payload: e.target.value })}
            >
              <option value="BDT">৳ BDT (Bangladeshi Taka)</option>
              <option value="USD">$ USD (US Dollar)</option>
              <option value="EUR">€ EUR (Euro)</option>
              <option value="INR">₹ INR (Indian Rupee)</option>
            </select>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.settings.savingsRule}</h3>
          <p className="mt-1 text-xs text-slate-500">{t.settings.savingsRuleDesc}</p>
          <div className="mt-4">
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={state.savingsRate}
              onChange={(e) => dispatch({ type: 'SET_SAVINGS_RATE', payload: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-slate-500">5%</span>
              <span className="font-bold text-brand-600">{state.savingsRate}%</span>
              <span className="text-slate-500">50%</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.settings.data}</h3>
          <div className="mt-4 space-y-3">
            <button onClick={exportData} className="btn-ghost w-full justify-start border border-slate-200">
              📥 {t.settings.exportData}
            </button>
            <button onClick={() => fileRef.current?.click()} className="btn-ghost w-full justify-start border border-slate-200">
              📤 {t.settings.importData}
            </button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importData} className="hidden" />
            <button onClick={resetData} className="btn-danger w-full justify-start">
              🗑️ {t.settings.resetData}
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-slate-800">{t.settings.categories}</h3>

        <form onSubmit={addCategory} className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            className="input sm:col-span-1"
            placeholder={t.settings.categoryName}
            value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
          />
          <select
            className="input"
            value={newCat.type}
            onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
          >
            <option value="expense">{t.settings.expense}</option>
            <option value="income">{t.settings.incomeType}</option>
          </select>
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCat({ ...newCat, color: c })}
                className={`h-7 w-7 rounded-full border-2 ${newCat.color === c ? 'border-slate-800' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button type="submit" className="btn-primary">
            <IconPlus width={16} height={16} /> {t.settings.addCategory}
          </button>
        </form>

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {state.categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium text-slate-700">{t.categories[cat.id] || cat.name || cat.id}</span>
                <span className={`badge ${cat.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {cat.type === 'income' ? t.settings.incomeType : t.settings.expense}
                </span>
              </div>
              <button
                onClick={() => {
                if (confirm(t.common.confirmDelete)) dispatch({ type: 'DELETE_CATEGORY', payload: cat.id })
              }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <IconTrash width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
