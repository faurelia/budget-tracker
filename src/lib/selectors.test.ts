import { describe, expect, it } from 'vitest'
import type { AppState, Category, Transaction } from '../types'
import {
  monthSummary,
  spendingByCategory,
  spendingPace,
  spendingTrend,
  transactionsForMonth,
} from './selectors'

const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', color: '#10b981', icon: '🍽️' },
  { id: 'fun', name: 'Fun', color: '#f59e0b', icon: '🎬' },
]

function transaction(
  id: string,
  categoryId: string,
  date: string,
  amountCents: number,
): Transaction {
  return { id, categoryId, date, amountCents, note: '' }
}

const STATE: AppState = {
  version: 1,
  currency: 'USD',
  theme: 'light',
  categories: CATEGORIES,
  budgets: { food: 50000 },
  transactions: [
    transaction('t1', 'food', '2024-03-05', 12000),
    transaction('t2', 'fun', '2024-03-06', 3000),
    transaction('t3', 'food', '2024-03-07', -2000),
    transaction('t4', 'food', '2024-02-10', 99999),
  ],
}

describe('transactionsForMonth', () => {
  it('filters by month and leaves other months out', () => {
    expect(transactionsForMonth(STATE, '2024-03')).toHaveLength(3)
    expect(transactionsForMonth(STATE, '2024-04')).toEqual([])
  })
})

describe('monthSummary', () => {
  it('sums spending, applies refunds, and splits budgeted rows', () => {
    const summary = monthSummary(STATE, '2024-03')

    expect(summary.totalBudgetCents).toBe(50000)
    expect(summary.totalSpentCents).toBe(13000)
    expect(summary.remainingCents).toBe(37000)
    expect(summary.transactionCount).toBe(3)
    expect(summary.overBudgetCount).toBe(0)
    expect(summary.budgeted).toHaveLength(1)
    expect(summary.unbudgeted).toHaveLength(1)

    const food = summary.budgeted[0]
    expect(food.spentCents).toBe(10000)
    expect(food.remainingCents).toBe(40000)
    expect(food.ratio).toBeCloseTo(0.2)

    expect(summary.unbudgeted[0].category.id).toBe('fun')
    expect(summary.unbudgeted[0].spentCents).toBe(3000)
  })

  it('reports over-budget categories', () => {
    const summary = monthSummary({ ...STATE, budgets: { food: 9000 } }, '2024-03')

    expect(summary.overBudgetCount).toBe(1)
    expect(summary.totalBudgetCents).toBe(9000)
    expect(summary.remainingCents).toBe(-4000)
    expect(summary.budgeted[0].remainingCents).toBe(-1000)
    expect(summary.ratio).toBeCloseTo(13000 / 9000)
  })

  it('handles a month with no budget at all', () => {
    const summary = monthSummary({ ...STATE, budgets: {} }, '2024-03')

    expect(summary.totalBudgetCents).toBe(0)
    expect(summary.ratio).toBe(0)
    expect(summary.budgeted).toEqual([])
    expect(summary.unbudgeted).toHaveLength(2)
  })

  it('counts spending from unknown categories in the total', () => {
    const state: AppState = {
      ...STATE,
      transactions: [...STATE.transactions, transaction('t5', 'deleted', '2024-03-08', 500)],
    }
    const summary = monthSummary(state, '2024-03')

    expect(summary.totalSpentCents).toBe(13500)
    expect(summary.transactionCount).toBe(4)
    expect(summary.unbudgeted).toHaveLength(1)
  })
})

describe('spendingByCategory', () => {
  it('returns positive rows sorted by spend', () => {
    const rows = spendingByCategory(monthSummary(STATE, '2024-03'))

    expect(rows.map((row) => row.category.id)).toEqual(['food', 'fun'])
    expect(rows[0].spentCents).toBe(10000)
  })
})

describe('spendingTrend', () => {
  it('returns the six months ending at the selected month', () => {
    const trend = spendingTrend(STATE, '2024-03', 6)

    expect(trend).toHaveLength(6)
    expect(trend[0].month).toBe('2023-10')
    expect(trend[5].month).toBe('2024-03')
    expect(trend[5].spentCents).toBe(13000)
    expect(trend[5].budgetCents).toBe(50000)
    expect(trend[4].spentCents).toBe(99999)
  })
})

describe('spendingPace', () => {
  it('uses full elapsed days for a past month', () => {
    const pace = spendingPace(STATE, '2024-03')

    expect(pace.daysInMonth).toBe(31)
    expect(pace.elapsedDays).toBe(31)
    expect(pace.averagePerDayCents).toBe(Math.round(13000 / 31))
    expect(pace.projectedCents).toBe(13000)
    expect(pace.budgetPerDayCents).toBe(Math.round(50000 / 31))
  })

  it('does not project a future month', () => {
    const pace = spendingPace(STATE, '2999-01')

    expect(pace.elapsedDays).toBe(0)
    expect(pace.averagePerDayCents).toBe(0)
    expect(pace.projectedCents).toBe(0)
  })
})
