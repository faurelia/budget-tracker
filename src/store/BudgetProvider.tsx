import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { createInitialState } from '../lib/seed'
import { loadState, saveState } from '../lib/storage'
import type { AppState } from '../types'
import { BudgetContext } from './budgetContext'
import { appReducer } from './budgetReducer'

interface InitialSnapshot {
  app: AppState
  loadError: string | null
}

function readInitialSnapshot(): InitialSnapshot {
  const { state, error } = loadState()
  return { app: state ?? createInitialState(), loadError: error }
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialSnapshot)
  const [state, dispatch] = useReducer(appReducer, initial.app)
  const [loadError, setLoadError] = useState(initial.loadError)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const isDark = state.theme === 'dark' || (state.theme === 'system' && systemDark)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', isDark)
    root.style.colorScheme = isDark ? 'dark' : 'light'
  }, [isDark])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const error = saveState(state)
      setSaveError(error)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [state])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      loadError,
      saveError,
      dismissLoadError: () => setLoadError(null),
      dismissSaveError: () => setSaveError(null),
      isDark,
    }),
    [state, loadError, saveError, isDark],
  )

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>
}
