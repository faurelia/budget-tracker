import type { AppState, Category, ThemePreference, Transaction } from '../types'
import { isValidISODate } from './date'
import { safeCurrency } from './money'
import { createInitialState, createSeedCategories, findFallbackCategory } from './seed'

export const STORAGE_KEY = 'budget-tracker:v1'

/**
 * Accessing `localStorage` can throw a SecurityError (for example in a
 * sandboxed iframe or when storage is blocked), including from the bare
 * `typeof` check, so every access goes through this helper.
 */
function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export interface LoadResult {
  state: AppState | null
  error: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readCategories(value: unknown): Category[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const categories: Category[] = []

  for (const entry of value) {
    if (!isRecord(entry)) continue
    const { id, name, color, icon } = entry
    if (typeof id !== 'string' || !id || seen.has(id)) continue
    if (typeof name !== 'string' || !name.trim()) continue

    seen.add(id)
    categories.push({
      id,
      name: name.trim().slice(0, 60),
      color: typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : '#64748b',
      icon: typeof icon === 'string' && icon ? icon.slice(0, 8) : '📦',
    })
  }

  return categories
}

function readTransactions(
  value: unknown,
  categories: Category[],
): Transaction[] {
  if (!Array.isArray(value)) return []
  const categoryIds = new Set(categories.map((category) => category.id))
  const fallback = findFallbackCategory(categories)
  const seen = new Set<string>()
  const transactions: Transaction[] = []

  for (const entry of value) {
    if (!isRecord(entry)) continue
    const { id, date, amountCents, categoryId, note } = entry
    if (typeof id !== 'string' || !id || seen.has(id)) continue
    if (typeof date !== 'string' || !isValidISODate(date)) continue
    if (typeof amountCents !== 'number' || !Number.isSafeInteger(amountCents)) continue
    if (amountCents === 0) continue

    let resolvedCategoryId: string
    if (typeof categoryId === 'string' && categoryIds.has(categoryId)) {
      resolvedCategoryId = categoryId
    } else if (fallback) {
      resolvedCategoryId = fallback.id
    } else {
      continue
    }

    seen.add(id)
    transactions.push({
      id,
      date,
      amountCents,
      categoryId: resolvedCategoryId,
      note: typeof note === 'string' ? note.slice(0, 240) : '',
    })
  }

  return transactions
}

function readBudgets(value: unknown, categories: Category[]): Record<string, number> {
  if (!isRecord(value)) return {}
  const budgets: Record<string, number> = {}
  const ids = new Set(categories.map((category) => category.id))

  for (const [categoryId, limit] of Object.entries(value)) {
    if (!ids.has(categoryId)) continue
    if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit <= 0) continue
    budgets[categoryId] = limit
  }

  return budgets
}

function readState(value: unknown): LoadResult {
  if (!isRecord(value)) {
    return { state: null, error: 'Saved data has an unexpected shape.' }
  }
  if (value.version !== 1) {
    return { state: null, error: 'Saved data uses an unsupported version.' }
  }

  const categories = readCategories(value.categories)
  const effectiveCategories =
    categories.length > 0 ? categories : createSeedCategories()

  return {
    state: {
      version: 1,
      currency: typeof value.currency === 'string' ? safeCurrency(value.currency) : 'USD',
      theme: isTheme(value.theme) ? value.theme : 'system',
      categories: effectiveCategories,
      transactions: readTransactions(value.transactions, effectiveCategories),
      budgets: readBudgets(value.budgets, effectiveCategories),
    },
    error:
      categories.length === 0 && Array.isArray(value.categories)
        ? 'No usable categories were found, so defaults were restored.'
        : null,
  }
}

export function loadState(): LoadResult {
  const storage = getStorage()
  if (!storage) return { state: null, error: 'Browser storage is unavailable.' }

  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { state: null, error: 'Browser storage is unavailable.' }
  }

  if (!raw) return { state: null, error: null }

  try {
    return readState(JSON.parse(raw))
  } catch {
    return {
      state: null,
      error: 'Saved data could not be read and was replaced with a fresh start.',
    }
  }
}

/** Persist state. Returns an error message when the write failed. */
export function saveState(state: AppState): string | null {
  const storage = getStorage()
  if (!storage) return 'Changes could not be saved. Your browser storage may be full or blocked.'
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return null
  } catch {
    return 'Changes could not be saved. Your browser storage may be full or blocked.'
  }
}

export function clearState(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore: nothing useful to recover from here.
  }
}

/** Exposed for the reset flow so a fresh state is available without seeding twice. */
export function freshState(): AppState {
  return createInitialState()
}
