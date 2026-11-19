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
  info: 'border-brand/25 bg-brand-soft text-brand-soft-ink',
  warning: 'border-warn/30 bg-warn-soft text-warn',
  danger: 'border-danger/30 bg-danger-soft text-danger',
} as const

export function Notice({ tone = 'info', title, children, onDismiss }: NoticeProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 border px-3.5 py-3 text-[13px]', STYLES[tone])}
    >
      <span className="mt-0.5 shrink-0">
        {tone === 'info' ? <InfoIcon size={16} /> : <AlertIcon size={16} />}
      </span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-0.5 text-[11.5px] opacity-90">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="shrink-0 rounded-[2px] opacity-70 transition hover:opacity-100"
        >
          <XIcon size={14} />
        </button>
      ) : null}
    </div>
  )
}
