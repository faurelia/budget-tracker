import { createContext, useContext } from 'react'
import type { MonthKey } from '../types'

export interface MonthContextValue {
  month: MonthKey
  setMonth: (month: MonthKey) => void
  shift: (delta: number) => void
}

export const MonthContext = createContext<MonthContextValue | null>(null)

export function useMonth(): MonthContextValue {
  const context = useContext(MonthContext)
  if (!context) {
    throw new Error('useMonth must be used inside <MonthProvider>.')
  }
  return context
}
