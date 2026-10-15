import { useState } from 'react'
import { AppProvider } from './store/AppContext'
import { currentMonthKey } from './utils/helpers'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Income from './components/Income'
import Expenses from './components/Expenses'
import Budget from './components/Budget'
import Recurring from './components/Recurring'
import Reports from './components/Reports'
import Settings from './components/Settings'

function AppContent() {
  const [page, setPage] = useState('dashboard')
  const [month, setMonth] = useState(currentMonthKey())

  const render = () => {
    switch (page) {
      case 'income':
        return <Income month={month} />
      case 'expenses':
        return <Expenses month={month} />
      case 'budget':
        return <Budget month={month} />
      case 'recurring':
        return <Recurring />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard month={month} onNavigate={setPage} />
    }
  }

  return (
    <Layout page={page} month={month} setMonth={setMonth} onNavigate={setPage}>
      {render()}
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
