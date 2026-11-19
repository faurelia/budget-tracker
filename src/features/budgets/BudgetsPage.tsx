import { useMemo, useState } from 'react'
import { CategoryAvatar } from '../../components/CategoryChip'
import { PageHeader } from '../../components/PageHeader'
import { Button, LinkButton } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Field'
import { ProgressBar } from '../../components/ui/Progress'
import { useToast } from '../../components/ui/toastContext'
import { cn } from '../../lib/cn'
import { daysInMonth, elapsedDays, monthLabel } from '../../lib/date'
import {
  centsToInput,
  currencySymbol,
  formatMoney,
  formatPercent,
  parseAmountToCents,
} from '../../lib/money'
import { remainingTextTone } from '../../lib/progress'
import { monthSummary, type CategoryBudgetRow } from '../../lib/selectors'
import { useBudget } from '../../store/budgetContext'
import { useMonth } from '../../store/monthContext'
import type { Category } from '../../types'

function BudgetRow({
  category,
  limitCents,
  spentCents,
  ratio,
  remainingCents,
  currency,
}: {
  category: Category
  limitCents: number
  spentCents: number
  ratio: number
  remainingCents: number
  currency: string
}) {
  const { dispatch } = useBudget()
  const toast = useToast()
  // Keep the editable draft in step with the stored limit (for example after
  // "Clear all limits") without an effect, which would remount and drop focus.
  const [draft, setDraft] = useState(() => centsToInput(limitCents))
  const [syncedLimit, setSyncedLimit] = useState(limitCents)
  if (limitCents !== syncedLimit) {
    setSyncedLimit(limitCents)
    setDraft(centsToInput(limitCents))
  }

  const commit = () => {
    if (draft.trim() === '') {
      setDraft('')
      if (limitCents !== 0) {
        dispatch({ type: 'budget/set', categoryId: category.id, limitCents: 0 })
      }
      return
    }

    const parsed = parseAmountToCents(draft)
    if (parsed === null) {
      toast.push('Enter a valid limit, like 250.', 'error')
      setDraft(centsToInput(limitCents))
      return
    }

    const next = Math.abs(Math.round(parsed))
    setDraft(centsToInput(next))
    if (next !== limitCents) {
      dispatch({ type: 'budget/set', categoryId: category.id, limitCents: next })
    }
  }

  const symbol = currencySymbol(currency)
  const leftText =
    limitCents === 0
      ? 'No limit'
      : remainingCents < 0
        ? `${formatMoney(-remainingCents, currency)} over`
        : `${formatMoney(remainingCents, currency)} left`

  return (
    <li className="px-5 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 lg:grid lg:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_7.5rem] lg:items-center lg:gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <CategoryAvatar category={category} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{category.name}</p>
            <p className="text-[10.5px] text-muted lg:hidden">
              {spentCents === 0
                ? 'No spending yet'
                : `${formatMoney(spentCents, currency)} spent`}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5">
          <div className="relative w-32 lg:w-36">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] text-muted">
              {symbol}
            </span>
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commit()
                }
              }}
              inputMode="decimal"
              placeholder="0.00"
              aria-label={`Monthly limit for ${category.name}`}
              className="money h-8 py-1 pr-2 pl-6 text-right text-[12px]"
            />
          </div>
        </div>

        <div className="money hidden text-right text-[11px] text-muted lg:block">
          {formatMoney(spentCents, currency)}
        </div>
        <div
          className={cn(
            'hidden text-right text-[11px] font-medium lg:block',
            limitCents > 0 ? remainingTextTone(remainingCents, ratio) : 'text-muted',
          )}
        >
          {leftText}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 lg:pl-[2.625rem]">
        <ProgressBar
          ratio={limitCents > 0 ? ratio : 0}
          size="sm"
          className="flex-1"
          label={`${category.name} budget usage`}
        />
        <span
          className={cn(
            'shrink-0 text-[10.5px] font-medium lg:hidden',
            limitCents > 0 ? remainingTextTone(remainingCents, ratio) : 'text-muted',
          )}
        >
          {leftText}
        </span>
        {limitCents > 0 ? (
          <span className="money hidden w-9 shrink-0 text-right text-[10px] text-muted sm:inline lg:hidden">
            {formatPercent(ratio)}
          </span>
        ) : null}
      </div>
    </li>
  )
}

export function BudgetsPage() {
  const { state, dispatch } = useBudget()
  const { month } = useMonth()
  const toast = useToast()
  const currency = state.currency

  const summary = useMemo(() => monthSummary(state, month), [state, month])
  const [clearOpen, setClearOpen] = useState(false)

  const rowsByCategory = useMemo(() => {
    const map = new Map<string, CategoryBudgetRow>()
    for (const row of [...summary.budgeted, ...summary.unbudgeted]) {
      map.set(row.category.id, row)
    }
    return map
  }, [summary])

  const unbudgetedTotal = summary.unbudgeted.reduce(
    (total, row) => total + Math.max(0, row.spentCents),
    0,
  )
  const hasLimits = Object.keys(state.budgets).length > 0
  const hasBudget = summary.totalBudgetCents > 0
  const overBudget = hasBudget && summary.remainingCents < 0
  const elapsed = elapsedDays(month)
  const paceAt = elapsed > 0 ? elapsed / daysInMonth(month) : null

  const clearLimits = () => {
    dispatch({ type: 'budgets/clear' })
    setClearOpen(false)
    toast.push('All category limits cleared.', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Budgets"
        description="A monthly ceiling for each category. Limits repeat every month."
        actions={
          <LinkButton href="#/settings" variant="secondary" size="sm">
            Edit categories
          </LinkButton>
        }
      />

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-3 sm:divide-x sm:divide-line">
          <div className="sm:pr-5">
            <p className="text-[11px] font-semibold text-muted">Monthly limits</p>
            <p className="money mt-1 text-[23px] leading-none font-medium tracking-[-0.03em]">
              {formatMoney(summary.totalBudgetCents, currency)}
            </p>
          </div>
          <div className="sm:px-5">
            <p className="text-[11px] font-semibold text-muted">Spent in {monthLabel(month)}</p>
            <p className="money mt-1 text-[23px] leading-none font-medium tracking-[-0.03em]">
              {formatMoney(summary.totalSpentCents, currency)}
            </p>
          </div>
          <div className="sm:pl-5">
            <p className="text-[11px] font-semibold text-muted">
              {overBudget ? 'Over budget' : hasBudget ? 'Left this month' : 'No limits set'}
            </p>
            <p
              className={cn(
                'money mt-1 text-[23px] leading-none font-medium tracking-[-0.03em]',
                overBudget ? 'text-danger' : 'text-ink',
              )}
            >
              {hasBudget
                ? formatMoney(Math.abs(summary.remainingCents), currency)
                : '—'}
            </p>
          </div>
        </div>

        <ProgressBar
          ratio={hasBudget ? summary.ratio : 0}
          markerAt={hasBudget ? paceAt : null}
          className="mt-4"
          label="Overall budget usage"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10.5px] text-muted">
          <span>
            {summary.budgeted.length} of {state.categories.length} categories have a
            limit.
          </span>
          <span>{hasBudget ? `${formatPercent(summary.ratio, 1)} used` : 'Set a limit to start'}</span>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Category limits"
          description="Enter an amount to set a ceiling. Empty means no limit."
          action={
            <Button
              variant="dangerGhost"
              size="sm"
              disabled={!hasLimits}
              onClick={() => setClearOpen(true)}
            >
              Clear all limits
            </Button>
          }
        />
        <div className="hidden border-b border-line bg-surface-2/50 px-5 py-2 text-[10.5px] font-semibold text-muted lg:grid lg:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_7.5rem] lg:gap-4">
          <span>Category</span>
          <span className="text-right">Monthly limit</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Left</span>
        </div>
        <ul className="divide-y divide-line">
          {state.categories.map((category) => {
            const row = rowsByCategory.get(category.id)
            const limitCents = Math.max(0, state.budgets[category.id] ?? 0)
            const spentCents = row?.spentCents ?? 0
            return (
              <BudgetRow
                key={category.id}
                category={category}
                limitCents={limitCents}
                spentCents={spentCents}
                ratio={limitCents > 0 ? spentCents / limitCents : 0}
                remainingCents={limitCents - spentCents}
                currency={currency}
              />
            )
          })}
        </ul>

        {summary.unbudgeted.length > 0 ? (
          <p className="border-t border-line px-5 py-3 text-[10.5px] leading-snug text-muted">
            {formatMoney(unbudgetedTotal, currency)} of spending this month is in
            categories without a limit. It still counts as spent, but not toward the
            limit total.
          </p>
        ) : null}
      </Card>

      <ConfirmDialog
        open={clearOpen}
        title="Clear all limits?"
        description="Every category will go back to having no monthly ceiling. Transactions and categories stay exactly as they are."
        confirmLabel="Clear limits"
        onConfirm={clearLimits}
        onClose={() => setClearOpen(false)}
      />
    </div>
  )
}
