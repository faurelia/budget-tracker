/** ISO calendar date, `YYYY-MM-DD`. */
export type ISODate = string
/** Month key, `YYYY-MM`. */
export type MonthKey = string

export interface Category {
  id: string
  name: string
  /** Hex color used for chips and charts. */
  color: string
  /** Single emoji. */
  icon: string
}

export interface Transaction {
  id: string
  date: ISODate
  /** Signed amount in cents. Negative values are refunds. */
  amountCents: number
  categoryId: string
  note: string
}

/** Recurring monthly limit per category id, in cents. */
export type Budgets = Record<string, number>

export type ThemePreference = 'light' | 'dark' | 'system'

export interface AppState {
  version: 1
  currency: string
  theme: ThemePreference
  categories: Category[]
  transactions: Transaction[]
  budgets: Budgets
}

export interface TransactionDraft {
  date: ISODate
  amountCents: number
  categoryId: string
  note: string
}

export const ROUTES = ['dashboard', 'transactions', 'budgets', 'settings'] as const

export type Route = (typeof ROUTES)[number]
