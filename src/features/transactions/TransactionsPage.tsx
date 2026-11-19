import { useMemo, useState } from 'react'
import { CategoryChip } from '../../components/CategoryChip'
import { PageHeader } from '../../components/PageHeader'
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
  formatShortDate,
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
    () =>
      new Map<string, Category>(
        state.categories.map((category) => [category.id, category]),
      ),
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
  const hasRefunds = filtered.some((transaction) => transaction.amountCents < 0)
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
    ? `${deleting.note || categoriesById.get(deleting.categoryId)?.name || 'Transaction'} for ${formatMoney(deleting.amountCents, currency)} on ${formatTransactionDate(deleting.date)}. This cannot be undone.`
    : ''

  const amountClass = (cents: number) =>
    cn('money', cents < 0 ? 'text-brand' : 'text-ink')

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
        className="hover:bg-danger-soft hover:text-danger"
        onClick={() => setDeleting(transaction)}
      >
        <TrashIcon size={14} />
      </Button>
    </div>
  )

  const emptyMessage = (
    <EmptyState
      icon={<ReceiptIcon size={22} />}
      title={
        monthTransactions.length === 0
          ? `Nothing logged in ${monthLabel(month)}`
          : 'No matches'
      }
      description={
        monthTransactions.length === 0
          ? 'Add an expense, or use the month picker to look at another month.'
          : 'Nothing in this month matches your filters.'
      }
      action={
        monthTransactions.length === 0 ? (
          <Button variant="primary" size="sm" onClick={openNew}>
            <PlusIcon size={14} />
            Add transaction
          </Button>
        ) : (
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
        )
      }
    />
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description={`Every expense in ${monthLabel(month)}.`}
        actions={
          <Button variant="primary" onClick={openNew}>
            <PlusIcon size={15} />
            Add transaction
          </Button>
        }
      />

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
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
        <div className="grid grid-cols-2 gap-2.5 max-[359px]:grid-cols-1 lg:flex">
          <Select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="min-w-0 lg:w-44"
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
            className="min-w-0 lg:w-40"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasFilters ? (
        <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
          <p className="text-[11px] text-muted">
            Showing {filtered.length} of {monthTransactions.length} for{' '}
            {monthLabel(month)}.
          </p>
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
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          emptyMessage
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-left">
                <caption className="sr-only">
                  Transactions for {monthLabel(month)}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface-2/50 text-[10.5px] font-semibold text-muted">
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Category
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">
                      Note
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-right font-semibold"
                    >
                      Amount
                    </th>
                    <th scope="col" className="w-20 px-2 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="group border-b border-line/70 transition-colors last:border-0 hover:bg-surface-2/30"
                    >
                      <td className="px-4 py-3 font-mono text-[10.5px] whitespace-nowrap text-muted">
                        {formatTransactionDate(transaction.date)}
                      </td>
                      <td className="max-w-48 px-4 py-3">
                        <CategoryChip
                          category={categoriesById.get(transaction.categoryId)}
                        />
                      </td>
                      <td className="max-w-72 truncate px-4 py-3 text-[13px] text-muted">
                        {transaction.note || '—'}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-3 text-right text-[13px] font-medium',
                          amountClass(transaction.amountCents),
                        )}
                      >
                        {formatMoney(transaction.amountCents, currency)}
                      </td>
                      <td className="px-2 py-2">
                        <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                          {actions(transaction)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-surface-2/30">
                    <td
                      colSpan={3}
                      className="px-4 py-2.5 text-[10.5px] font-semibold text-muted"
                    >
                      {filtered.length}{' '}
                      {filtered.length === 1 ? 'transaction' : 'transactions'},{' '}
                      {hasRefunds ? 'net total' : 'total'}
                    </td>
                    <td className="money px-4 py-2.5 text-right text-[13px] font-medium">
                      {formatMoney(filteredTotal, currency)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {filtered.map((transaction) => {
                const category = categoriesById.get(transaction.categoryId)
                return (
                  <li key={transaction.id} className="flex gap-3 px-4 py-3">
                    <span className="w-10 shrink-0 pt-0.5 font-mono text-[10px] leading-tight text-muted">
                      {formatShortDate(transaction.date)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[13px] font-medium">
                          {transaction.note || category?.name || 'Transaction'}
                        </p>
                        <p
                          className={cn(
                            'shrink-0 text-[13px] font-medium',
                            amountClass(transaction.amountCents),
                          )}
                        >
                          {formatMoney(transaction.amountCents, currency)}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <CategoryChip category={category} />
                        {actions(transaction)}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-baseline justify-between gap-3 border-t border-line bg-surface-2/30 px-4 py-2.5 md:hidden">
              <span className="text-[10.5px] font-semibold text-muted">
                {filtered.length}{' '}
                {filtered.length === 1 ? 'transaction' : 'transactions'},{' '}
                {hasRefunds ? 'net total' : 'total'}
              </span>
              <span className="money text-[13px] font-medium">
                {formatMoney(filteredTotal, currency)}
              </span>
            </div>
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
