import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { translations, defaultCategories } from '../i18n/translations'

const STORAGE_KEY = 'monthly-hisab-v1'

const initialState = {
  language: 'en',
  currency: 'BDT',
  savingsRate: 20,
  categories: defaultCategories,
  transactions: [],
  recurring: [],
  budgets: {},
}

function toDateStr(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function nextOccurrence(dateStr, freq, dayOfMonth, weekday) {
  const d = new Date(dateStr + 'T00:00:00')
  if (freq === 'daily') {
    d.setDate(d.getDate() + 1)
  } else if (freq === 'weekly') {
    d.setDate(d.getDate() + 7)
  } else {
    const targetDay = Math.min(Number(dayOfMonth) || 1, daysInMonth(d.getFullYear(), d.getMonth() + 1))
    d.setMonth(d.getMonth() + 1, 1)
    const lastDay = daysInMonth(d.getFullYear(), d.getMonth())
    d.setDate(Math.min(targetDay, lastDay))
  }
  return toDateStr(d)
}

function getDueDates(recurring, todayStr) {
  if (!recurring.startDate) return []
  const today = new Date(todayStr + 'T00:00:00')
  const end = recurring.endDate ? new Date(recurring.endDate + 'T00:00:00') : today
  if (end < today) return []

  const dates = []
  let cursor
  if (recurring.lastRunDate) {
    cursor = nextOccurrence(recurring.lastRunDate, recurring.frequency, recurring.dayOfMonth, recurring.weekday)
  } else {
    cursor = recurring.startDate
  }

  const limit = recurring.endDate ? recurring.endDate : todayStr
  while (cursor <= limit) {
    if (new Date(cursor + 'T00:00:00') <= today) {
      dates.push(cursor)
    }
    cursor = nextOccurrence(cursor, recurring.frequency, recurring.dayOfMonth, recurring.weekday)
  }
  return dates
}

function getNextRunDate(recurring, todayStr) {
  if (!recurring.startDate) return null
  const today = todayStr
  let cursor
  if (recurring.lastRunDate) {
    cursor = nextOccurrence(recurring.lastRunDate, recurring.frequency, recurring.dayOfMonth, recurring.weekday)
  } else {
    cursor = recurring.startDate
  }
  while (cursor < today) {
    cursor = nextOccurrence(cursor, recurring.frequency, recurring.dayOfMonth, recurring.weekday)
  }
  if (recurring.endDate && cursor > recurring.endDate) return null
  return cursor
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    return { ...initialState, ...parsed }
  } catch {
    return initialState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload }
    case 'SET_SAVINGS_RATE':
      return { ...state, savingsRate: action.payload }
    case 'ADD_TRANSACTION': {
      const txn = { ...action.payload, id: crypto.randomUUID() }
      return { ...state, transactions: [txn, ...state.transactions] }
    }
    case 'UPDATE_TRANSACTION': {
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    }
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      }
    case 'SET_BUDGET': {
      const { category, amount, monthKey } = action.payload
      return {
        ...state,
        budgets: {
          ...state.budgets,
          [monthKey]: { ...(state.budgets[monthKey] || {}), [category]: amount },
        },
      }
    }
    case 'ADD_RECURRING': {
      const rec = { ...action.payload, id: crypto.randomUUID(), lastRunDate: null }
      return { ...state, recurring: [rec, ...state.recurring] }
    }
    case 'UPDATE_RECURRING': {
      return {
        ...state,
        recurring: state.recurring.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      }
    }
    case 'DELETE_RECURRING':
      return {
        ...state,
        recurring: state.recurring.filter((r) => r.id !== action.payload),
      }
    case 'RUN_RECURRING_NOW': {
      const rec = state.recurring.find((r) => r.id === action.payload)
      if (!rec) return state
      const today = toDateStr(new Date())
      const newTxn = {
        id: crypto.randomUUID(),
        type: rec.type,
        amount: rec.amount,
        description: rec.description,
        category: rec.category,
        date: today,
        recurringId: rec.id,
      }
      return {
        ...state,
        transactions: [newTxn, ...state.transactions],
        recurring: state.recurring.map((r) =>
          r.id === rec.id ? { ...r, lastRunDate: today } : r
        ),
      }
    }
    case 'APPLY_RECURRING': {
      const today = toDateStr(new Date())
      const newTransactions = [...state.transactions]
      const updatedRecurring = state.recurring.map((r) => {
        const dueDates = getDueDates(r, today)
        dueDates.forEach((date) => {
          newTransactions.push({
            id: crypto.randomUUID(),
            type: r.type,
            amount: r.amount,
            description: r.description,
            category: r.category,
            date,
            recurringId: r.id,
          })
        })
        const lastRun = dueDates.length ? dueDates[dueDates.length - 1] : r.lastRunDate
        return { ...r, lastRunDate: lastRun }
      })
      return { ...state, transactions: newTransactions, recurring: updatedRecurring }
    }
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] }
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      }
    case 'IMPORT_DATA':
      return { ...initialState, ...action.payload }
    case 'RESET_DATA':
      return { ...initialState, transactions: [], recurring: [], budgets: {} }
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    dispatch({ type: 'APPLY_RECURRING' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const t = translations[state.language]

  const value = useMemo(
    () => ({
      state,
      dispatch,
      t,
    }),
    [state, t]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(key) {
  const [y, m] = key.split('-')
  return `${y}-${m}`
}

export { getNextRunDate, toDateStr }
