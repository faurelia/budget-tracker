import { useMemo, useState } from 'react'
import { CategoryAvatar } from '../../components/CategoryChip'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Field'
import { ProgressBar } from '../../components/ui/Progress'
import { useToast } from '../../components/ui/toastContext'
import { cn } from '../../lib/cn'
import { monthLabel } from '../../lib/date'
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

  return (
    <li className="px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <CategoryAvatar category={category} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{category.name}</p>
            <p className="text-[11px] text-muted">
              {spentCents === 0
                ? 'No spending yet'
                : `${formatMoney(spentCents, currency)} spent`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted">
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
              className="h-9 w-32 py-1 pr-2 pl-7 text-right text-sm tabular"
            />
          </div>
          <span className="text-xs text-muted">/ mo</span>
        </div>

        <div className="w-full sm:w-52">
          <ProgressBar
            ratio={limitCents > 0 ? ratio : 0}
            className="h-1.5"
            label={`${category.name} budget usage`}
          />
          <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
            <span
              className={cn(
                'tabular',
                limitCents > 0
                  ? remainingTextTone(remainingCents, ratio)
                  : 'text-muted',
              )}
            >
              {limitCents === 0
                ? 'No limit'
                : remainingCents < 0
                  ? `${formatMoney(-remainingCents, currency)} over`
                  : `${formatMoney(remainingCents, currency)} left`}
            </span>
            {limitCents > 0 ? (
              <span className="tabular text-muted">{formatPercent(ratio)}</span>
            ) : null}
          </div>
        </div>
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

  const clearLimits = () => {
    dispatch({ type: 'budgets/clear' })
    setClearOpen(false)
    toast.push('All category limits cleared.', 'success')
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">
              {overBudget ? 'Over budget' : hasBudget ? 'Left this month' : 'Spent this month'}
            </p>
            <p
              className={cn(
                'mt-1 text-3xl font-semibold tabular',
                overBudget && 'text-red-600 dark:text-red-400',
              )}
            >
              {formatMoney(
                hasBudget ? Math.abs(summary.remainingCents) : summary.totalSpentCents,
                currency,
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              {formatMoney(summary.totalSpentCents, currency)} spent
              {hasBudget
                ? ` of ${formatMoney(summary.totalBudgetCents, currency)}`
                : ' · no limits set'}{' '}
              · {monthLabel(month)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary.totalBudgetCents > 0 ? (
              <Badge
                tone={
                  summary.ratio > 1
                    ? 'danger'
                    : summary.ratio >= 0.8
                      ? 'warning'
                      : 'success'
                }
              >
                {formatPercent(summary.ratio)} used
              </Badge>
            ) : (
              <Badge>No limits set</Badge>
            )}
            {summary.overBudgetCount > 0 ? (
              <Badge tone="danger">
                {summary.overBudgetCount} over budget
              </Badge>
            ) : null}
            <LinkButton href="#/settings" size="sm" variant="secondary">
              Edit categories
            </LinkButton>
          </div>
        </div>

        <ProgressBar
          ratio={summary.totalBudgetCents > 0 ? summary.ratio : 0}
          className="mt-4 h-2.5"
          label="Overall budget usage"
        />

        <p className="mt-2 text-xs text-muted">
          Limits repeat every month. Enter an amount next to a category to give it a
          ceiling — empty means no limit.
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Category limits"
          description={`${summary.budgeted.length} of ${state.categories.length} categories budgeted`}
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
        <ul className="divide-y divide-line border-t border-line">
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
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            {formatMoney(unbudgetedTotal, currency)} of spending this month is in
            categories without a limit. It still counts toward the amount spent, but
            not toward the budget total.
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
