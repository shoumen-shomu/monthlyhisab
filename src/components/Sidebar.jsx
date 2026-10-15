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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-rose-500 text-white shadow-lg shadow-blue-950/40">
            <IconWallet width={22} height={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">{t.app.name}</h1>
            <p className="text-xs text-slate-400">{t.app.tagline}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { onNavigate(key); onClose() }}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                active === key
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-950/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon width={18} height={18} />
              {t.nav[key]}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()}</p>
            <p className="text-xs font-medium text-slate-200">{t.app.name}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
