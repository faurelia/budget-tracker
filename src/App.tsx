import { useEffect } from 'react'
import { Notice } from './components/ui/Notice'
import { MonthPicker } from './components/ui/MonthPicker'
import { ThemeCycleButton } from './components/ui/ThemeToggle'
import {
  DashboardIcon,
  ReceiptIcon,
  SlidersIcon,
  WalletIcon,
} from './components/icons'
import { BudgetsPage } from './features/budgets/BudgetsPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TransactionsPage } from './features/transactions/TransactionsPage'
import { cn } from './lib/cn'
import { useHashRoute } from './lib/useHashRoute'
import { useBudget } from './store/budgetContext'
import { useMonth } from './store/monthContext'
import type { Route } from './types'

const NAV = [
  { route: 'dashboard' as const, label: 'Dashboard', Icon: DashboardIcon },
  { route: 'transactions' as const, label: 'Transactions', Icon: ReceiptIcon },
  { route: 'budgets' as const, label: 'Budgets', Icon: WalletIcon },
  { route: 'settings' as const, label: 'Settings', Icon: SlidersIcon },
]

const PAGE_TITLES: Record<Route, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  budgets: 'Budgets',
  settings: 'Settings',
}

export default function App() {
  const route = useHashRoute()
  const { loadError, saveError, dismissLoadError, dismissSaveError } =
    useBudget()
  const { month, setMonth } = useMonth()

  useEffect(() => {
    document.title = `${PAGE_TITLES[route]} · Sum`
  }, [route])

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1160px] items-center gap-3 px-4 sm:h-16 sm:gap-6 sm:px-6 lg:px-8">
          <a
            href="#/dashboard"
            className="flex shrink-0 items-baseline gap-2 text-ink"
            aria-label="Sum, monthly ledger"
          >
            <span className="text-[21px] leading-none font-semibold tracking-[-0.04em]">
              Sum<span className="text-brass">.</span>
            </span>
            <span className="hidden text-[10.5px] tracking-[0.01em] text-muted sm:inline">
              monthly ledger
            </span>
          </a>

          <nav aria-label="Main" className="hidden self-stretch lg:flex">
            {NAV.map(({ route: target, label }) => {
              const active = route === target
              return (
                <a
                  key={target}
                  href={`#/${target}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center px-3 text-[12.5px] font-medium transition-colors',
                    active
                      ? 'text-ink after:absolute after:inset-x-2.5 after:bottom-0 after:h-[2px] after:bg-brand'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {label}
                </a>
              )
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <MonthPicker month={month} onChange={setMonth} />
            <ThemeCycleButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1160px] px-4 pt-6 pb-28 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">
        {loadError || saveError ? (
          <div className="mb-5 space-y-2">
            {loadError ? (
              <Notice
                tone="warning"
                title="Storage notice"
                onDismiss={dismissLoadError}
              >
                {loadError}
              </Notice>
            ) : null}
            {saveError ? (
              <Notice
                tone="danger"
                title="Changes aren’t being saved"
                onDismiss={dismissSaveError}
              >
                {saveError}
              </Notice>
            ) : null}
          </div>
        ) : null}

        <div key={route} className="page-enter">
          {route === 'dashboard' ? <DashboardPage /> : null}
          {route === 'transactions' ? <TransactionsPage /> : null}
          {route === 'budgets' ? <BudgetsPage /> : null}
          {route === 'settings' ? <SettingsPage /> : null}
        </div>
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-4">
          {NAV.map(({ route: target, label, Icon }) => {
            const active = route === target
            return (
              <a
                key={target}
                href={`#/${target}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition-colors',
                  active ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-6 top-0 h-[2px] bg-brand"
                    aria-hidden="true"
                  />
                ) : null}
                <Icon size={18} />
                {label}
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
