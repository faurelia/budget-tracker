import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { Select } from '../../components/ui/Field'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useToast } from '../../components/ui/toastContext'
import { DownloadIcon, UploadIcon } from '../../components/icons'
import {
  parseTransactionsCSV,
  transactionsToCSV,
  type ImportPreview,
} from '../../lib/csv'
import { compareISODate, todayISO } from '../../lib/date'
import { downloadTextFile } from '../../lib/download'
import { CURRENCIES } from '../../lib/money'
import { STORAGE_KEY } from '../../lib/storage'
import { useBudget } from '../../store/budgetContext'
import { CategoryManager } from './CategoryManager'
import { ImportDialog } from './ImportDialog'

export function SettingsPage() {
  const { state, dispatch } = useBudget()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<{
    data: ImportPreview
    fileName: string
  } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const categoriesById = useMemo(
    () => new Map(state.categories.map((category) => [category.id, category])),
    [state.categories],
  )

  const exportCsv = () => {
    if (state.transactions.length === 0) {
      toast.push('There are no transactions to export yet.', 'info')
      return
    }

    const rows = [...state.transactions]
      .sort((a, b) => compareISODate(a.date, b.date))
      .map((transaction) => ({
        date: transaction.date,
        categoryName:
          categoriesById.get(transaction.categoryId)?.name ?? 'Other',
        amountCents: transaction.amountCents,
        note: transaction.note,
      }))

    downloadTextFile(
      `budget-transactions-${todayISO()}.csv`,
      transactionsToCSV(rows),
    )
    toast.push(
      `Exported ${rows.length} transaction${rows.length === 1 ? '' : 's'}.`,
      'success',
    )
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    void (async () => {
      try {
        const text = await file.text()
        const data = parseTransactionsCSV(text)
        if (data.rows.length === 0 && data.errors.length === 0) {
          toast.push('No transactions were found in that file.', 'error')
          return
        }
        setPreview({ data, fileName: file.name })
        setImportOpen(true)
      } catch {
        toast.push('That file could not be read.', 'error')
      }
    })()
  }

  const resetData = () => {
    dispatch({ type: 'data/reset' })
    setResetOpen(false)
    toast.push('All data has been reset.', 'success')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Preferences, categories, and your data."
      />

      <Card>
        <CardHeader
          title="Preferences"
          description="Applies to this browser only."
        />
        <div className="divide-y divide-line">
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-center">
            <div>
              <label
                htmlFor="currency"
                className="text-[13px] font-medium text-ink"
              >
                Currency
              </label>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">
                Amounts are stored in minor units and shown in this currency.
              </p>
            </div>
            <Select
              id="currency"
              value={state.currency}
              onChange={(event) =>
                dispatch({ type: 'currency/set', currency: event.target.value })
              }
              className="sm:max-w-64"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label} ({currency.code})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_260px] sm:items-center">
            <div>
              <p className="text-[13px] font-medium text-ink">Theme</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">
                System follows your operating system setting.
              </p>
            </div>
            <ThemeToggle showLabels />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Categories"
          description={`${state.categories.length} categories used for limits, labels, and charts.`}
        />
        <CategoryManager />
      </Card>

      <Card>
        <CardHeader
          title="Your data"
          description={`${state.transactions.length} transactions saved in this browser.`}
        />
        <div className="grid gap-6 px-5 py-5 sm:grid-cols-2 sm:divide-x sm:divide-line">
          <div className="sm:pr-6">
            <h3 className="text-[13px] font-semibold">Backup and restore</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Export every transaction as CSV, or import a bank export. The
              tracker expects{' '}
              <code className="rounded-[2px] bg-surface-2 px-1 py-0.5 font-mono text-[10.5px] text-ink">
                date
              </code>
              ,{' '}
              <code className="rounded-[2px] bg-surface-2 px-1 py-0.5 font-mono text-[10.5px] text-ink">
                category
              </code>
              ,{' '}
              <code className="rounded-[2px] bg-surface-2 px-1 py-0.5 font-mono text-[10.5px] text-ink">
                amount
              </code>
              , and{' '}
              <code className="rounded-[2px] bg-surface-2 px-1 py-0.5 font-mono text-[10.5px] text-ink">
                note
              </code>{' '}
              columns.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={exportCsv}>
                <DownloadIcon size={14} />
                Export CSV
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                <UploadIcon size={14} />
                Import CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
                aria-label="Choose a CSV file to import"
              />
            </div>
          </div>

          <div className="sm:pl-6">
            <h3 className="text-[13px] font-semibold">Start over</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              Deletes transactions and limits, and restores the default
              categories. Theme and currency stay as they are. This cannot be
              undone.
            </p>
            <div className="mt-3">
              <Button
                size="sm"
                variant="dangerGhost"
                onClick={() => setResetOpen(true)}
              >
                Reset all data
              </Button>
            </div>
          </div>
        </div>
        <p className="border-t border-line px-5 py-3 text-[10.5px] leading-relaxed text-muted">
          Local-first: nothing leaves your browser. Data lives under{' '}
          <code className="rounded-[2px] bg-surface-2 px-1 py-0.5 font-mono text-[10px] text-ink">
            {STORAGE_KEY}
          </code>{' '}
          in localStorage, so clearing site data will erase it.
        </p>
      </Card>

      {preview ? (
        <ImportDialog
          open={importOpen}
          fileName={preview.fileName}
          preview={preview.data}
          onClose={() => setImportOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={resetOpen}
        title="Reset all data?"
        description="Every transaction, category, and budget limit will be removed and the default categories restored. Export a CSV first if you want a copy."
        confirmLabel="Reset everything"
        onConfirm={resetData}
        onClose={() => setResetOpen(false)}
      />
    </div>
  )
}
