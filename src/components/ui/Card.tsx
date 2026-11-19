import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-[3px] border border-line bg-surface', className)}
      {...props}
    />
  )
}

interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3.5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[13px] leading-tight font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-[11px] leading-snug text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
