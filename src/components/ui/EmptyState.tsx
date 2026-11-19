import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="px-5 py-8">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
