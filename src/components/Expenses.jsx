import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { formatCurrency, getMonthTransactions, sumByType, groupByCategory, todayStr } from '../utils/helpers'
import TransactionList from './TransactionList'
import Modal from './ui/Modal'
import TransactionForm from './TransactionForm'
import { IconPlus } from './ui/Icons'

export default function Expenses({ month }) {
  const { t, state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const [largeOpen, setLargeOpen] = useState(false)
  const [dailyDate, setDailyDate] = useState(() => {
    const today = todayStr()
    return today.startsWith(month) ? today : `${month}-01`
  })
  const [dailyForm, setDailyForm] = useState({
    amount: '',
    description: '',
    category: state.categories.find((category) => category.type === 'expense')?.id || '',
  })

  useEffect(() => {
    const today = todayStr()
    setDailyDate(today.startsWith(month) ? today : `${month}-01`)
  }, [month])

  const txn = useMemo(() => getMonthTransactions(state.transactions, month).filter((t) => t.type === 'expense'), [state.transactions, month])
  const total = useMemo(() => sumByType(txn, 'expense'), [txn])
  const dailyTxn = useMemo(() => txn.filter((transaction) => transaction.expenseKind === 'daily'), [txn])
  const largeTxn = useMemo(() => txn.filter((transaction) => transaction.expenseKind === 'large'), [txn])
  const otherTxn = useMemo(() => txn.filter((transaction) => !transaction.expenseKind), [txn])
  const byCat = useMemo(() => groupByCategory(txn), [txn])
  const dailyTotal = useMemo(
    () => sumByType(dailyTxn, 'expense'),
    [dailyTxn]
  )
  const selectedDayTotal = useMemo(
    () => sumByType(dailyTxn.filter((transaction) => transaction.date === dailyDate), 'expense'),
    [dailyTxn, dailyDate]
  )
  const largeTotal = useMemo(() => sumByType(largeTxn, 'expense'), [largeTxn])
  const catSummary = Object.entries(byCat)
    .map(([id, value]) => ({ id, value, color: state.categories.find((c) => c.id === id)?.color }))
    .sort((a, b) => b.value - a.value)

  const expenseCategories = state.categories.filter((category) => category.type === 'expense')

  const addDailyExpense = (event) => {
    event.preventDefault()
    if (!dailyForm.amount || !dailyForm.category || !dailyDate) return

    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        type: 'expense',
        amount: Number(dailyForm.amount),
        description: dailyForm.description,
        category: dailyForm.category,
        date: dailyDate,
        expenseKind: 'daily',
      },
    })
    setDailyForm((form) => ({ ...form, amount: '', description: '' }))
  }

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

      {expenseCategories.length > 0 && (
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t.expenses.dailyExpense}</h2>
              <p className="text-sm text-slate-500">{t.expenses.dailyExpenseHint}</p>
            </div>
            <div className="flex gap-4">
              <div className="rounded-xl bg-rose-50 px-4 py-2 text-right">
                <p className="text-xs font-medium text-rose-600">{t.expenses.monthDailyTotal}</p>
                <p className="font-bold text-rose-700">{formatCurrency(dailyTotal, state.currency)}</p>
              </div>
              <div className="rounded-xl bg-rose-50 px-4 py-2 text-right">
                <p className="text-xs font-medium text-rose-600">{t.expenses.dayTotal}</p>
                <p className="font-bold text-rose-700">{formatCurrency(selectedDayTotal, state.currency)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={addDailyExpense} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">{t.common.amount} *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input"
                placeholder="0"
                value={dailyForm.amount}
                onChange={(event) => setDailyForm((form) => ({ ...form, amount: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">{t.common.description}</label>
              <input
                type="text"
                className="input"
                placeholder={t.expenses.dailyExpensePlaceholder}
                value={dailyForm.description}
                onChange={(event) => setDailyForm((form) => ({ ...form, description: event.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t.common.category} *</label>
              <select
                className="input"
                value={dailyForm.category}
                onChange={(event) => setDailyForm((form) => ({ ...form, category: event.target.value }))}
                required
              >
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {t.categories[category.id] || category.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t.common.date} *</label>
              <input
                type="date"
                className="input"
                value={dailyDate}
                onChange={(event) => setDailyDate(event.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <button type="submit" className="btn-primary">
                <IconPlus width={16} height={16} /> {t.expenses.addDailyExpense}
              </button>
            </div>
          </form>
          <div className="mt-5">
            <TransactionList transactions={dailyTxn} type="expense" />
          </div>
        </section>
      )}

      {expenseCategories.length > 0 && (
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t.expenses.largeExpense}</h2>
              <p className="text-sm text-slate-500">{t.expenses.largeExpenseHint}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 px-4 py-2 text-right">
                <p className="text-xs font-medium text-amber-700">{t.expenses.largeExpenseTotal}</p>
                <p className="font-bold text-amber-800">{formatCurrency(largeTotal, state.currency)}</p>
              </div>
              <button onClick={() => setLargeOpen(true)} className="btn-primary">
                <IconPlus width={16} height={16} /> {t.expenses.addLargeExpense}
              </button>
            </div>
          </div>
          <TransactionList transactions={largeTxn} type="expense" />
        </section>
      )}

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

      {otherTxn.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">{t.expenses.otherExpenses}</h2>
          <TransactionList transactions={otherTxn} type="expense" />
        </section>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t.expenses.addExpense}>
        <TransactionForm type="expense" onSaved={() => setOpen(false)} />
      </Modal>
      <Modal open={largeOpen} onClose={() => setLargeOpen(false)} title={t.expenses.addLargeExpense}>
        <TransactionForm
          type="expense"
          expenseKind="large"
          defaultDate={dailyDate}
          onSaved={() => setLargeOpen(false)}
        />
      </Modal>
    </div>
  )
}
