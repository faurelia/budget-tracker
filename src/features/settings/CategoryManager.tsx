import { useState, type FormEvent } from 'react'
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
    <li className="flex flex-wrap items-center gap-x-2 gap-y-2 px-5 py-2.5">
      <input
        value={category.icon}
        onChange={(event) => update({ icon: event.target.value.slice(0, 4) })}
        onBlur={() => {
          if (!category.icon.trim()) update({ icon: '📦' })
        }}
        maxLength={4}
        aria-label={`Icon for ${category.name}`}
        className="h-8 w-10 rounded-[3px] border border-line bg-surface-2/50 text-center text-sm outline-none transition focus:border-brand"
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
        className="h-8 min-w-0 flex-1 sm:max-w-52"
      />

      <div className="order-last flex w-full items-center gap-0.5 sm:order-none sm:ml-1 sm:w-auto">
        {CATEGORY_PALETTE.slice(0, 6).map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Use ${color} for ${category.name}`}
            aria-pressed={category.color === color}
            onClick={() => update({ color })}
            className="grid size-6 place-items-center rounded-full transition hover:bg-surface-2"
          >
            <span
              className={cn(
                'size-3.5 rounded-full border border-black/10 transition dark:border-white/20',
                category.color === color &&
                  'ring-2 ring-ink ring-offset-2 ring-offset-surface',
              )}
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
        <label
          className="relative grid size-6 cursor-pointer place-items-center rounded-full transition hover:bg-surface-2"
          title="Custom color"
        >
          <input
            type="color"
            value={category.color}
            onChange={(event) => update({ color: event.target.value })}
            aria-label={`Custom color for ${category.name}`}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span className="grid size-4 place-items-center rounded-full border border-dashed border-line">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: category.color }}
            />
          </span>
        </label>
      </div>

      <span className="money ml-auto text-[10px] text-muted">
        {transactionCount} tx
      </span>
      <Button
        variant="ghost"
        size="iconSm"
        aria-label={`Delete ${category.name}`}
        disabled={state.categories.length <= 1}
        onClick={() => setConfirmOpen(true)}
        className="hover:bg-danger-soft hover:text-danger"
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
      className="space-y-3 border-t border-line bg-surface-2/25 px-5 py-4"
    >
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Icon" className="w-16">
          <Input
            value={icon}
            onChange={(event) => setIcon(event.target.value.slice(0, 4))}
            maxLength={4}
            aria-label="New category icon"
            className="text-center"
          />
        </Field>
        <Field label="New category" className="min-w-40 flex-1">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Travel"
            aria-label="New category name"
          />
        </Field>
        <Button type="submit" variant="primary" className="mb-0.5">
          <PlusIcon size={14} />
          Add category
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 text-[10.5px] text-muted">Icon</span>
        {EMOJI_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`Use ${emoji} as the icon`}
            aria-pressed={icon === emoji}
            onClick={() => setIcon(emoji)}
            className={cn(
              'grid size-7 place-items-center rounded-[2px] text-sm transition hover:bg-surface-2',
              icon === emoji && 'bg-brand-soft',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10.5px] text-muted">Color</span>
        {CATEGORY_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Use ${swatch}`}
            aria-pressed={color === swatch}
            onClick={() => setColor(swatch)}
            className="grid size-6 place-items-center rounded-full transition hover:bg-surface-2"
          >
            <span
              className={cn(
                'size-4 rounded-full border border-black/10 transition dark:border-white/20',
                color === swatch &&
                  'ring-2 ring-ink ring-offset-2 ring-offset-surface',
              )}
              style={{ backgroundColor: swatch }}
            />
          </button>
        ))}
      </div>
    </form>
  )
}

export function CategoryManager() {
  const { state } = useBudget()

  return (
    <div>
      <p className="border-b border-line px-5 py-2.5 text-[10.5px] leading-relaxed text-muted">
        Rename, recolor, or remove categories. Deleting one moves its
        transactions to another category.
      </p>
      <ul className="divide-y divide-line">
        {state.categories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>
      <AddCategoryForm />
    </div>
  )
}
