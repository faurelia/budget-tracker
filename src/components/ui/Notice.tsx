import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, InfoIcon, XIcon } from '../icons'

interface NoticeProps {
  tone?: 'info' | 'warning' | 'danger'
  title: string
  children?: ReactNode
  onDismiss?: () => void
}

const STYLES = {
  info: 'border-brand/30 bg-brand-soft text-brand-soft-ink',
  warning:
    'border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  danger:
    'border-red-300/60 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
} as const

export function Notice({ tone = 'info', title, children, onDismiss }: NoticeProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm',
        STYLES[tone],
      )}
    >
      <span className="mt-0.5 shrink-0">
        {tone === 'info' ? <InfoIcon size={16} /> : <AlertIcon size={16} />}
      </span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-0.5 text-xs opacity-90">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 rounded opacity-70 transition hover:opacity-100"
        >
          <XIcon size={14} />
        </button>
      ) : null}
    </div>
  )
}
