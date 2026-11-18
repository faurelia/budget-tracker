import { useState, type FormEvent } from 'react'
import { CategoryAvatar } from '../../components/CategoryChip'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toastContext'
import { PlusIcon, TrashIcon } from '../../components/icons'
import { cn } from '../../lib/cn'
import { CATEGORY_PALETTE, EMOJI_CHOICES } from '../../lib/seed'
import { useBudget } from '../../store/budgetContext'
import type { Category } from '../../types'

function CategoryRow({ category }: { category: Category }) {
  const { state, dispatch } = useBudget()
  const toast = useToast()
  const [name, setName] = useState(category.name)
  const [syncedName, setSyncedName] = useState(category.name)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Follow renames that came from somewhere else (an import or a reset) without
  // remounting the row, which would steal focus mid-edit.
  if (category.name !== syncedName) {
    setSyncedName(category.name)
    setName(category.name)
  }

  const transactionCount = state.transactions.filter(
    (transaction) => transaction.categoryId === category.id,
  ).length

  const update = (patch: Partial<Category>) => {
    dispatch({ type: 'category/update', category: { ...category, ...patch } })
  }

  const commitName = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setName(category.name)
      return
    }
    if (trimmed === category.name) return

    const duplicate = state.categories.some(
      (candidate) =>
        candidate.id !== category.id &&
        candidate.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      setName(category.name)
      toast.push('Another category already uses that name.', 'error')
      return
    }

    update({ name: trimmed.slice(0, 60) })
  }

  const remove = () => {
    dispatch({ type: 'category/remove', id: category.id })
    setConfirmOpen(false)
    toast.push('Category deleted.', 'success')
  }

  return (
    <li className="flex flex-wrap items-center gap-2 px-4 py-2.5">
      <input
        value={category.icon}
        onChange={(event) => update({ icon: event.target.value.slice(0, 4) })}
        onBlur={() => {
          if (!category.icon.trim()) update({ icon: '📦' })
        }}
        maxLength={4}
        aria-label={`Icon for ${category.name}`}
        className="h-9 w-11 rounded-lg border border-line bg-surface-2/50 text-center text-base outline-none transition focus:border-brand"
      />
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={commitName}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commitName()
          }
        }}
        aria-label={`Name for ${category.name}`}
        className="h-9 min-w-0 flex-1 sm:max-w-52"
      />

      <div className="flex items-center gap-1.5">
        {CATEGORY_PALETTE.slice(0, 6).map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Use ${color} for ${category.name}`}
            aria-pressed={category.color === color}
            onClick={() => update({ color })}
            className={cn(
              'size-4 rounded-full border border-black/10 transition dark:border-white/20',
              category.color === color &&
                'ring-2 ring-ink ring-offset-2 ring-offset-surface',
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        <label
          className="relative ml-0.5 grid size-5 cursor-pointer place-items-center rounded-full border border-dashed border-line"
          title="Custom color"
        >
          <input
            type="color"
            value={category.color}
            onChange={(event) => update({ color: event.target.value })}
            aria-label={`Custom color for ${category.name}`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
        </label>
      </div>

      <span className="ml-auto text-[11px] tabular text-muted">
        {transactionCount} tx
      </span>
      <Button
        variant="ghost"
        size="iconSm"
        aria-label={`Delete ${category.name}`}
        disabled={state.categories.length <= 1}
        onClick={() => setConfirmOpen(true)}
        className="hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
      >
        <TrashIcon size={14} />
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${category.name}?`}
        description={
          transactionCount > 0
            ? `${transactionCount} transaction${transactionCount === 1 ? '' : 's'} will be moved to another category, and this category's limit (if any) will be removed.`
            : "This category isn't used by any transactions. Its limit (if any) will be removed."
        }
        confirmLabel="Delete category"
        onConfirm={remove}
        onClose={() => setConfirmOpen(false)}
      />
    </li>
  )
}

function AddCategoryForm() {
  const { state, dispatch } = useBudget()
  const toast = useToast()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState<string>(CATEGORY_PALETTE[0])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      toast.push('Give the category a name first.', 'error')
      return
    }
    if (
      state.categories.some(
        (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.push('That category already exists.', 'error')
      return
    }

    dispatch({
      type: 'category/add',
      category: {
        id: crypto.randomUUID(),
        name: trimmed.slice(0, 60),
        icon: icon.trim() || '📦',
        color,
      },
    })
    toast.push(`Added ${trimmed}.`, 'success')
    setName('')
    setIcon('📦')
    setColor(CATEGORY_PALETTE[0])
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border-t border-line px-4 py-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Icon" className="w-16">
          <Input
            value={icon}
            onChange={(event) => setIcon(event.target.value.slice(0, 4))}
            maxLength={4}
            aria-label="New category icon"
            className="h-9 text-center"
          />
        </Field>
        <Field label="New category" className="min-w-40 flex-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Travel"
            aria-label="New category name"
            className="h-9"
          />
        </Field>
        <Button type="submit" variant="primary" size="sm" className="mb-0.5">
          <PlusIcon size={14} />
          Add category
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[11px] text-muted">Emoji</span>
        {EMOJI_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Use ${emoji} as the icon`}
            aria-pressed={icon === emoji}
            onClick={() => setIcon(emoji)}
            className={cn(
              'grid size-7 place-items-center rounded-lg text-sm transition hover:bg-surface-2',
              icon === emoji && 'bg-brand-soft',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] text-muted">Color</span>
        {CATEGORY_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Use ${swatch}`}
            aria-pressed={color === swatch}
            onClick={() => setColor(swatch)}
            className={cn(
              'size-5 rounded-full border border-black/10 transition dark:border-white/20',
              color === swatch && 'ring-2 ring-ink ring-offset-2 ring-offset-surface',
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    </form>
  )
}

export function CategoryManager() {
  const { state } = useBudget()
  const firstCategory = state.categories[0]

  return (
    <div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        {firstCategory ? <CategoryAvatar category={firstCategory} /> : null}
        <p className="text-xs text-muted">
          Rename, recolor, or remove categories. Deleting one moves its transactions
          to another category.
        </p>
      </div>
      <ul className="divide-y divide-line border-t border-line">
        {state.categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>
      <AddCategoryForm />
    </div>
  )
}
