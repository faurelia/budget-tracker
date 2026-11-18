import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  clearState,
  freshState,
  loadState,
  saveState,
} from './storage'
import type { AppState } from '../types'

function memoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

let storage: ReturnType<typeof memoryStorage>

beforeEach(() => {
  storage = memoryStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function seedState(): AppState {
  return {
    version: 1,
    currency: 'EUR',
    theme: 'dark',
    categories: [{ id: 'food', name: 'Food', color: '#10b981', icon: '🍽️' }],
    budgets: { food: 25000 },
    transactions: [
      {
        id: 't1',
        date: '2024-03-05',
        amountCents: 1234,
        categoryId: 'food',
        note: 'Lunch',
      },
    ],
  }
}

describe('loadState', () => {
  it('returns null when nothing is stored', () => {
    expect(loadState()).toEqual({ state: null, error: null })
  })

  it('round-trips state saved by saveState', () => {
    const state = seedState()
    expect(saveState(state)).toBeNull()

    expect(loadState()).toEqual({ state, error: null })
  })

  it('reports unreadable JSON and offers no state', () => {
    storage.setItem(STORAGE_KEY, '{not json')

    const result = loadState()
    expect(result.state).toBeNull()
    expect(result.error).toMatch(/could not be read/i)
  })

  it('rejects unsupported versions', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...seedState(), version: 2 }))

    const result = loadState()
    expect(result.state).toBeNull()
    expect(result.error).toMatch(/unsupported version/i)
  })

  it('drops transactions and budgets that point at missing categories', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...seedState(),
        transactions: [
          {
            id: 'keep',
            date: '2024-03-05',
            amountCents: 500,
            categoryId: 'food',
            note: '',
          },
          {
            id: 'move',
            date: '2024-03-06',
            amountCents: 900,
            categoryId: 'gone',
            note: '',
          },
          {
            id: 'zero',
            date: '2024-03-07',
            amountCents: 0,
            categoryId: 'food',
            note: '',
          },
          {
            id: 'baddate',
            date: '2024-02-31',
            amountCents: 100,
            categoryId: 'food',
            note: '',
          },
        ],
        budgets: { food: 1000, gone: 5000, zero: 0 },
      }),
    )

    const { state } = loadState()
    expect(state).not.toBeNull()
    expect(state?.transactions.map((transaction) => transaction.id)).toEqual([
      'keep',
      'move',
    ])
    // The refund category fell back to the only existing category.
    expect(state?.transactions[1].categoryId).toBe('food')
    expect(state?.budgets).toEqual({ food: 1000 })
  })

  it('repairs bad preferences and duplicate categories', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        currency: 'ZZZ',
        theme: 'neon',
        categories: [
          { id: 'food', name: ' Food ', color: 'red', icon: '' },
          { id: 'food', name: 'Duplicate', color: '#123456', icon: 'x' },
          { id: '', name: 'No id', color: '#123456', icon: 'x' },
        ],
        transactions: [],
        budgets: {},
      }),
    )

    const { state } = loadState()
    expect(state?.currency).toBe('USD')
    expect(state?.theme).toBe('system')
    expect(state?.categories).toEqual([
      { id: 'food', name: 'Food', color: '#64748b', icon: '📦' },
    ])
  })

  it('falls back to seeded categories when none are usable', () => {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, categories: [], transactions: [], budgets: {} }),
    )

    const result = loadState()
    expect(result.state?.categories.length).toBeGreaterThan(0)
    expect(result.error).toMatch(/defaults were restored/i)
  })

  it('survives a browser that throws when storage is read', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Access is denied for this document.')
      },
    })

    expect(() => loadState()).not.toThrow()
    expect(loadState().error).toMatch(/unavailable/i)
    expect(saveState(seedState())).toMatch(/could not be saved/i)
  })
})

describe('saveState and clearState', () => {
  it('clears the stored document', () => {
    saveState(seedState())
    clearState()

    expect(loadState()).toEqual({ state: null, error: null })
  })

  it('reports a failed write', () => {
    vi.stubGlobal('localStorage', {
      ...storage,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    })

    expect(saveState(seedState())).toMatch(/could not be saved/i)
  })
})

describe('freshState', () => {
  it('starts with default categories and no spending', () => {
    const state = freshState()
    expect(state.transactions).toEqual([])
    expect(state.budgets).toEqual({})
    expect(state.version).toBe(1)
    expect(state.categories.length).toBeGreaterThan(0)
  })
})
