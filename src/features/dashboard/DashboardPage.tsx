import { useMemo } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '../../components/PageHeader'
import { LinkButton } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { ProgressBar } from '../../components/ui/Progress'
import {
  CalendarIcon,
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
  spendingPace,
  spendingTrend,
  transactionsForMonth,
  type CategoryBudgetRow,
  type TrendPoint,
} from '../../lib/selectors'
import { useBudget } from '../../store/budgetContext'
import { useMonth } from '../../store/monthContext'

interface TrendDatum extends TrendPoint {
  spent: number
  budget: number
}

interface PaceDatum {
  day: number
  spent: number
  allowance: number
}

const AXIS_TICK = {
  fill: 'var(--ui-muted)',
  fontSize: 10.5,
  fontFamily: 'Archivo Variable, sans-serif',
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
    <div className="rounded-[3px] border border-line bg-surface px-3 py-2 text-[11px] shadow-[0_14px_30px_-20px_rgb(24_33_28/0.4)]">
      <p className="font-semibold text-ink">{monthLabel(point.month)}</p>
      <p className="mt-1 flex items-center justify-between gap-5 text-muted">
        <span>Spent</span>
        <span className="money text-ink">{formatMoney(point.spentCents, currency)}</span>
      </p>
      <p className="flex items-center justify-between gap-5 text-muted">
        <span>Limit</span>
        <span className="money text-ink">
          {formatMoney(point.budgetCents, currency)}
        </span>
      </p>
    </div>
  )
}

function PaceTooltip({
  active,
  payload,
  currency,
  hasBudget,
}: {
  active?: boolean
  payload?: Array<{ payload?: PaceDatum }>
  currency: string
  hasBudget: boolean
}) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null

  return (
    <div className="rounded-[3px] border border-line bg-surface px-3 py-2 text-[11px] shadow-[0_14px_30px_-20px_rgb(24_33_28/0.4)]">
      <p className="font-semibold text-ink">Day {point.day}</p>
      <p className="mt-1 flex items-center justify-between gap-5 text-muted">
        <span>Spent so far</span>
        <span className="money text-ink">{formatMoney(point.spent * 100, currency)}</span>
      </p>
      {hasBudget ? (
        <p className="flex items-center justify-between gap-5 text-muted">
          <span>Allowance</span>
          <span className="money text-ink">
            {formatMoney(point.allowance * 100, currency)}
          </span>
        </p>
      ) : null}
    </div>
  )
}

function LimitRow({ row, currency }: { row: CategoryBudgetRow; currency: string }) {
  const over = row.remainingCents < 0

  return (
    <li className="px-5 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: row.category.color }}
            aria-hidden="true"
          />
          <span className="truncate text-[13px] font-medium">{row.category.name}</span>
        </span>
        <span className="money shrink-0 text-[11px] text-muted">
          {formatMoney(row.spentCents, currency)}
          <span className="mx-1 text-line">/</span>
          {formatMoney(row.limitCents, currency)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar
          ratio={row.ratio}
          size="sm"
          className="flex-1"
          label={`${row.category.name} budget usage`}
        />
        <span
          className={cn(
            'w-[6.5rem] shrink-0 text-right text-[10.5px] font-medium',
            remainingTextTone(row.remainingCents, row.ratio),
          )}
        >
          {over
            ? `${formatMoney(-row.remainingCents, currency)} over`
            : `${formatMoney(row.remainingCents, currency)} left`}
        </span>
      </div>
    </li>
  )
}

function PaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <span className="leader" aria-hidden="true" />
      <dd className="money text-[11.5px] font-medium text-ink">{value}</dd>
    </div>
  )
}

export function DashboardPage() {
  const { state } = useBudget()
  const { month } = useMonth()
  const currency = state.currency

  const summary = useMemo(() => monthSummary(state, month), [state, month])
  const pace = useMemo(() => spendingPace(state, month), [state, month])
  const trend = useMemo(() => spendingTrend(state, month, 6), [state, month])

  const categoryRows = useMemo(
    () =>
      [...summary.budgeted, ...summary.unbudgeted]
        .filter((row) => row.spentCents !== 0)
        .sort((a, b) => b.spentCents - a.spentCents),
    [summary],
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

  const topLimits = useMemo(
    () => [...summary.budgeted].sort((a, b) => b.ratio - a.ratio).slice(0, 5),
    [summary.budgeted],
  )

  const paceData: PaceDatum[] = useMemo(() => {
    if (pace.elapsedDays === 0) return []
    const daily = new Map<number, number>()
    for (const transaction of transactionsForMonth(state, month)) {
      const day = Number(transaction.date.slice(8, 10))
      daily.set(day, (daily.get(day) ?? 0) + transaction.amountCents)
    }

    const points: PaceDatum[] = []
    let running = 0
    for (let day = 1; day <= pace.elapsedDays; day += 1) {
      running += daily.get(day) ?? 0
      points.push({
        day,
        spent: running / 100,
        allowance:
          summary.totalBudgetCents > 0
            ? (summary.totalBudgetCents * (day / pace.daysInMonth)) / 100
            : 0,
      })
    }
    return points
  }, [state, month, pace, summary.totalBudgetCents])

  const paceTicks = useMemo(() => {
    if (pace.elapsedDays <= 1) return [1]
    return [...new Set([1, Math.round(pace.elapsedDays / 2), pace.elapsedDays])]
  }, [pace.elapsedDays])

  const positiveTotal = categoryRows.reduce(
    (total, row) => total + Math.max(0, row.spentCents),
    0,
  )
  const percentageBase = Math.max(positiveTotal, 1)

  const hasBudget = summary.totalBudgetCents > 0
  const overBudget = hasBudget && summary.remainingCents < 0
  const started = pace.elapsedDays > 0
  const elapsedRatio = started ? pace.elapsedDays / pace.daysInMonth : 0
  const paceSentence = !hasBudget
    ? 'No monthly ceiling yet. Set a limit to track your pace.'
    : !started
      ? 'This month hasn’t started yet.'
      : summary.ratio > elapsedRatio + 0.03
        ? 'Running ahead of the month’s allowance.'
        : summary.ratio < elapsedRatio - 0.03
          ? 'Running below the month’s allowance.'
          : 'Tracking close to the month’s allowance.'
  const showSetup = summary.transactionCount === 0 && !hasBudget

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Where this month’s money is going."
        actions={
          <LinkButton href="#/transactions" variant="primary">
            <PlusIcon size={15} />
            Add expense
          </LinkButton>
        }
      />

      <section className="rounded-[4px] border border-plate-line bg-plate px-5 py-5 text-plate-ink sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="h-[2px] w-6 bg-brass" aria-hidden="true" />
              <p className="text-[12px] font-medium text-plate-muted">
                {monthLabel(month)}
              </p>
            </div>
            <p className="mt-3 text-[12px] font-medium text-plate-muted">
              {started ? `Day ${pace.elapsedDays} of ${pace.daysInMonth}` : 'Not started'}
            </p>
            <p className="mt-1 max-w-xs text-[14px] leading-snug text-plate-ink/90">
              {paceSentence}
            </p>
          </div>

          <div className="min-w-0 sm:text-right">
            <p className="text-[11px] font-semibold text-plate-muted">
              {overBudget ? 'Over budget' : hasBudget ? 'Left to spend' : 'Spent this month'}
            </p>
            <p
              className={cn(
                'mt-1 truncate font-mono text-[clamp(2.4rem,7vw,4.1rem)] leading-[0.95] font-medium tracking-[-0.055em]',
                overBudget ? 'text-plate-danger' : 'text-plate-ink',
              )}
            >
              {formatMoney(
                overBudget
                  ? -summary.remainingCents
                  : hasBudget
                    ? summary.remainingCents
                    : summary.totalSpentCents,
                currency,
              )}
            </p>
            <p className="mt-2 text-[12px] text-plate-muted">
              {overBudget
                ? `against ${formatMoney(summary.totalBudgetCents, currency)} in limits`
                : hasBudget
                  ? `of ${formatMoney(summary.totalBudgetCents, currency)} in limits`
                  : 'no limits set yet'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ProgressBar
            variant="plate"
            size="lg"
            ratio={hasBudget ? summary.ratio : 0}
            markerAt={hasBudget && started ? elapsedRatio : null}
            label="Overall budget usage"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-plate-muted">
            <span>
              {hasBudget ? (
                `${formatPercent(summary.ratio, 1)} of the budget used`
              ) : (
                <a
                  href="#/budgets"
                  className="font-medium text-brass underline-offset-4 hover:underline"
                >
                  Set monthly limits
                </a>
              )}
            </span>
            <span>
              {formatMoney(summary.totalSpentCents, currency)} spent
              {summary.overBudgetCount > 0
                ? `, ${summary.overBudgetCount} ${summary.overBudgetCount === 1 ? 'category' : 'categories'} over`
                : ''}
            </span>
          </div>
        </div>
      </section>

      {showSetup ? (
        <Card>
          <CardHeader
            title="Start here"
            description="Set one limit and log one expense. The rest of the page fills in."
          />
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-line p-5 sm:border-r sm:border-b-0">
              <h3 className="text-[13px] font-semibold">
                <span className="money mr-2 text-brass">1</span>
                Set a monthly limit
              </h3>
              <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">
                Limits repeat every month. Start with the category you spend the
                most on, like Housing or Groceries.
              </p>
              <LinkButton href="#/budgets" size="sm" className="mt-4">
                Open budgets
              </LinkButton>
            </div>
            <div className="p-5">
              <h3 className="text-[13px] font-semibold">
                <span className="money mr-2 text-brass">2</span>
                Log an expense
              </h3>
              <p className="mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted">
                Add what you spent. The dashboard will show where it went and
                how much room is left.
              </p>
              <LinkButton href="#/transactions" size="sm" className="mt-4">
                Open transactions
              </LinkButton>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader
                title="Where it went"
                description="This month, by category."
                action={
                  <a
                    href="#/transactions"
                    className="text-[11px] font-medium text-brand underline-offset-4 hover:underline"
                  >
                    View transactions
                  </a>
                }
              />
              {categoryRows.length === 0 ? (
                <EmptyState
                  icon={<ReceiptIcon size={20} />}
                  title="Nothing logged this month"
                  description="Add an expense and the category breakdown appears here."
                  action={
                    <LinkButton href="#/transactions" size="sm" variant="primary">
                      Add expense
                    </LinkButton>
                  }
                />
              ) : (
                <>
                  <ul className="px-5 py-1.5">
                    {categoryRows.map((row) => (
                      <li
                        key={row.category.id}
                        className="flex items-baseline gap-2 py-2.5"
                      >
                        <span
                          className="size-2 shrink-0 translate-y-[-1px] rounded-full"
                          style={{ backgroundColor: row.category.color }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate text-[13px]">
                          {row.category.name}
                        </span>
                        <span className="leader" aria-hidden="true" />
                        <span
                          className={cn(
                            'money shrink-0 text-[13px]',
                            row.spentCents < 0 && 'text-brand',
                          )}
                        >
                          {formatMoney(row.spentCents, currency)}
                        </span>
                        <span className="w-9 shrink-0 text-right text-[10.5px] text-muted">
                          {row.spentCents > 0
                            ? formatPercent(row.spentCents / percentageBase)
                            : 'refund'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline justify-between gap-2 border-t border-line px-5 py-2.5">
                    <span className="text-[11px] font-semibold text-muted">
                      Total spent
                    </span>
                    <span className="money text-[13px] font-medium">
                      {formatMoney(summary.totalSpentCents, currency)}
                    </span>
                  </div>
                </>
              )}
            </Card>

            <Card className="flex flex-col lg:col-span-5">
              <CardHeader
                title="Six months"
                description="Spending against your monthly limits."
                action={
                  <div className="flex items-center gap-3 text-[10.5px] text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 bg-brand" aria-hidden="true" />
                      Spent
                    </span>
                    {hasBudget ? (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-0 w-3.5 border-t border-dashed border-brass"
                          aria-hidden="true"
                        />
                        Limit
                      </span>
                    ) : null}
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
                <div className="min-h-[13.5rem] flex-1 px-1 pt-3 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={trendData}
                      margin={{ top: 6, right: 8, left: -14, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="2 4"
                        stroke="var(--ui-line)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={AXIS_TICK}
                        dy={4}
                      />
                      <YAxis
                        width={54}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) =>
                          formatMoneyShort(value * 100, currency)
                        }
                        tick={AXIS_TICK}
                      />
                      <Tooltip
                        content={<TrendTooltip currency={currency} />}
                        cursor={{ fill: 'var(--ui-surface-2)', fillOpacity: 0.55 }}
                      />
                      <Bar
                        dataKey="spent"
                        name="Spent"
                        fill="var(--ui-brand)"
                        maxBarSize={26}
                        isAnimationActive={false}
                      />
                      {hasBudget ? (
                        <Line
                          type="linear"
                          dataKey="budget"
                          name="Limit"
                          stroke="var(--ui-brass)"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          dot={false}
                          isAnimationActive={false}
                        />
                      ) : null}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="lg:col-span-7">
              <CardHeader
                title="Limits"
                description="Spent against each monthly ceiling."
                action={
                  <a
                    href="#/budgets"
                    className="text-[11px] font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Manage limits
                  </a>
                }
              />
              {topLimits.length === 0 ? (
                <EmptyState
                  icon={<WalletIcon size={20} />}
                  title="No category limits yet"
                  description="Give a category a monthly ceiling to see how much room is left."
                  action={
                    <LinkButton href="#/budgets" size="sm" variant="primary">
                      Set limits
                    </LinkButton>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {topLimits.map((row) => (
                    <LimitRow key={row.category.id} row={row} currency={currency} />
                  ))}
                </ul>
              )}
              {summary.unbudgeted.length > 0 ? (
                <p className="border-t border-line px-5 py-2.5 text-[10.5px] leading-snug text-muted">
                  {summary.unbudgeted.length}{' '}
                  {summary.unbudgeted.length === 1 ? 'category has' : 'categories have'}{' '}
                  spending this month without a limit.
                </p>
              ) : null}
            </Card>

            <Card className="lg:col-span-5">
              <CardHeader
                title="Pace"
                description={
                  hasBudget
                    ? 'Cumulative spending against an even allowance.'
                    : 'Cumulative spending this month.'
                }
              />
              {paceData.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon size={20} />}
                  title="This month hasn’t started"
                  description="Pace appears once the month is underway."
                />
              ) : categoryRows.length === 0 && !hasBudget ? (
                <EmptyState
                  icon={<CalendarIcon size={20} />}
                  title="No spending to pace yet"
                  description="Add an expense, or set a limit to compare against an allowance."
                  action={
                    <LinkButton href="#/transactions" size="sm" variant="primary">
                      Add expense
                    </LinkButton>
                  }
                />
              ) : (
                <>
                  <div className="h-[9.5rem] px-1 pt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={paceData}
                        margin={{ top: 4, right: 30, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="2 4"
                          stroke="var(--ui-line)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="day"
                          ticks={paceTicks}
                          tickLine={false}
                          axisLine={false}
                          tick={AXIS_TICK}
                          tickFormatter={(value: number) => `Day ${value}`}
                          interval={0}
                          dy={4}
                        />
                        <YAxis
                          width={50}
                          domain={[0, 'auto']}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value: number) =>
                            formatMoneyShort(value * 100, currency)
                          }
                          tick={AXIS_TICK}
                        />
                        <Tooltip
                          content={
                            <PaceTooltip currency={currency} hasBudget={hasBudget} />
                          }
                          cursor={{ stroke: 'var(--ui-line)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="spent"
                          name="Spent"
                          stroke="var(--ui-brand)"
                          strokeWidth={2}
                          fill="var(--ui-brand)"
                          fillOpacity={0.08}
                          dot={false}
                          isAnimationActive={false}
                        />
                        {hasBudget ? (
                          <Line
                            type="linear"
                            dataKey="allowance"
                            name="Allowance"
                            stroke="var(--ui-brass)"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            dot={false}
                            isAnimationActive={false}
                          />
                        ) : null}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <dl className="space-y-1.5 border-t border-line px-5 py-3">
                    <PaceStat
                      label="Daily average"
                      value={formatMoney(pace.averagePerDayCents, currency)}
                    />
                    <PaceStat
                      label="Daily allowance"
                      value={
                        pace.budgetPerDayCents > 0
                          ? formatMoney(pace.budgetPerDayCents, currency)
                          : '—'
                      }
                    />
                    <PaceStat
                      label="Projected month end"
                      value={formatMoney(pace.projectedCents, currency)}
                    />
                  </dl>
                  {hasBudget && pace.projectedCents > summary.totalBudgetCents ? (
                    <p className="border-t border-line px-5 py-2.5 text-[10.5px] leading-snug text-warn">
                      At this pace you’ll finish{' '}
                      {formatMoney(
                        pace.projectedCents - summary.totalBudgetCents,
                        currency,
                      )}{' '}
                      over budget.
                    </p>
                  ) : !hasBudget ? (
                    <p className="border-t border-line px-5 py-2.5 text-[10.5px] leading-snug text-muted">
                      <a
                        href="#/budgets"
                        className="font-medium text-brand underline-offset-4 hover:underline"
                      >
                        Set a limit
                      </a>{' '}
                      to add the allowance line.
                    </p>
                  ) : null}
                </>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
