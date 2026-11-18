import { useMemo, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../../components/ui/Badge'
import { Button, LinkButton } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/Progress'
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlusIcon,
  ReceiptIcon,
  WalletIcon,
} from '../../components/icons'
import { cn } from '../../lib/cn'
import { monthLabel } from '../../lib/date'
import { formatMoney, formatMoneyShort, formatPercent } from '../../lib/money'
import { remainingTextTone } from '../../lib/progress'
import {
  monthSummary,
  spendingByCategory,
  spendingPace,
  spendingTrend,
  type MonthSummary,
  type TrendPoint,
} from '../../lib/selectors'
import { useBudget } from '../../store/budgetContext'
import { useMonth } from '../../store/monthContext'
import type { CategoryBudgetRow } from '../../lib/selectors'

interface DonutDatum {
  name: string
  value: number
  valueCents: number
  color: string
  icon: string
}

interface TrendDatum extends TrendPoint {
  spent: number
  budget: number
}

function StatCard({
  label,
  value,
  hint,
  icon,
  valueClassName,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  valueClassName?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted">
          {icon}
        </span>
      </div>
      <p className={cn('mt-2 truncate text-2xl font-semibold tabular', valueClassName)}>
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-muted">{hint}</p>
    </Card>
  )
}

function DonutTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: Array<{ payload?: DonutDatum }>
  currency: string
}) {
  const datum = payload?.[0]?.payload
  if (!active || !datum) return null

  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card">
      <p className="flex items-center gap-1.5 font-medium text-ink">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: datum.color }}
        />
        {datum.name}
      </p>
      <p className="mt-0.5 tabular text-muted">
        {formatMoney(datum.valueCents, currency)}
      </p>
    </div>
  )
}

function TrendTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: Array<{ payload?: TrendDatum }>
  currency: string
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-2 text-xs shadow-card">
      <p className="font-medium text-ink">{monthLabel(point.month)}</p>
      <p className="mt-1 flex items-center justify-between gap-4 text-muted">
        <span>Spent</span>
        <span className="tabular text-ink">{formatMoney(point.spentCents, currency)}</span>
      </p>
      <p className="flex items-center justify-between gap-4 text-muted">
        <span>Budget</span>
        <span className="tabular text-ink">
          {formatMoney(point.budgetCents, currency)}
        </span>
      </p>
    </div>
  )
}

function BudgetRow({ row, currency }: { row: CategoryBudgetRow; currency: string }) {
  const over = row.remainingCents < 0

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg text-sm"
          style={{ backgroundColor: `${row.category.color}1f` }}
        >
          {row.category.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {row.category.name}
        </span>
        <span className="hidden text-xs tabular text-muted sm:inline">
          {formatMoney(row.spentCents, currency)} / {formatMoney(row.limitCents, currency)}
        </span>
        <span
          className={cn(
            'w-24 text-right text-xs font-medium tabular',
            remainingTextTone(row.remainingCents, row.ratio),
          )}
        >
          {over
            ? `${formatMoney(-row.remainingCents, currency)} over`
            : `${formatMoney(row.remainingCents, currency)} left`}
        </span>
      </div>
      <ProgressBar
        ratio={row.ratio}
        className="mt-2 h-1.5"
        label={`${row.category.name} budget usage`}
      />
    </li>
  )
}

function PaceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  )
}

export function DashboardPage() {
  const { state } = useBudget()
  const { month } = useMonth()
  const currency = state.currency

  const summary: MonthSummary = useMemo(
    () => monthSummary(state, month),
    [state, month],
  )
  const pace = useMemo(() => spendingPace(state, month), [state, month])
  const trend = useMemo(() => spendingTrend(state, month, 6), [state, month])
  const categoryRows = useMemo(() => spendingByCategory(summary), [summary])

  const donutData: DonutDatum[] = useMemo(
    () =>
      categoryRows.map((row) => ({
        name: row.category.name,
        value: row.spentCents / 100,
        valueCents: row.spentCents,
        color: row.category.color,
        icon: row.category.icon,
      })),
    [categoryRows],
  )

  const trendData: TrendDatum[] = useMemo(
    () =>
      trend.map((point) => ({
        ...point,
        spent: point.spentCents / 100,
        budget: point.budgetCents / 100,
      })),
    [trend],
  )

  const topBudgets = useMemo(
    () => [...summary.budgeted].sort((a, b) => b.spentCents - a.spentCents).slice(0, 5),
    [summary.budgeted],
  )

  // Percentages describe the slices of the donut, which only include positive
  // spending. A refund makes net spending smaller than the slice total, so the
  // slices still add up to 100% here.
  const donutTotalCents = categoryRows.reduce(
    (total, row) => total + row.spentCents,
    0,
  )
  const percentageBase = Math.max(donutTotalCents, 1)
  const hasBudget = summary.totalBudgetCents > 0
  const overBudget = hasBudget && summary.remainingCents < 0
  const remainingTone =
    remainingTextTone(summary.remainingCents, summary.ratio) ?? 'text-ink'

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly budget"
          value={formatMoney(summary.totalBudgetCents, currency)}
          hint={`${summary.budgeted.length} of ${state.categories.length} categories limited`}
          icon={<WalletIcon size={15} />}
        />
        <StatCard
          label="Spent"
          value={formatMoney(summary.totalSpentCents, currency)}
          hint={`${summary.transactionCount} transaction${summary.transactionCount === 1 ? '' : 's'} this month`}
          icon={<ReceiptIcon size={15} />}
        />
        <StatCard
          label={overBudget ? 'Over budget' : hasBudget ? 'Left to spend' : 'Remaining'}
          value={
            hasBudget ? formatMoney(Math.abs(summary.remainingCents), currency) : '—'
          }
          hint={
            hasBudget
              ? `${formatPercent(summary.ratio)} of budget used`
              : 'Set category limits to track'
          }
          icon={<CheckCircleIcon size={15} />}
          valueClassName={hasBudget ? remainingTone : 'text-muted'}
        />
        <StatCard
          label="Daily average"
          value={formatMoney(pace.averagePerDayCents, currency)}
          hint={
            pace.budgetPerDayCents > 0
              ? `Budget pace ${formatMoney(pace.budgetPerDayCents, currency)}/day`
              : pace.elapsedDays > 0
                ? `${pace.elapsedDays} of ${pace.daysInMonth} days elapsed`
                : 'Month has not started'
          }
          icon={<CalendarIcon size={15} />}
        />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {monthLabel(month)} budget
            </p>
            <p className="mt-1 text-2xl font-semibold tabular">
              {formatMoney(summary.totalBudgetCents, currency)}
            </p>
            <p className="text-xs text-muted">
              {formatMoney(summary.totalSpentCents, currency)} spent
              {summary.totalBudgetCents > 0 ? (
                <>
                  {' · '}
                  <span className={overBudget ? 'text-red-600 dark:text-red-400' : undefined}>
                    {overBudget
                      ? `${formatMoney(-summary.remainingCents, currency)} over`
                      : `${formatMoney(summary.remainingCents, currency)} left`}
                  </span>
                </>
              ) : (
                ' · set limits to track progress'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {summary.overBudgetCount > 0 ? (
              <Badge tone="danger">
                {summary.overBudgetCount} over budget
              </Badge>
            ) : null}
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
              <Badge>No budget set</Badge>
            )}
            <LinkButton href="#/budgets" size="sm" variant="secondary">
              Manage budgets
            </LinkButton>
          </div>
        </div>
        <ProgressBar
          ratio={summary.totalBudgetCents > 0 ? summary.ratio : 0}
          className="mt-4 h-2.5"
          label="Overall budget usage"
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader
            title="Spending by category"
            description={monthLabel(month)}
          />
          {donutData.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon size={20} />}
              title="No spending yet"
              description="Add a transaction and the breakdown will show up here."
              action={
                <LinkButton href="#/transactions" size="sm" variant="primary">
                  <PlusIcon size={14} />
                  Add transaction
                </LinkButton>
              }
            />
          ) : (
            <div className="px-5 pb-5">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="92%"
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {donutData.map((datum, index) => (
                        <Cell key={`${datum.name}-${index}`} fill={datum.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<DonutTooltip currency={currency} />}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    Spent
                  </span>
                  <span className="text-lg font-semibold tabular">
                    {formatMoney(summary.totalSpentCents, currency)}
                  </span>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5">
                {categoryRows.map((row) => (
                  <li key={row.category.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.category.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-muted">
                      {row.category.name}
                    </span>
                    <span className="tabular font-medium">
                      {formatMoney(row.spentCents, currency)}
                    </span>
                    <span className="w-9 text-right tabular text-muted">
                      {formatPercent(row.spentCents / percentageBase)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Category budgets"
            description="Spent against each monthly limit"
            action={
              <LinkButton href="#/budgets" size="sm" variant="ghost">
                Manage
                <ArrowRightIcon size={13} />
              </LinkButton>
            }
          />
          {topBudgets.length === 0 ? (
            <EmptyState
              icon={<WalletIcon size={20} />}
              title="No category limits yet"
              description="Set a monthly ceiling per category to see how much room is left."
              action={
                <LinkButton href="#/budgets" size="sm" variant="primary">
                  Set up budgets
                </LinkButton>
              }
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {topBudgets.map((row) => (
                <BudgetRow key={row.category.id} row={row} currency={currency} />
              ))}
            </ul>
          )}
          {summary.unbudgeted.length > 0 ? (
            <p className="border-t border-line px-5 py-2.5 text-xs text-muted">
              {summary.unbudgeted.length} unbudgeted{' '}
              {summary.unbudgeted.length === 1 ? 'category has' : 'categories have'}{' '}
              spending this month without a limit.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Six-month trend"
            description="Spending compared with your total monthly budget"
            action={
              <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand" />
                  Spent
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-line" />
                  Budget
                </span>
              </div>
            }
          />
          {trend.every((point) => point.spentCents === 0) ? (
            <EmptyState
              icon={<CalendarIcon size={20} />}
              title="Nothing to chart yet"
              description="Your last six months of spending will appear here."
            />
          ) : (
            <div className="h-56 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
                  barGap={4}
                  margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--ui-line)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--ui-muted)', fontSize: 11 }}
                    dy={4}
                  />
                  <YAxis
                    width={58}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      formatMoneyShort(value * 100, currency)
                    }
                    tick={{ fill: 'var(--ui-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<TrendTooltip currency={currency} />}
                    cursor={{ fill: 'var(--ui-surface-2)' }}
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    fill="var(--ui-brand)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="budget"
                    name="Budget"
                    fill="var(--ui-line)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Pace</h2>
              <p className="mt-0.5 text-xs text-muted">
                {pace.elapsedDays > 0
                  ? `Day ${pace.elapsedDays} of ${pace.daysInMonth}`
                  : 'Month has not started'}
              </p>
            </div>
            <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-muted">
              <CalendarIcon size={15} />
            </span>
          </div>

          <p className="mt-4 text-2xl font-semibold tabular">
            {formatMoney(pace.averagePerDayCents, currency)}
            <span className="ml-1 text-xs font-normal text-muted">/ day</span>
          </p>

          <div className="mt-4 space-y-2 border-t border-line pt-3">
            <PaceRow
              label="Projected month end"
              value={formatMoney(pace.projectedCents, currency)}
            />
            <PaceRow
              label="Daily budget"
              value={
                pace.budgetPerDayCents > 0
                  ? formatMoney(pace.budgetPerDayCents, currency)
                  : '—'
              }
            />
            <PaceRow
              label="Transactions"
              value={String(summary.transactionCount)}
            />
          </div>

          {pace.budgetPerDayCents > 0 &&
          pace.projectedCents > summary.totalBudgetCents ? (
            <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              At this pace you&apos;ll finish{' '}
              {formatMoney(
                pace.projectedCents - summary.totalBudgetCents,
                currency,
              )}{' '}
              over budget.
            </p>
          ) : summary.totalBudgetCents === 0 ? (
            <div className="mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  window.location.hash = '#/budgets'
                }}
              >
                Set a budget
              </Button>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-5 py-4">
        <div>
          <p className="text-sm font-medium">Log today&apos;s spending</p>
          <p className="text-xs text-muted">
            It takes a few seconds and keeps the month honest.
          </p>
        </div>
        <LinkButton href="#/transactions" variant="primary" size="sm">
          <PlusIcon size={14} />
          Add transaction
        </LinkButton>
      </div>
    </div>
  )
}
