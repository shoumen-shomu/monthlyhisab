import { useEffect, useState } from 'react'
import { useApp } from '../store/AppContext'
import { getMonthLabel, prevMonthKey, nextMonthKey } from '../utils/helpers'
import Sidebar from './Sidebar'
import { IconChevronLeft, IconChevronRight, IconMenu, IconMoon, IconSun } from './ui/Icons'

export default function Layout({ children, page, month, setMonth, onNavigate }) {
  const { t, state, dispatch } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('monthly-hisab-theme') || 'light' } catch { return 'light' }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem('monthly-hisab-theme', theme) } catch { /* theme remains available for this session */ }
  }, [theme])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        active={page}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/70 bg-white/75 px-4 py-3 shadow-[0_4px_20px_rgba(30,64,175,0.04)] backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <IconMenu />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMonth(prevMonthKey(month))}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                title="Previous month"
              >
                <IconChevronLeft width={18} height={18} />
              </button>
              <h2 className="min-w-[140px] text-center text-sm font-bold text-slate-800">
                {getMonthLabel(month, t.months)}
              </h2>
              <button
                onClick={() => setMonth(nextMonthKey(month))}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                title="Next month"
              >
                <IconChevronRight width={18} height={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700 dark-toggle"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <IconSun width={16} height={16} /> : <IconMoon width={16} height={16} />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <div className="flex rounded-lg border border-slate-200 p-0.5">
              <button
                onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'en' })}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  state.language === 'en' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'bn' })}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  state.language === 'bn' ? 'bg-brand-600 text-white' : 'text-slate-600'
                }`}
              >
                বাং
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
