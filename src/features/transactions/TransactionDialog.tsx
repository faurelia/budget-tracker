import { useState, type FormEvent } from 'react'
import { Field, Input, Select } from '../../components/ui/Field'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { currentMonthKey, isValidISODate, todayISO } from '../../lib/date'
import { centsToInput, currencySymbol, formatMoney, parseAmountToCents } from '../../lib/money'
import { useBudget } from '../../store/budgetContext'
import { useMonth } from '../../store/monthContext'
import type { Transaction } from '../../types'

interface TransactionDialogProps {
  open: boolean
  transaction: Transaction | null
  onClose: () => void
}

function TransactionForm({
  transaction,
  onDone,
}: {
  transaction: Transaction | null
  onDone: () => void
}) {
  const { state, dispatch } = useBudget()
  const { month } = useMonth()
  const toast = useToast()

  const defaultDate =
    month === currentMonthKey() ? todayISO() : `${month}-01`

  const [date, setDate] = useState(transaction?.date ?? defaultDate)
  const [amount, setAmount] = useState(
    transaction ? centsToInput(transaction.amountCents) : '',
  )
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? state.categories[0]?.id ?? '',
  )
  const [note, setNote] = useState(transaction?.note ?? '')
  const [error, setError] = useState<{ message: string; fieldId: string } | null>(
    null,
  )

  const symbol = currencySymbol(state.currency)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const fail = (message: string, fieldId: string) => {
      setError({ message, fieldId })
      document.getElementById(fieldId)?.focus()
    }

    if (!isValidISODate(date)) {
      fail('Pick a valid date.', 'transaction-date')
      return
    }

    const amountCents = parseAmountToCents(amount)
    if (amountCents === null) {
      fail('Enter an amount like 24.50.', 'transaction-amount')
      return
    }
    if (amountCents === 0) {
      fail('The amount cannot be zero.', 'transaction-amount')
      return
    }
    if (!state.categories.some((category) => category.id === categoryId)) {
      fail('Choose a category.', 'transaction-category')
      return
    }
    setError(null)

    const next: Transaction = {
      id: transaction?.id ?? crypto.randomUUID(),
      date,
      amountCents,
      categoryId,
      note: note.trim().slice(0, 200),
    }

    if (transaction) {
      dispatch({ type: 'transaction/update', transaction: next })
      toast.push('Transaction updated.', 'success')
    } else {
      dispatch({ type: 'transaction/add', transaction: next })
      toast.push('Transaction added.', 'success')
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date" htmlFor="transaction-date">
          <Input
            id="transaction-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-invalid={error?.fieldId === 'transaction-date'}
            required
          />
        </Field>
        <Field
          label="Amount"
          htmlFor="transaction-amount"
          hint={`${symbol} Use a minus sign for refunds.`}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12px] text-muted">
              {symbol}
            </span>
            <Input
              id="transaction-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              data-autofocus
              aria-invalid={error?.fieldId === 'transaction-amount'}
              className="money h-10 pr-3 pl-8 text-[15px] font-medium"
            />
          </div>
        </Field>
      </div>

      <Field label="Category" htmlFor="transaction-category">
        <Select
          id="transaction-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-invalid={error?.fieldId === 'transaction-category'}
        >
          {state.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Note"
        htmlFor="transaction-note"
        hint="Optional. Helps you remember what it was for."
      >
        <Input
          id="transaction-note"
          value={note}
          maxLength={200}
          placeholder="e.g. Weekly grocery run"
          onChange={(event) => setNote(event.target.value)}
        />
      </Field>

      {transaction ? (
        <p className="rounded-[3px] border border-line bg-surface-2/50 px-3 py-2 text-[11px] text-muted">
          Currently {formatMoney(transaction.amountCents, state.currency)}. Editing
          keeps the same transaction id.
        </p>
      ) : null}

      {error ? (
        <p className="text-[11px] text-danger" role="alert">
          {error.message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onDone}>Cancel</Button>
        <Button type="submit" variant="primary">
          {transaction ? 'Save changes' : 'Add transaction'}
        </Button>
      </div>
    </form>
  )
}

export function TransactionDialog({
  open,
  transaction,
  onClose,
}: TransactionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit transaction' : 'New transaction'}
      description={
        transaction
          ? 'Update the details and save your changes.'
          : 'Every expense counts toward the selected month.'
      }
    >
      <TransactionForm
        key={transaction?.id ?? 'new'}
        transaction={transaction}
        onDone={onClose}
      />
    </Dialog>
  )
}
