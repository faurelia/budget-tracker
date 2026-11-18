import { createContext, useContext, type Dispatch } from 'react'
import type { AppState } from '../types'
import type { BudgetAction } from './budgetReducer'

export interface BudgetContextValue {
  state: AppState
  dispatch: Dispatch<BudgetAction>
  loadError: string | null
  saveError: string | null
  dismissLoadError: () => void
  dismissSaveError: () => void
  isDark: boolean
}

export const BudgetContext = createContext<BudgetContextValue | null>(null)

export function useBudget(): BudgetContextValue {
  const context = useContext(BudgetContext)
  if (!context) {
    throw new Error('useBudget must be used inside <BudgetProvider>.')
  }
  return context
}
