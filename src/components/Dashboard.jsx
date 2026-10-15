import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext'
import {
  formatCurrency, getMonthTransactions, sumByType, groupByCategory,
  getSavingsRecommendation, getBudgetsByMonth, formatDate,
} from '../utils/helpers'
import Modal from './ui/Modal'
import { IconArrowUp, IconArrowDown, IconWallet, IconPiggy, IconPlus } from './ui/Icons'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import TransactionForm from './TransactionForm'

export default function Dashboard({ month, onNavigate }) {
  const { t, state } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState('expense')

  const monthTxn = useMemo(() => getMonthTransactions(state.transactions, month), [state.transactions, month])
  const income = useMemo(() => sumByType(monthTxn, 'income'), [monthTxn])
  const expenses = useMemo(() => sumByType(monthTxn, 'expense'), [monthTxn])
  const savings = income - expenses
  const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0
  const recommended = getSavingsRecommendation(income, state.savingsRate)
  const budgets = getBudgetsByMonth(state.budgets, month)
  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v), 0)

  const byCategory = useMemo(() => groupByCategory(monthTxn.filter((t) => t.type === 'expense')), [monthTxn])
  const categoryData = Object.entries(byCategory)
    .map(([id, value]) => ({
      name: t.categories[id] || id,
      value,
      color: state.categories.find((c) => c.id === id)?.color || '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  const recent = [...monthTxn].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6)

  const cards = [
    {
      label: t.dashboard.balance,
      value: formatCurrency(savings, state.currency),
      icon: IconWallet,
      color: 'bg-blue-50 text-blue-600',
      accent: 'from-blue-500 to-blue-300',
    },
    {
      label: t.dashboard.income,
      value: formatCurrency(income, state.currency),
      icon: IconArrowUp,
      color: 'bg-emerald-50 text-emerald-600',
      accent: 'from-blue-500 to-cyan-300',
    },
    {
      label: t.dashboard.expenses,
      value: formatCurrency(expenses, state.currency),
      icon: IconArrowDown,
      color: 'bg-rose-50 text-rose-600',
      accent: 'from-rose-500 to-orange-300',
    },
    {
      label: t.dashboard.savings,
      value: `${formatCurrency(savings, state.currency)} (${savingsRate}%)`,
      icon: IconPiggy,
      color: savings >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600',
      accent: savings >= 0 ? 'from-blue-500 to-rose-400' : 'from-rose-500 to-orange-300',
    },
  ]

  const openForm = (type) => {
    setFormType(type)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-hero relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-700 via-blue-600 to-rose-600 px-6 py-7 text-white shadow-xl shadow-blue-900/15 sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full border-[36px] border-white/10" />
        <div className="pointer-events-none absolute bottom-[-5.5rem] right-[28%] -z-10 h-44 w-44 rounded-full bg-rose-400/25 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">{t.app.name}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{t.dashboard.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-blue-50 sm:text-base">{t.app.tagline}</p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card relative overflow-hidden p-5">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} />
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon width={20} height={20} />
            </div>
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-800">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">{t.dashboard.recommendedSavings}</h3>
            <span className="badge bg-brand-50 text-brand-600">{state.savingsRate}% {t.dashboard.ofIncome}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{t.dashboard.basedOnRule}</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">{t.dashboard.youShouldSave}</p>
              <p className="text-3xl font-extrabold text-brand-600">{formatCurrency(recommended, state.currency)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openForm('income')} className="btn-primary">
                <IconPlus width={16} height={16} /> {t.dashboard.addIncome}
              </button>
              <button onClick={() => openForm('expense')} className="btn-ghost border border-rose-200 text-rose-700 hover:bg-rose-50">
                <IconPlus width={16} height={16} /> {t.dashboard.addExpense}
              </button>
            </div>
          </div>
          {income > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{t.dashboard.savings}: {formatCurrency(savings, state.currency)}</span>
                <span>{savingsRate}%</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${savings >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-slate-800">{t.dashboard.budgetProgress}</h3>
          {totalBudget > 0 ? (
            <>
              <p className="mt-1 text-xs text-slate-500">
                {formatCurrency(expenses, state.currency)} / {formatCurrency(totalBudget, state.currency)}
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${expenses > totalBudget ? 'bg-rose-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(100, (expenses / totalBudget) * 100)}%` }}
                />
              </div>
              <p className={`mt-2 text-xs font-semibold ${expenses > totalBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
                {expenses > totalBudget ? t.dashboard.overBudget : t.dashboard.withinBudget}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400">{t.common.noData}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-bold text-slate-800">{t.dashboard.spendingByCategory}</h3>
          {categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, state.currency)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="flex h-64 items-center justify-center text-sm text-slate-400">{t.common.noData}</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-bold text-slate-800">{t.dashboard.incomeVsExpense}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: t.dashboard.thisMonth, income, expenses }]}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v, state.currency)} />
                <Bar dataKey="income" name={t.dashboard.income} fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name={t.dashboard.expenses} fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">{t.dashboard.recentTxn}</h3>
          <button onClick={() => onNavigate('expenses')} className="text-xs font-semibold text-brand-600 hover:underline">
            {t.dashboard.viewAll} →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t.common.noData}</p>
        ) : (
          <div className="space-y-2">
            {recent.map((txn) => {
              const cat = state.categories.find((c) => c.id === txn.category)
              const isIncome = txn.type === 'income'
              return (
                <div key={txn.id} className="flex items-center justify-between rounded-xl p-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      {isIncome ? <IconArrowUp width={18} height={18} /> : <IconArrowDown width={18} height={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{txn.description || t.categories[txn.category]}</p>
                      <p className="text-xs text-slate-500">{formatDate(txn.date)} · {t.categories[txn.category]}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(txn.amount, state.currency)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={formType === 'income' ? t.income.addIncome : t.expenses.addExpense}>
        <TransactionForm
          type={formType}
          defaultDate={new Date().toISOString().slice(0, 10)}
          onSaved={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  )
}
