import type { AppState, Budgets, Category, ThemePreference, Transaction } from '../types'
import { createInitialState, findFallbackCategory } from '../lib/seed'

export type BudgetAction =
  | { type: 'transaction/add'; transaction: Transaction }
  | { type: 'transaction/update'; transaction: Transaction }
  | { type: 'transaction/remove'; id: string }
  | { type: 'budget/set'; categoryId: string; limitCents: number }
  | { type: 'budgets/clear' }
  | { type: 'category/add'; category: Category }
  | { type: 'category/update'; category: Category }
  | { type: 'category/remove'; id: string }
  | { type: 'currency/set'; currency: string }
  | { type: 'theme/set'; theme: ThemePreference }
  | {
      type: 'data/import'
      transactions: Transaction[]
      categories: Category[]
      budgets?: Budgets
    }
  | { type: 'data/reset' }

export function appReducer(state: AppState, action: BudgetAction): AppState {
  switch (action.type) {
    case 'transaction/add':
      return { ...state, transactions: [action.transaction, ...state.transactions] }

    case 'transaction/update':
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.transaction.id ? action.transaction : transaction,
        ),
      }

    case 'transaction/remove':
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.id,
        ),
      }

    case 'budget/set': {
      const budgets = { ...state.budgets }
      if (action.limitCents > 0) {
        budgets[action.categoryId] = Math.round(action.limitCents)
      } else {
        delete budgets[action.categoryId]
      }
      return { ...state, budgets }
    }

    case 'budgets/clear':
      return { ...state, budgets: {} }

    case 'category/add':
      return { ...state, categories: [...state.categories, action.category] }

    case 'category/update':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.category.id ? action.category : category,
        ),
      }

    case 'category/remove': {
      if (state.categories.length <= 1) return state
      if (!state.categories.some((category) => category.id === action.id)) return state

      const fallback = findFallbackCategory(state.categories, action.id)
      if (!fallback) return state

      const budgets = { ...state.budgets }
      delete budgets[action.id]

      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.id),
        budgets,
        transactions: state.transactions.map((transaction) =>
          transaction.categoryId === action.id
            ? { ...transaction, categoryId: fallback.id }
            : transaction,
        ),
      }
    }

    case 'currency/set':
      return { ...state, currency: action.currency }

    case 'theme/set':
      return { ...state, theme: action.theme }

    case 'data/import': {
      const categories = [...state.categories]
      for (const category of action.categories) {
        if (!categories.some((existing) => existing.id === category.id)) {
          categories.push(category)
        }
      }
      return {
        ...state,
        categories,
        transactions: [...action.transactions, ...state.transactions],
        budgets: { ...state.budgets, ...(action.budgets ?? {}) },
      }
    }

    case 'data/reset': {
      const fresh = createInitialState()
      return { ...fresh, currency: state.currency, theme: state.theme }
    }

    default:
      return state
  }
}
