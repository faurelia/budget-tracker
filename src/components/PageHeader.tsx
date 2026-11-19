import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 border-b border-line pb-5">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6">
        <div className="min-w-0">
          <h1 className="text-[27px] leading-none font-semibold tracking-[-0.025em] text-ink sm:text-[32px]">
            {title}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] text-muted">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
