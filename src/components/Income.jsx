import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import { formatCurrency, getMonthTransactions, sumByType } from '../utils/helpers'
import TransactionList from './TransactionList'
import Modal from './ui/Modal'
import TransactionForm from './TransactionForm'
import { IconPlus } from './ui/Icons'

export default function Income({ month }) {
  const { t, state } = useApp()
  const [open, setOpen] = useState(false)

  const txn = useMemo(() => getMonthTransactions(state.transactions, month).filter((t) => t.type === 'income'), [state.transactions, month])
  const total = useMemo(() => sumByType(txn, 'income'), [txn])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{t.income.title}</h1>
          <p className="text-sm text-slate-500">{t.income.totalIncome}: <span className="font-bold text-emerald-600">{formatCurrency(total, state.currency)}</span></p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          <IconPlus width={16} height={16} /> {t.income.addIncome}
        </button>
      </div>

      <TransactionList transactions={txn} type="income" />

      <Modal open={open} onClose={() => setOpen(false)} title={t.income.addIncome}>
        <TransactionForm type="income" onSaved={() => setOpen(false)} />
      </Modal>
    </div>
  )
}
