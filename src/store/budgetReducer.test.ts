import { describe, expect, it } from 'vitest'
import { createInitialState } from '../lib/seed'
import type { AppState, Category, Transaction } from '../types'
import { appReducer } from './budgetReducer'

function transaction(categoryId: string): Transaction {
  return {
    id: 'tx-1',
    date: '2024-03-05',
    amountCents: 2500,
    categoryId,
    note: 'test',
  }
}

const STATE: AppState = {
  ...createInitialState(),
  budgets: { groceries: 30000, dining: 10000 },
  transactions: [transaction('groceries')],
}

describe('appReducer', () => {
  it('adds, updates, and removes transactions', () => {
    const added = appReducer(STATE, {
      type: 'transaction/add',
      transaction: { ...transaction('dining'), id: 'tx-2' },
    })
    expect(added.transactions).toHaveLength(2)

    const updated = appReducer(added, {
      type: 'transaction/update',
      transaction: { ...transaction('dining'), id: 'tx-2', amountCents: 999 },
    })
    expect(updated.transactions.find((tx) => tx.id === 'tx-2')?.amountCents).toBe(999)

    const removed = appReducer(updated, { type: 'transaction/remove', id: 'tx-1' })
    expect(removed.transactions.map((tx) => tx.id)).toEqual(['tx-2'])
  })

  it('sets and clears a category limit', () => {
    const set = appReducer(STATE, {
      type: 'budget/set',
      categoryId: 'shopping',
      limitCents: 15000,
    })
    expect(set.budgets.shopping).toBe(15000)

    const cleared = appReducer(set, {
      type: 'budget/set',
      categoryId: 'shopping',
      limitCents: 0,
    })
    expect(cleared.budgets.shopping).toBeUndefined()

    expect(appReducer(set, { type: 'budgets/clear' }).budgets).toEqual({})
  })

  it('moves transactions and drops the limit when a category is removed', () => {
    const next = appReducer(STATE, { type: 'category/remove', id: 'groceries' })

    expect(next.categories.some((category) => category.id === 'groceries')).toBe(false)
    expect(next.transactions[0].categoryId).toBe('other')
    expect(next.budgets.groceries).toBeUndefined()
    expect(next.budgets.dining).toBe(10000)
  })

  it('refuses to remove the last category', () => {
    const onlyCategory: Category = {
      id: 'only',
      name: 'Only',
      color: '#000000',
      icon: '📦',
    }
    const single: AppState = {
      ...createInitialState(),
      categories: [onlyCategory],
      transactions: [],
      budgets: {},
    }

    expect(appReducer(single, { type: 'category/remove', id: 'only' })).toBe(single)
  })

  it('merges imported categories without duplicating ids', () => {
    const imported: AppState = {
      ...STATE,
      categories: [
        ...STATE.categories,
        { id: 'travel', name: 'Travel', color: '#06b6d4', icon: '✈️' },
      ],
      budgets: { ...STATE.budgets, travel: 20000 },
    }

    const next = appReducer(STATE, {
      type: 'data/import',
      transactions: [transaction('travel')],
      categories: [
        STATE.categories[0],
        { id: 'travel', name: 'Travel', color: '#06b6d4', icon: '✈️' },
      ],
      budgets: imported.budgets,
    })

    expect(next.categories).toHaveLength(STATE.categories.length + 1)
    expect(next.transactions).toHaveLength(2)
    expect(next.budgets.travel).toBe(20000)
  })

  it('resets data but keeps preferences', () => {
    const state: AppState = { ...STATE, currency: 'EUR', theme: 'dark' }
    const next = appReducer(state, { type: 'data/reset' })

    expect(next.currency).toBe('EUR')
    expect(next.theme).toBe('dark')
    expect(next.transactions).toEqual([])
    expect(next.budgets).toEqual({})
    expect(next.categories.length).toBeGreaterThan(0)
  })
})
