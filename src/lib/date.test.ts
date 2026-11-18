import { describe, expect, it } from 'vitest'
import {
  daysInMonth,
  elapsedDays,
  isValidISODate,
  lastMonths,
  monthRange,
  normalizeDateInput,
  shiftMonth,
} from './date'

describe('shiftMonth', () => {
  it('crosses year boundaries', () => {
    expect(shiftMonth('2024-01', -1)).toBe('2023-12')
    expect(shiftMonth('2024-12', 1)).toBe('2025-01')
    expect(shiftMonth('2024-06', 0)).toBe('2024-06')
    expect(shiftMonth('2024-03', -14)).toBe('2023-01')
  })
})

describe('daysInMonth', () => {
  it('handles leap years', () => {
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2023-02')).toBe(28)
    expect(daysInMonth('2024-04')).toBe(30)
    expect(daysInMonth('2024-12')).toBe(31)
  })
})

describe('monthRange', () => {
  it('returns inclusive ISO bounds', () => {
    expect(monthRange('2024-02')).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    })
    expect(monthRange('2024-11')).toEqual({
      start: '2024-11-01',
      end: '2024-11-30',
    })
  })
})

describe('isValidISODate', () => {
  it('rejects impossible dates', () => {
    expect(isValidISODate('2024-02-29')).toBe(true)
    expect(isValidISODate('2023-02-29')).toBe(false)
    expect(isValidISODate('2024-13-01')).toBe(false)
    expect(isValidISODate('2024-1-01')).toBe(false)
    expect(isValidISODate('not-a-date')).toBe(false)
  })
})

describe('normalizeDateInput', () => {
  it('accepts ISO and slash variants', () => {
    expect(normalizeDateInput('2024-03-05')).toBe('2024-03-05')
    expect(normalizeDateInput('2024/3/5')).toBe('2024-03-05')
    expect(normalizeDateInput('3/5/2024')).toBe('2024-03-05')
    expect(normalizeDateInput('12/31/2024')).toBe('2024-12-31')
  })

  it('rejects values that are not dates', () => {
    expect(normalizeDateInput('2024-02-30')).toBeNull()
    expect(normalizeDateInput('')).toBeNull()
    expect(normalizeDateInput('yesterday')).toBeNull()
  })
})

describe('lastMonths', () => {
  it('returns months oldest first, ending at the given month', () => {
    expect(lastMonths('2024-03', 3)).toEqual(['2024-01', '2024-02', '2024-03'])
    expect(lastMonths('2024-01', 2)).toEqual(['2023-12', '2024-01'])
  })
})

describe('elapsedDays', () => {
  it('reports full months for past months', () => {
    expect(elapsedDays('2024-03')).toBe(31)
  })

  it('reports zero for future months', () => {
    expect(elapsedDays('2999-01')).toBe(0)
  })
})
