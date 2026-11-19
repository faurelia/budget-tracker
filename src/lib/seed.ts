import type { AppState, Category } from '../types'

/** Palette offered when creating categories; also used for imported categories. */
export const CATEGORY_PALETTE = [
  '#2f6b57',
  '#b07a2a',
  '#a64b3c',
  '#4a6b8a',
  '#6e7f4e',
  '#7a5470',
  '#2f7c86',
  '#b5903c',
  '#8a5a3b',
  '#5d6470',
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
  { id: 'housing', name: 'Housing', color: '#4a6b8a', icon: '🏠' },
  { id: 'groceries', name: 'Groceries', color: '#2f6b57', icon: '🛒' },
  { id: 'transport', name: 'Transport', color: '#2f7c86', icon: '🚗' },
  { id: 'dining', name: 'Dining', color: '#b07a2a', icon: '🍽️' },
  { id: 'utilities', name: 'Utilities', color: '#b5903c', icon: '💡' },
  { id: 'health', name: 'Health', color: '#a64b3c', icon: '🩺' },
  { id: 'entertainment', name: 'Entertainment', color: '#7a5470', icon: '🎬' },
  { id: 'shopping', name: 'Shopping', color: '#8a5a3b', icon: '🛍️' },
  { id: 'other', name: 'Other', color: '#5d6470', icon: '📦' },
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
