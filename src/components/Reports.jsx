import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { monthKey } from '../store/AppContext'
import { formatCurrency, sumByType, groupByCategory, getMonthLabel } from '../utils/helpers'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

export default function Reports() {
  const { t, state } = useApp()

  const monthlyData = useMemo(() => {
    const map = {}
    state.transactions.forEach((txn) => {
      const k = monthKey(txn.date)
      if (!map[k]) map[k] = { income: 0, expense: 0 }
      if (txn.type === 'income') map[k].income += Number(txn.amount)
      else map[k].expense += Number(txn.amount)
    })
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, v]) => ({
        name: getMonthLabel(key, t.months),
        income: v.income,
        expense: v.expense,
        savings: v.income - v.expense,
      }))
  }, [state.transactions, t.months])

  const totals = useMemo(() => {
    const income = sumByType(state.transactions, 'income')
    const expense = sumByType(state.transactions, 'expense')
    return { income, expense, saved: income - expense }
  }, [state.transactions])

  const avgIncome = monthlyData.length ? Math.round(totals.income / monthlyData.length) : 0
  const avgExpense = monthlyData.length ? Math.round(totals.expense / monthlyData.length) : 0

  const bestMonth = useMemo(() => {
    if (monthlyData.length === 0) return null
    return monthlyData.reduce((best, m) => (m.savings > best.savings ? m : best), monthlyData[0])
  }, [monthlyData])

  const allExpenses = state.transactions.filter((t) => t.type === 'expense')
  const catMap = groupByCategory(allExpenses)
  const topCategory = useMemo(() => {
    const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    if (entries.length === 0) return null
    const [id, value] = entries[0]
    return { id, value, color: state.categories.find((c) => c.id === id)?.color }
  }, [catMap, state.categories])

  const pieData = Object.entries(catMap)
    .map(([id, value]) => ({
      name: t.categories[id] || id,
      value,
      color: state.categories.find((c) => c.id === id)?.color || '#64748b',
    }))
    .sort((a, b) => b.value - a.value)

  const statCards = [
    { label: t.reports.avgIncome, value: formatCurrency(avgIncome, state.currency), color: 'text-emerald-600' },
    { label: t.reports.avgExpense, value: formatCurrency(avgExpense, state.currency), color: 'text-rose-600' },
    { label: t.reports.totalSaved, value: formatCurrency(totals.saved, state.currency), color: 'text-brand-600' },
    { label: t.reports.bestSavingMonth, value: bestMonth?.name || '—', sub: bestMonth ? formatCurrency(bestMonth.savings, state.currency) : '', color: 'text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">{t.reports.title}</h1>
        <p className="text-sm text-slate-500">{t.reports.subtitle}</p>
      </div>

      {monthlyData.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">{t.common.noData}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((c) => (
              <div key={c.label} className="card p-5">
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
                <p className={`mt-1 text-xl font-extrabold ${c.color}`}>{c.value}</p>
                {c.sub && <p className="text-xs text-slate-500">{c.sub}</p>}
              </div>
            ))}
          </div>

          <div className="card p-6">
            <h3 className="mb-4 font-bold text-slate-800">{t.reports.monthlyTrend}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v, state.currency)} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name={t.dashboard.income} stroke="#22c55e" fill="url(#gIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name={t.dashboard.expenses} stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {topCategory && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="card p-6 lg:col-span-2">
                <h3 className="mb-4 font-bold text-slate-800">{t.reports.categoryBreakdown}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v, state.currency)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-slate-800">{t.reports.topCategory}</h3>
                <div className="mt-4 flex flex-col items-center text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: topCategory.color }}
                  >
                    <span className="text-xl font-bold">{t.categories[topCategory.id]?.charAt(0) || '#'}</span>
                  </div>
                  <p className="mt-3 font-semibold text-slate-800">{t.categories[topCategory.id]}</p>
                  <p className="text-2xl font-extrabold text-rose-600">{formatCurrency(topCategory.value, state.currency)}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
