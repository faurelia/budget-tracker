import { useMemo, useState } from 'react'
import { CategoryChip } from '../../components/CategoryChip'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/Dialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input, Select } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toastContext'
import {
  PencilIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
} from '../../components/icons'
import { cn } from '../../lib/cn'
import {
  compareISODate,
  formatTransactionDate,
  monthLabel,
} from '../../lib/date'
import { formatMoney } from '../../lib/money'
import { transactionsForMonth } from '../../lib/selectors'
import { useBudget } from '../../store/budgetContext'
import { useMonth } from '../../store/monthContext'
import type { Category, Transaction } from '../../types'
import { TransactionDialog } from './TransactionDialog'

type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
]

export function TransactionsPage() {
  const { state, dispatch } = useBudget()
  const { month } = useMonth()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('date-desc')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  const currency = state.currency
  const categoriesById = useMemo(
    () => new Map<string, Category>(state.categories.map((category) => [category.id, category])),
    [state.categories],
  )

  const monthTransactions = useMemo(
    () => transactionsForMonth(state, month),
    [state, month],
  )

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const list = monthTransactions.filter((transaction) => {
      if (categoryFilter !== 'all' && transaction.categoryId !== categoryFilter) {
        return false
      }
      if (!needle) return true
      const categoryName = categoriesById.get(transaction.categoryId)?.name ?? ''
      return (
        transaction.note.toLowerCase().includes(needle) ||
        categoryName.toLowerCase().includes(needle) ||
        transaction.date.includes(needle)
      )
    })

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return compareISODate(a.date, b.date) || a.id.localeCompare(b.id)
        case 'amount-desc':
          return b.amountCents - a.amountCents
        case 'amount-asc':
          return a.amountCents - b.amountCents
        case 'date-desc':
        default:
          return compareISODate(b.date, a.date) || a.id.localeCompare(b.id)
      }
    })
  }, [monthTransactions, search, categoryFilter, sort, categoriesById])

  const filteredTotal = filtered.reduce(
    (total, transaction) => total + transaction.amountCents,
    0,
  )
  const hasFilters = search.trim() !== '' || categoryFilter !== 'all'

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction)
    setFormOpen(true)
  }

  const confirmDelete = () => {
    if (!deleting) return
    dispatch({ type: 'transaction/remove', id: deleting.id })
    setDeleting(null)
    toast.push('Transaction deleted.', 'success')
  }

  const deleteDescription = deleting
    ? `${deleting.note || categoriesById.get(deleting.categoryId)?.name || 'Transaction'} · ${formatMoney(deleting.amountCents, currency)} on ${formatTransactionDate(deleting.date)}. This cannot be undone.`
    : ''

  const amountClass = (cents: number) =>
    cn('tabular font-medium', cents < 0 && 'text-emerald-600 dark:text-emerald-400')

  const actions = (transaction: Transaction) => (
    <div className="flex shrink-0 justify-end gap-0.5">
      <Button
        variant="ghost"
        size="iconSm"
        aria-label={`Edit ${transaction.note || 'transaction'}`}
        onClick={() => openEdit(transaction)}
      >
        <PencilIcon size={14} />
      </Button>
      <Button
        variant="ghost"
        size="iconSm"
        aria-label={`Delete ${transaction.note || 'transaction'}`}
        className="hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
        onClick={() => setDeleting(transaction)}
      >
        <TrashIcon size={14} />
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search notes, categories, dates"
              aria-label="Search transactions"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="min-w-0 flex-1 lg:w-44"
            >
              <option value="all">All categories</option>
              {state.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Sort transactions"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="min-w-0 flex-1 lg:w-40"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="primary" onClick={openNew} className="w-full lg:w-auto">
            <PlusIcon size={15} />
            Add transaction
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{monthLabel(month)}</h2>
          <p className="text-xs text-muted">
            {filtered.length} of {monthTransactions.length} transaction
            {monthTransactions.length === 1 ? '' : 's'} · {formatMoney(filteredTotal, currency)}
          </p>
        </div>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('')
              setCategoryFilter('all')
            }}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          monthTransactions.length === 0 ? (
            <EmptyState
              icon={<ReceiptIcon size={22} />}
              title={`No transactions in ${monthLabel(month)}`}
              description="Log an expense here, or use the month picker to look at a different month."
              action={
                <Button variant="primary" size="sm" onClick={openNew}>
                  <PlusIcon size={14} />
                  Add transaction
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No matches"
              description="Nothing in this month matches your filters."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Transactions for {monthLabel(month)}
                </caption>
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-wide text-muted uppercase">
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Note
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Amount
                    </th>
                    <th scope="col" className="w-24 px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-line/70 transition-colors last:border-0 hover:bg-surface-2/40"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-muted">
                        {formatTransactionDate(transaction.date)}
                      </td>
                      <td className="max-w-48 px-4 py-2.5">
                        <CategoryChip category={categoriesById.get(transaction.categoryId)} />
                      </td>
                      <td className="max-w-72 truncate px-4 py-2.5 text-muted">
                        {transaction.note || '—'}
                      </td>
                      <td className={cn('px-4 py-2.5 text-right', amountClass(transaction.amountCents))}>
                        {formatMoney(transaction.amountCents, currency)}
                      </td>
                      <td className="px-2 py-1.5">{actions(transaction)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {filtered.map((transaction) => {
                const category = categoriesById.get(transaction.categoryId)
                return (
                  <li key={transaction.id} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {transaction.note || category?.name || 'Transaction'}
                      </p>
                      <p className={cn('shrink-0 text-sm', amountClass(transaction.amountCents))}>
                        {formatMoney(transaction.amountCents, currency)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <CategoryChip category={category} />
                      <span className="text-[11px] text-muted">
                        {formatTransactionDate(transaction.date)}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-end">{actions(transaction)}</div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <TransactionDialog
        open={formOpen}
        transaction={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete transaction?"
        description={deleteDescription}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
