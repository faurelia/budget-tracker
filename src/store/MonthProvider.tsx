import { useMemo, useState, type ReactNode } from 'react'
import { currentMonthKey, shiftMonth } from '../lib/date'
import { MonthContext } from './monthContext'

export function MonthProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(currentMonthKey)

  const value = useMemo(
    () => ({
      month,
      setMonth,
      shift: (delta: number) => setMonth((previous) => shiftMonth(previous, delta)),
    }),
    [month],
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}
