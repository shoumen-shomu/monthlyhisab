import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { formatCurrency, getMonthTransactions, groupByCategory, getBudgetsByMonth } from '../utils/helpers'
import Modal from './ui/Modal'
import { IconPlus, IconEdit } from './ui/Icons'

export default function Budget({ month }) {
  const { t, state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [editCat, setEditCat] = useState(null)
  const [amount, setAmount] = useState('')

  const budgets = getBudgetsByMonth(state.budgets, month)
  const expenseTxn = useMemo(() => getMonthTransactions(state.transactions, month).filter((t) => t.type === 'expense'), [state.transactions, month])
  const spentByCat = groupByCategory(expenseTxn)

  const expenseCategories = state.categories.filter((c) => c.type === 'expense')
  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v), 0)
  const totalSpent = expenseTxn.reduce((s, t) => s + Number(t.amount), 0)

  const openBudgetModal = (catId) => {
    setEditCat(catId)
    setAmount(budgets[catId] ? String(budgets[catId]) : '')
    setOpen(true)
  }

  const save = (e) => {
    e.preventDefault()
    dispatch({
      type: 'SET_BUDGET',
      payload: { category: editCat, amount: Number(amount) || 0, monthKey: month },
    })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t.budget.title}</h1>
          <p className="text-sm text-slate-500">{t.budget.subtitle}</p>
        </div>
      </div>

      {(totalBudget > 0 || totalSpent > 0) && (
        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.budget.overallProgress}</h3>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.budget.spent}</p>
              <p className="text-2xl font-extrabold text-slate-800">{formatCurrency(totalSpent, state.currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{t.budget.budget}</p>
              <p className="text-2xl font-extrabold text-brand-600">{formatCurrency(totalBudget, state.currency)}</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? 'bg-rose-500' : 'bg-brand-500'}`}
              style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {expenseCategories.map((cat) => {
          const budget = Number(budgets[cat.id] || 0)
          const spent = Number(spentByCat[cat.id] || 0)
          const remaining = budget - spent
          const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
          const over = spent > budget

          return (
            <div key={cat.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-slate-800">{t.categories[cat.id]}</span>
                </div>
                <button
                  onClick={() => openBudgetModal(cat.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                >
                  {budget > 0 ? <IconEdit width={16} height={16} /> : <IconPlus width={16} height={16} />}
                </button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{t.budget.spent}: {formatCurrency(spent, state.currency)}</span>
                  <span>{t.budget.budget}: {formatCurrency(budget, state.currency)}</span>
                </div>
                {budget > 0 ? (
                  <>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className={`mt-2 text-xs font-semibold ${over ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {over
                        ? `${formatCurrency(spent - budget, state.currency)} over`
                        : `${formatCurrency(remaining, state.currency)} ${t.budget.remaining}`}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editCat ? t.budget.editBudget : t.budget.setBudget}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">{t.common.category}</label>
            <input
              type="text"
              className="input bg-slate-50"
              value={editCat ? t.categories[editCat] : ''}
              disabled
            />
          </div>
          <div>
            <label className="label">{t.budget.budget}</label>
            <input
              type="number"
              min="0"
              className="input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">{t.common.cancel}</button>
            <button type="submit" className="btn-primary">{t.common.save}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
