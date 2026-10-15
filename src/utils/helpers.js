import { monthKey } from '../store/AppContext'

export function formatCurrency(amount, currency = 'BDT') {
  const symbols = { BDT: '৳', USD: '$', EUR: '€', INR: '₹' }
  const symbol = symbols[currency] || '৳'
  const value = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `${symbol} ${value}`
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function todayStr() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

export function currentMonthKey() {
  return monthKey(new Date())
}

export function getMonthTransactions(transactions, key) {
  return transactions.filter((t) => monthKey(t.date) === key)
}

export function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)
}

export function groupByCategory(transactions) {
  const map = {}
  transactions.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + Number(t.amount || 0)
  })
  return map
}

export function getSavingsRecommendation(income, rate = 20) {
  return Math.round((Number(income) * Number(rate)) / 100)
}

export function getBudgetsByMonth(budgets, key) {
  return budgets[key] || {}
}

export function getAvailableMonths(transactions) {
  const set = new Set(transactions.map((t) => monthKey(t.date)))
  set.add(currentMonthKey())
  return Array.from(set).sort().reverse()
}

export function prevMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return monthKey(d)
}

export function nextMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m, 1)
  return monthKey(d)
}

export function getMonthLabel(key, monthsArr) {
  const [y, m] = key.split('-').map(Number)
  return `${monthsArr[m - 1]} ${y}`
}
