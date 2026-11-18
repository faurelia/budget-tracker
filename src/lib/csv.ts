import type { ISODate } from '../types'
import { normalizeDateInput } from './date'
import { parseAmountToCents } from './money'

export const CSV_HEADER = ['date', 'category', 'amount', 'note'] as const

export interface ExportRow {
  date: ISODate
  categoryName: string
  amountCents: number
  note: string
}

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** RFC 4180-ish serialization with CRLF line endings and a trailing newline. */
export function toCSV(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}\r\n`
}

export function transactionsToCSV(rows: ExportRow[]): string {
  const body = rows.map((row) => [
    row.date,
    row.categoryName,
    (row.amountCents / 100).toFixed(2),
    row.note,
  ])
  return toCSV([[...CSV_HEADER], ...body])
}

export function parseCSV(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let index = 0

  while (index < source.length) {
    const char = source[index]

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index += 2
          continue
        }
        inQuotes = false
        index += 1
        continue
      }
      field += char
      index += 1
      continue
    }

    if (char === '"' && field === '') {
      inQuotes = true
      index += 1
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      index += 1
      continue
    }
    if (char === '\r') {
      index += 1
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      index += 1
      continue
    }

    field += char
    index += 1
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

export interface ImportRow {
  date: ISODate
  amountCents: number
  categoryName: string
  note: string
}

export interface ImportFailure {
  line: number
  message: string
}

export interface ImportPreview {
  rows: ImportRow[]
  errors: ImportFailure[]
  skippedIncome: number
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '')
}

function findColumn(headers: string[], names: string[]): number {
  return headers.findIndex((header) => names.includes(header))
}

const DATE_HEADERS = ['date', 'transactiondate', 'posteddate', 'postingdate', 'day']
const AMOUNT_HEADERS = ['amount', 'value', 'sum', 'total']
const CATEGORY_HEADERS = ['category', 'categoryname', 'categorylabel', 'cat']
const NOTE_HEADERS = ['note', 'notes', 'memo', 'description', 'details', 'merchant']
const TYPE_HEADERS = ['type', 'kind', 'transactiontype', 'direction']
const DEBIT_HEADERS = ['debit', 'debitamount', 'withdrawal', 'moneyout']
const CREDIT_HEADERS = ['credit', 'creditamount', 'deposit', 'moneyin']

const INCOME_PATTERN = /income|credit|inflow|deposit|earning/i

/**
 * Parse a transactions CSV. Accepts either the exported shape
 * (`date,category,amount,note`) or header-based bank exports with a
 * `type` column (income rows are skipped) or `debit`/`credit` columns.
 */
export function parseTransactionsCSV(text: string): ImportPreview {
  const rows = parseCSV(text)
  const result: ImportPreview = { rows: [], errors: [], skippedIncome: 0 }
  if (rows.length === 0) return result

  const headers = rows[0].map(normalizeHeader)
  const dateIndex = findColumn(headers, DATE_HEADERS)
  const amountIndex = findColumn(headers, AMOUNT_HEADERS)
  const categoryIndex = findColumn(headers, CATEGORY_HEADERS)
  const noteIndex = findColumn(headers, NOTE_HEADERS)
  const typeIndex = findColumn(headers, TYPE_HEADERS)
  const debitIndex = findColumn(headers, DEBIT_HEADERS)
  const creditIndex = findColumn(headers, CREDIT_HEADERS)

  const hasHeader =
    dateIndex !== -1 && (amountIndex !== -1 || debitIndex !== -1 || creditIndex !== -1)

  if (!hasHeader && creditIndex !== -1 && debitIndex === -1 && amountIndex === -1) {
    result.errors.push({
      line: 1,
      message: 'Could not find an amount column in this file.',
    })
    return result
  }

  const columns = hasHeader
    ? {
        date: dateIndex,
        amount: amountIndex,
        category: categoryIndex,
        note: noteIndex,
        type: typeIndex,
        debit: debitIndex,
        credit: creditIndex,
      }
    : { date: 0, amount: 2, category: 1, note: 3, type: -1, debit: -1, credit: -1 }

  const dataRows = hasHeader ? rows.slice(1) : rows

  dataRows.forEach((cells, offset) => {
    const line = hasHeader ? offset + 2 : offset + 1
    const cell = (column: number): string =>
      column >= 0 && column < cells.length ? cells[column].trim() : ''

    const typeValue = cell(columns.type)
    if (typeValue && INCOME_PATTERN.test(typeValue)) {
      result.skippedIncome += 1
      return
    }

    const rawDate = cell(columns.date)
    const date = normalizeDateInput(rawDate)
    if (!date) {
      result.errors.push({
        line,
        message: rawDate ? `Unrecognized date "${rawDate}".` : 'Missing date.',
      })
      return
    }

    let rawAmount = cell(columns.amount)
    if (!rawAmount && columns.credit >= 0 && !cell(columns.debit)) {
      const credit = cell(columns.credit)
      if (credit) {
        result.skippedIncome += 1
        return
      }
    }
    if (!rawAmount && columns.debit >= 0) rawAmount = cell(columns.debit)
    if (!rawAmount && columns.credit >= 0) {
      result.skippedIncome += 1
      return
    }

    const amountCents = parseAmountToCents(rawAmount)
    if (amountCents === null) {
      result.errors.push({
        line,
        message: rawAmount ? `Unrecognized amount "${rawAmount}".` : 'Missing amount.',
      })
      return
    }
    if (amountCents === 0) {
      result.errors.push({ line, message: 'Amount is zero.' })
      return
    }

    result.rows.push({
      date,
      amountCents,
      categoryName: cell(columns.category) || 'Other',
      note: cell(columns.note),
    })
  })

  return result
}
