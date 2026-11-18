import { useEffect } from 'react'
import { Notice } from './components/ui/Notice'
import { MonthPicker } from './components/ui/MonthPicker'
import { ThemeCycleButton, ThemeToggle } from './components/ui/ThemeToggle'
import {
  DashboardIcon,
  LogoIcon,
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

const PAGE_META: Record<Route, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Where this month’s money is going.',
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Every expense in the selected month.',
  },
  budgets: {
    title: 'Budgets',
    subtitle: 'A monthly ceiling for each category.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Preferences, categories, and your data.',
  },
}

export default function App() {
  const route = useHashRoute()
  const { loadError, saveError, dismissLoadError, dismissSaveError } =
    useBudget()
  const { month, setMonth } = useMonth()
  const meta = PAGE_META[route]

  useEffect(() => {
    document.title = `${meta.title} — Budget Tracker`
  }, [meta.title])

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-xl bg-brand text-brand-ink shadow-card">
            <LogoIcon size={20} />
          </span>
          <div>
            <p className="text-sm leading-tight font-semibold">Budget Tracker</p>
            <p className="text-[11px] text-muted">Local-first budgeting</p>
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 py-1">
          {NAV.map(({ route: target, label, Icon }) => {
            const active = route === target
            return (
              <a
                key={target}
                href={`#/${target}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-soft text-brand-soft-ink'
                    : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <Icon size={17} />
                {label}
              </a>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-line px-4 py-4">
          <ThemeToggle showLabels />
          <p className="text-[11px] leading-relaxed text-muted">
            Saved in this browser. Export a CSV from Settings to keep a backup.
          </p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div className="flex items-center gap-2.5 lg:hidden">
              <span className="grid size-8 place-items-center rounded-lg bg-brand text-brand-ink">
                <LogoIcon size={17} />
              </span>
              <span className="text-sm font-semibold">Budget Tracker</span>
            </div>

            <div className="hidden min-w-0 lg:block">
              <h1 className="truncate text-lg leading-tight font-semibold">
                {meta.title}
              </h1>
              <p className="truncate text-xs text-muted">{meta.subtitle}</p>
            </div>

            <div className="flex items-center gap-2">
              <MonthPicker month={month} onChange={setMonth} />
              <div className="lg:hidden">
                <ThemeCycleButton />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-24 lg:px-8 lg:pb-16">
          <div className="mb-4 lg:hidden">
            <h1 className="text-xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-xs text-muted">{meta.subtitle}</p>
          </div>

          {loadError || saveError ? (
            <div className="mb-4 space-y-2">
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
      </div>

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
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-brand' : 'text-muted hover:text-ink',
                )}
              >
                <Icon size={19} />
                {label}
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
