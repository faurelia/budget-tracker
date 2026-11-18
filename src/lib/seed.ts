import type { AppState, Category } from '../types'

/** Palette offered when creating categories; also used for imported categories. */
export const CATEGORY_PALETTE = [
  '#6366f1',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#06b6d4',
  '#ec4899',
  '#a855f7',
  '#f43f5e',
  '#84cc16',
  '#64748b',
] as const

export const EMOJI_CHOICES = [
  '🏠',
  '🛒',
  '🚗',
  '🍽️',
  '💡',
  '🩺',
  '🎬',
  '🛍️',
  '📦',
  '✈️',
  '🎓',
  '🐾',
  '💳',
  '🎁',
  '📱',
  '⛽',
] as const

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'housing', name: 'Housing', color: '#6366f1', icon: '🏠' },
  { id: 'groceries', name: 'Groceries', color: '#10b981', icon: '🛒' },
  { id: 'transport', name: 'Transport', color: '#3b82f6', icon: '🚗' },
  { id: 'dining', name: 'Dining', color: '#f59e0b', icon: '🍽️' },
  { id: 'utilities', name: 'Utilities', color: '#06b6d4', icon: '💡' },
  { id: 'health', name: 'Health', color: '#ec4899', icon: '🩺' },
  { id: 'entertainment', name: 'Entertainment', color: '#a855f7', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', color: '#f43f5e', icon: '🛍️' },
  { id: 'other', name: 'Other', color: '#64748b', icon: '📦' },
]

export function createSeedCategories(): Category[] {
  return DEFAULT_CATEGORIES.map((category) => ({ ...category }))
}

export function createInitialState(): AppState {
  return {
    version: 1,
    currency: 'USD',
    theme: 'system',
    categories: createSeedCategories(),
    transactions: [],
    budgets: {},
  }
}

/** Stable fallback id for "Other", recreated if the user deleted it. */
export function findFallbackCategory(categories: Category[], excludedId?: string): Category | null {
  const candidates = categories.filter((category) => category.id !== excludedId)
  return (
    candidates.find((category) => category.name.toLowerCase() === 'other') ?? candidates[0] ?? null
  )
}
