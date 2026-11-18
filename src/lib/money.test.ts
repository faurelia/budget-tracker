import { describe, expect, it } from 'vitest'
import { centsToInput, formatMoney, parseAmountToCents } from './money'

describe('parseAmountToCents', () => {
  it.each([
    ['12', 1200],
    ['12.50', 1250],
    ['0.01', 1],
    ['$1,234.56', 123456],
    ['1.234,56', 123456],
    ['1,234', 123400],
    ['1,5', 150],
    ['-25.75', -2575],
    [' 42 ', 4200],
    ['€ 99,90', 9990],
  ])('parses %s', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected)
  })

  it('rejects unusable input', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('   ')).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('-')).toBeNull()
    expect(parseAmountToCents('+')).toBeNull()
  })

  it('rounds to whole cents', () => {
    expect(parseAmountToCents('0.005')).toBe(1)
    expect(parseAmountToCents('0.999')).toBe(100)
  })

  it('treats three trailing digits as a thousands group', () => {
    expect(parseAmountToCents('1.234')).toBe(123400)
    expect(parseAmountToCents('10.999')).toBe(1099900)
    expect(parseAmountToCents('1,234')).toBe(123400)
  })
})

describe('centsToInput', () => {
  it('renders an editable decimal value', () => {
    expect(centsToInput(123456)).toBe('1234.56')
    expect(centsToInput(1)).toBe('0.01')
    expect(centsToInput(-500)).toBe('-5.00')
  })

  it('leaves zero blank for inputs', () => {
    expect(centsToInput(0)).toBe('')
  })
})

describe('formatMoney', () => {
  it('includes the currency and amount', () => {
    const formatted = formatMoney(123456, 'USD')
    expect(formatted).toContain('1,234.56')
    expect(formatted).toContain('$')
  })

  it('falls back for unknown currency codes', () => {
    expect(() => formatMoney(100, 'NOT-A-CURRENCY')).not.toThrow()
  })
})
