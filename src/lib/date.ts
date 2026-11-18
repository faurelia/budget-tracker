import type { ISODate, MonthKey } from '../types'

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function toISODate(date: Date): ISODate {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): ISODate {
  return toISODate(new Date())
}

export function parseISODate(value: string): Date | null {
  const match = ISO_DATE_PATTERN.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function isValidISODate(value: string): boolean {
  return parseISODate(value) !== null
}

export function isValidMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value)
}

export function monthKeyOf(date: ISODate): MonthKey {
  return date.slice(0, 7)
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(todayISO())
}

export function monthFromParts(year: number, month: number): MonthKey {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return monthFromParts(date.getFullYear(), date.getMonth() + 1)
}

export function monthLabel(key: MonthKey): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function monthShortLabel(key: MonthKey): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
  })
}

export function daysInMonth(key: MonthKey): number {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export function monthRange(key: MonthKey): { start: ISODate; end: ISODate } {
  const start = `${key}-01`
  const end = `${key}-${String(daysInMonth(key)).padStart(2, '0')}`
  return { start, end }
}

export function isInMonth(date: ISODate, key: MonthKey): boolean {
  return date.startsWith(key)
}

export function isCurrentMonth(key: MonthKey): boolean {
  return key === currentMonthKey()
}

/** Days of the month that have already happened (0 for future months). */
export function elapsedDays(key: MonthKey): number {
  if (key < currentMonthKey()) return daysInMonth(key)
  if (key > currentMonthKey()) return 0
  return new Date().getDate()
}

export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function formatTransactionDate(date: ISODate): string {
  const parsed = parseISODate(date)
  if (!parsed) return date
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatShortDate(date: ISODate): string {
  const parsed = parseISODate(date)
  if (!parsed) return date
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

/** Most recent `count` months up to and including `endMonth`, oldest first. */
export function lastMonths(endMonth: MonthKey, count: number): MonthKey[] {
  const months: MonthKey[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    months.push(shiftMonth(endMonth, -offset))
  }
  return months
}

/**
 * Best-effort normalization for CSV dates: ISO, `YYYY/MM/DD`, or `M/D/YYYY`.
 * Returns null when the value is not a recognizable date.
 */
export function normalizeDateInput(raw: string): ISODate | null {
  const value = raw.trim()
  if (!value) return null

  const isoLike = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value)
  if (isoLike) {
    const candidate = `${isoLike[1]}-${isoLike[2].padStart(2, '0')}-${isoLike[3].padStart(2, '0')}`
    return isValidISODate(candidate) ? candidate : null
  }

  const usLike = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(value)
  if (usLike) {
    const candidate = `${usLike[3]}-${usLike[1].padStart(2, '0')}-${usLike[2].padStart(2, '0')}`
    return isValidISODate(candidate) ? candidate : null
  }

  return null
}
