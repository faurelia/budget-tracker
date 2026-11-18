import type { Category } from '../types'

interface CategoryChipProps {
  category: Category | undefined
  className?: string
}

export function CategoryChip({ category, className }: CategoryChipProps) {
  if (!category) {
    return <span className="text-xs text-muted">Unknown</span>
  }

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-line/70 bg-surface-2/70 py-0.5 pr-2 pl-1 text-xs font-medium text-ink ${className ?? ''}`}
    >
      <span
        className="grid size-5 shrink-0 place-items-center rounded-full text-[11px]"
        style={{ backgroundColor: `${category.color}22` }}
      >
        {category.icon}
      </span>
      <span className="truncate">{category.name}</span>
    </span>
  )
}

export function CategoryAvatar({ category }: { category: Category }) {
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-xl text-base"
      style={{ backgroundColor: `${category.color}1f` }}
    >
      {category.icon}
    </span>
  )
}
