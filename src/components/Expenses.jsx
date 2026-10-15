import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { formatCurrency, getMonthTransactions, sumByType, groupByCategory } from '../utils/helpers'
import TransactionList from './TransactionList'
import Modal from './ui/Modal'
import TransactionForm from './TransactionForm'
import { IconPlus } from './ui/Icons'

export default function Expenses({ month }) {
  const { t, state } = useApp()
  const [open, setOpen] = useState(false)

  const txn = useMemo(() => getMonthTransactions(state.transactions, month).filter((t) => t.type === 'expense'), [state.transactions, month])
  const total = useMemo(() => sumByType(txn, 'expense'), [txn])
  const byCat = useMemo(() => groupByCategory(txn), [txn])
  const catSummary = Object.entries(byCat)
    .map(([id, value]) => ({ id, value, color: state.categories.find((c) => c.id === id)?.color }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t.expenses.title}</h1>
          <p className="text-sm text-slate-500">{t.expenses.totalExpenses}: <span className="font-bold text-rose-600">{formatCurrency(total, state.currency)}</span></p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <IconPlus width={16} height={16} /> {t.expenses.addExpense}
        </button>
      </div>

      {catSummary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {catSummary.map(({ id, value, color }) => (
            <div key={id} className="card p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <p className="text-xs font-medium text-slate-500">{t.categories[id]}</p>
              </div>
              <p className="mt-1 text-lg font-bold text-slate-800">{formatCurrency(value, state.currency)}</p>
            </div>
          ))}
        </div>
      )}

      <TransactionList transactions={txn} type="expense" />

      <Modal open={open} onClose={() => setOpen(false)} title={t.expenses.addExpense}>
        <TransactionForm type="expense" onSaved={() => setOpen(false)} />
      </Modal>
    </div>
  )
}
