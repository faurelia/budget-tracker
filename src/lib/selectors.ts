import type { AppState, Category, MonthKey, Transaction } from '../types'
import {
  daysInMonth,
  elapsedDays,
  lastMonths,
  monthKeyOf,
  monthShortLabel,
} from './date'

export interface CategoryBudgetRow {
  category: Category
  limitCents: number
  spentCents: number
  remainingCents: number
  /** Spent divided by limit; 0 when no limit is set. */
  ratio: number
}

export interface MonthSummary {
  month: MonthKey
  totalBudgetCents: number
  totalSpentCents: number
  remainingCents: number
  ratio: number
  overBudgetCount: number
  transactionCount: number
  /** Categories with a limit above zero. */
  budgeted: CategoryBudgetRow[]
  /** Categories without a limit that have spending this month. */
  unbudgeted: CategoryBudgetRow[]
}

export interface TrendPoint {
  month: MonthKey
  label: string
  spentCents: number
  budgetCents: number
}

export interface Pace {
  elapsedDays: number
  daysInMonth: number
  averagePerDayCents: number
  projectedCents: number
  budgetPerDayCents: number
}

function spentByCategory(
  transactions: Transaction[],
  month: MonthKey,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const transaction of transactions) {
    if (monthKeyOf(transaction.date) !== month) continue
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amountCents,
    )
  }
  return totals
}

export function transactionsForMonth(
  state: AppState,
  month: MonthKey,
): Transaction[] {
  return state.transactions.filter(
    (transaction) => monthKeyOf(transaction.date) === month,
  )
}

export function monthSummary(state: AppState, month: MonthKey): MonthSummary {
  const spending = spentByCategory(state.transactions, month)

  let totalBudgetCents = 0
  for (const category of state.categories) {
    totalBudgetCents += Math.max(0, state.budgets[category.id] ?? 0)
  }

  let totalSpentCents = 0
  let transactionCount = 0
  for (const transaction of state.transactions) {
    if (monthKeyOf(transaction.date) !== month) continue
    totalSpentCents += transaction.amountCents
    transactionCount += 1
  }

  const budgeted: CategoryBudgetRow[] = []
  const unbudgeted: CategoryBudgetRow[] = []

  for (const category of state.categories) {
    const limitCents = Math.max(0, state.budgets[category.id] ?? 0)
    const spentCents = spending.get(category.id) ?? 0

    if (limitCents > 0) {
      budgeted.push({
        category,
        limitCents,
        spentCents,
        remainingCents: limitCents - spentCents,
        ratio: spentCents / limitCents,
      })
    } else if (spentCents !== 0) {
      unbudgeted.push({
        category,
        limitCents: 0,
        spentCents,
        remainingCents: -spentCents,
        ratio: 0,
      })
    }
  }

  // Totals include every transaction in the month, even ones whose category
  // is missing from the category list (defensive, should not normally happen).
  const remainingCents = totalBudgetCents - totalSpentCents
  return {
    month,
    totalBudgetCents,
    totalSpentCents,
    remainingCents,
    ratio: totalBudgetCents > 0 ? totalSpentCents / totalBudgetCents : 0,
    overBudgetCount: budgeted.filter((row) => row.remainingCents < 0).length,
    transactionCount,
    budgeted,
    unbudgeted,
  }
}

/** Donut-friendly data for categories that spent more than zero. */
export function spendingByCategory(
  summary: MonthSummary,
): CategoryBudgetRow[] {
  return [...summary.budgeted, ...summary.unbudgeted]
    .filter((row) => row.spentCents > 0)
    .sort((a, b) => b.spentCents - a.spentCents)
}

export function spendingTrend(
  state: AppState,
  endMonth: MonthKey,
  count = 6,
): TrendPoint[] {
  const budgetCents = state.categories.reduce(
    (total, category) => total + Math.max(0, state.budgets[category.id] ?? 0),
    0,
  )

  return lastMonths(endMonth, count).map((month) => {
    let spentCents = 0
    for (const transaction of state.transactions) {
      if (monthKeyOf(transaction.date) === month) {
        spentCents += transaction.amountCents
      }
    }
    return {
      month,
      label: monthShortLabel(month),
      spentCents,
      budgetCents,
    }
  })
}

export function spendingPace(state: AppState, month: MonthKey): Pace {
  const totalDays = daysInMonth(month)
  const elapsed = elapsedDays(month)
  const summary = monthSummary(state, month)
  const averagePerDayCents =
    elapsed > 0 ? Math.round(summary.totalSpentCents / elapsed) : 0

  return {
    elapsedDays: elapsed,
    daysInMonth: totalDays,
    averagePerDayCents,
    projectedCents:
      elapsed > 0 ? Math.round((summary.totalSpentCents / elapsed) * totalDays) : 0,
    budgetPerDayCents:
      summary.totalBudgetCents > 0
        ? Math.round(summary.totalBudgetCents / totalDays)
        : 0,
  }
}

export function totalBudget(state: AppState): number {
  return state.categories.reduce(
    (total, category) => total + Math.max(0, state.budgets[category.id] ?? 0),
    0,
  )
}
