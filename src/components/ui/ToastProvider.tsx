import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckCircleIcon, InfoIcon, XIcon } from '../icons'
import { ToastContext, type ToastTone } from './toastContext'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-l-brand text-brand',
  error: 'border-l-danger text-danger',
  info: 'border-l-brass text-brass',
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircleIcon size={16} />
  if (tone === 'error') return <AlertIcon size={16} />
  return <InfoIcon size={16} />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<number, number>())
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      nextId.current += 1
      const id = nextId.current
      setToasts((current) => [...current.slice(-2), { id, message, tone }])

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
        timers.current.delete(id)
      }, 4200)
      timers.current.set(id, timer)
    },
    [],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer))
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-8"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-[3px] border border-l-2 border-line bg-surface px-3.5 py-2.5 text-[13px] shadow-[0_18px_40px_-24px_rgb(24_33_28/0.4)]',
              TONE_STYLES[toast.tone],
            )}
          >
            <span className="mt-0.5 shrink-0">
              <ToneIcon tone={toast.tone} />
            </span>
            <p className="flex-1 text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-[2px] text-muted transition hover:text-ink"
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
