import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { formatCurrency, formatDate } from '../utils/helpers'
import { IconEdit, IconTrash, IconArrowUp, IconArrowDown } from './ui/Icons'
import Modal from './ui/Modal'
import TransactionForm from './TransactionForm'

export default function TransactionList({ transactions, type }) {
  const { t, state, dispatch } = useApp()
  const [editing, setEditing] = useState(null)

  const handleDelete = (id) => {
    if (window.confirm(t.common.confirmDelete)) {
      dispatch({ type: 'DELETE_TRANSACTION', payload: id })
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400">{t.common.noData}</p>
      </div>
    )
  }

  return (
    <>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t.common.description}</th>
              <th className="px-4 py-3">{t.common.category}</th>
              <th className="px-4 py-3">{t.common.date}</th>
              <th className="px-4 py-3 text-right">{t.common.amount}</th>
              <th className="px-4 py-3 text-right">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((txn) => {
              const cat = state.categories.find((c) => c.id === txn.category)
              return (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: cat?.color || '#64748b' }}
                      >
                        {type === 'income' ? <IconArrowUp width={16} height={16} /> : <IconArrowDown width={16} height={16} />}
                      </div>
                      <span className="font-medium text-slate-800">{txn.description || t.categories[txn.category]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 text-slate-600">{t.categories[txn.category]}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(txn.date)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(txn.amount, state.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(txn)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600">
                        <IconEdit width={16} height={16} />
                      </button>
                      <button onClick={() => handleDelete(txn.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <IconTrash width={16} height={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={type === 'income' ? t.income.editIncome : t.expenses.editExpense}>
        {editing && (
          <TransactionForm
            type={type}
            initial={editing}
            onSaved={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  )
}
