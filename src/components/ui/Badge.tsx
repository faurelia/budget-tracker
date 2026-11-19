import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand-soft-ink',
  success: 'bg-brand-soft text-brand-soft-ink',
  warning: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
}

interface BadgeProps {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-[10.5px] font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
