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
      className={`inline-flex max-w-full items-center gap-1.5 text-xs text-ink ${className ?? ''}`}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="truncate">{category.name}</span>
    </span>
  )
}

export function CategoryAvatar({ category }: { category: Category }) {
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-[3px] text-sm"
      style={{
        backgroundColor: `${category.color}1f`,
        boxShadow: `inset 0 0 0 1px ${category.color}33`,
      }}
      aria-hidden="true"
    >
      {category.icon}
    </span>
  )
}
