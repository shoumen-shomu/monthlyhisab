import { useApp } from '../store/AppContext'
import {
  IconDashboard, IconIncome, IconExpense, IconBudget, IconReport, IconSettings, IconWallet, IconRepeat,
} from './ui/Icons'

const items = [
  { key: 'dashboard', icon: IconDashboard },
  { key: 'income', icon: IconIncome },
  { key: 'expenses', icon: IconExpense },
  { key: 'budget', icon: IconBudget },
  { key: 'recurring', icon: IconRepeat },
  { key: 'reports', icon: IconReport },
  { key: 'settings', icon: IconSettings },
]

export default function Sidebar({ active, onNavigate, mobileOpen, onClose }) {
  const { t } = useApp()

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-200 transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <IconWallet width={22} height={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">{t.app.name}</h1>
            <p className="text-xs text-slate-500">{t.app.tagline}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { onNavigate(key); onClose() }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                active === key
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon width={18} height={18} />
              {t.nav[key]}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()}</p>
            <p className="text-xs font-medium text-slate-700">{t.app.name}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
