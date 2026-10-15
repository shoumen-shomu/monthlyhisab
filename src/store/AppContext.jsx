import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'
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
  const [state, dispatch] = useReducer(reducer, initialState)
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [loginRequired, setLoginRequired] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    let active = true
    async function loadRemoteState() {
      try {
        const response = await fetch('/api/data')
        if (response.status === 401) {
          if (active) setLoginRequired(true)
          return
        }
        if (!response.ok) throw new Error('Could not connect to the data server.')
        const { state: remoteState } = await response.json()
        let nextState = remoteState
        if (!nextState) {
          nextState = loadState()
          const saveResponse = await fetch('/api/data', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: nextState }),
          })
          if (!saveResponse.ok) throw new Error('Could not initialize data in MongoDB.')
        }
        if (active) {
          dispatch({ type: 'IMPORT_DATA', payload: nextState })
          setReady(true)
        }
      } catch (error) {
        if (active) setSyncError(error.message || 'Database synchronization failed.')
      }
    }
    loadRemoteState()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/data', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state }),
        })
        if (!response.ok) throw new Error('Could not save to MongoDB.')
        setSyncError('')
      } catch (error) {
        setSyncError(error.message || 'Database synchronization failed.')
      }
    }, 250)
    return () => clearTimeout(timeout)
  }, [state, ready])

  useEffect(() => {
    if (!ready) return
    dispatch({ type: 'APPLY_RECURRING' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const t = translations[state.language]

  const value = useMemo(
    () => ({
      state,
      dispatch,
      t,
      syncError,
      ready,
    }),
    [state, t, syncError, ready]
  )

  if (!ready) {
    if (loginRequired) {
      return (
        <form
          className="flex min-h-screen items-center justify-center p-6"
          onSubmit={async (event) => {
            event.preventDefault()
            setSyncError('')
            try {
              const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
              })
              if (!response.ok) throw new Error('Incorrect password.')
              window.location.reload()
            } catch (error) {
              setSyncError(error.message)
            }
          }}
        >
          <div className="card w-full max-w-sm p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-rose-500 text-lg font-black text-white shadow-lg shadow-blue-200">MH</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Monthly Hisab</h1>
            <p className="mt-2 text-sm text-slate-500">Enter your app password to access your data.</p>
            <input className="input mt-5" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {syncError && <p className="mt-2 text-sm text-rose-600">{syncError}</p>}
            <button className="btn-primary mt-4 w-full justify-center" type="submit">Continue</button>
          </div>
        </form>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="text-xl font-bold text-slate-800">{syncError ? 'Database connection required' : 'Loading your data…'}</h1>
          {syncError && <p className="mt-3 text-sm text-rose-600">{syncError} Check your MongoDB connection and restart the server.</p>}
        </div>
      </div>
    )
  }

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
