import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useToast } from '../../components/ui/toastContext'
import { cn } from '../../lib/cn'
import { CATEGORY_PALETTE } from '../../lib/seed'
import { useBudget } from '../../store/budgetContext'
import type { ImportPreview } from '../../lib/csv'
import type { Category, Transaction } from '../../types'

interface ImportDialogProps {
  open: boolean
  fileName: string
  preview: ImportPreview
  onClose: () => void
}

export function ImportDialog({ open, fileName, preview, onClose }: ImportDialogProps) {
  const { state, dispatch } = useBudget()
  const toast = useToast()
  const [createMissing, setCreateMissing] = useState(true)

  const missingCategories = useMemo(() => {
    const existing = new Set(
      state.categories.map((category) => category.name.trim().toLowerCase()),
    )
    const missing = new Map<string, string>()
    for (const row of preview.rows) {
      const display = row.categoryName.trim() || 'Other'
      const key = display.toLowerCase()
      if (!existing.has(key) && !missing.has(key)) {
        missing.set(key, display)
      }
    }
    return [...missing.values()].sort((a, b) => a.localeCompare(b))
  }, [preview.rows, state.categories])

  const handleImport = () => {
    const fallback =
      state.categories.find((category) => category.name.toLowerCase() === 'other') ??
      state.categories[0]

    if (!fallback) {
      toast.push('Create a category before importing.', 'error')
      return
    }

    const nameToId = new Map(
      state.categories.map((category) => [
        category.name.trim().toLowerCase(),
        category.id,
      ]),
    )

    const newCategories: Category[] = []
    if (createMissing) {
      missingCategories.forEach((name, index) => {
        const id = crypto.randomUUID()
        newCategories.push({
          id,
          name: name.slice(0, 60),
          icon: '📦',
          color:
            CATEGORY_PALETTE[
              (state.categories.length + index) % CATEGORY_PALETTE.length
            ],
        })
        nameToId.set(name.toLowerCase(), id)
      })
    }

    const transactions: Transaction[] = preview.rows.map((row) => ({
      id: crypto.randomUUID(),
      date: row.date,
      amountCents: row.amountCents,
      categoryId:
        nameToId.get(row.categoryName.trim().toLowerCase()) ?? fallback.id,
      note: row.note.slice(0, 200),
    }))

    dispatch({
      type: 'data/import',
      transactions,
      categories: newCategories,
    })

    const skipped = preview.skippedIncome
    toast.push(
      `Imported ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}${skipped > 0 ? `, skipped ${skipped} income row${skipped === 1 ? '' : 's'}` : ''}.`,
      'success',
    )
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import transactions"
      description={fileName}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={preview.rows.length === 0}
            onClick={handleImport}
          >
            Import {preview.rows.length}{' '}
            {preview.rows.length === 1 ? 'transaction' : 'transactions'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 divide-x divide-line border border-line">
          <div className="px-3 py-3 text-center">
            <p className="money text-lg leading-none font-medium text-ink">
              {preview.rows.length}
            </p>
            <p className="mt-1 text-[10.5px] text-muted">Ready</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="money text-lg leading-none font-medium text-ink">
              {preview.skippedIncome}
            </p>
            <p className="mt-1 text-[10.5px] text-muted">Income skipped</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p
              className={cn(
                'money text-lg leading-none font-medium',
                preview.errors.length > 0 ? 'text-danger' : 'text-ink',
              )}
            >
              {preview.errors.length}
            </p>
            <p className="mt-1 text-[10.5px] text-muted">Errors</p>
          </div>
        </div>

        {preview.skippedIncome > 0 ? (
          <p className="bg-surface-2/50 px-3 py-2 text-[11px] leading-relaxed text-muted">
            Rows marked as income or credit were left out. This tracker records
            expenses only. Refund rows with a negative amount can be imported.
          </p>
        ) : null}

        {missingCategories.length > 0 ? (
          <div className="space-y-2">
            <label className="flex items-start gap-2 border border-line bg-surface-2/40 px-3 py-2">
              <input
                type="checkbox"
                checked={createMissing}
                onChange={(event) => setCreateMissing(event.target.checked)}
                className="mt-0.5 size-4 accent-[var(--ui-brand)]"
              />
              <span className="text-[11.5px] text-ink">
                Create {missingCategories.length} missing{' '}
                {missingCategories.length === 1 ? 'category' : 'categories'}
                <span className="mt-0.5 block text-[10.5px] text-muted">
                  Otherwise these rows land in “Other”.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {missingCategories.slice(0, 12).map((name) => (
                <Badge key={name} tone="brand">
                  {name}
                </Badge>
              ))}
              {missingCategories.length > 12 ? (
                <Badge>+{missingCategories.length - 12} more</Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        {preview.errors.length > 0 ? (
          <div className="border border-danger/30 bg-danger-soft/60 px-3 py-2">
            <p className="text-[11px] font-semibold text-danger">
              {preview.errors.length} row
              {preview.errors.length === 1 ? '' : 's'} will be skipped
            </p>
            <ul className="mt-1 space-y-0.5 text-[10.5px] text-danger/85">
              {preview.errors.slice(0, 5).map((error) => (
                <li key={`${error.line}-${error.message}`}>
                  Row {error.line}: {error.message}
                </li>
              ))}
            </ul>
            {preview.errors.length > 5 ? (
              <p className="mt-1 text-[10.5px] text-muted">
                and {preview.errors.length - 5} more.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
