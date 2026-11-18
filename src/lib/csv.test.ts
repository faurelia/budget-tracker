import { describe, expect, it } from 'vitest'
import { parseCSV, parseTransactionsCSV, toCSV, transactionsToCSV } from './csv'

describe('toCSV', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = toCSV([['a,b', 'say "hi"', 'line\nbreak']])
    expect(csv).toBe('"a,b","say ""hi""","line\nbreak"\r\n')
  })
})

describe('parseCSV', () => {
  it('handles quoted fields, escaped quotes, and CRLF', () => {
    const rows = parseCSV('a,b\r\n"1,2","say ""hi"""\r\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['1,2', 'say "hi"'],
    ])
  })

  it('drops blank lines and strips a BOM', () => {
    const rows = parseCSV('\uFEFFdate,amount\r\n\r\n2024-03-01,5.00\r\n')
    expect(rows).toEqual([
      ['date', 'amount'],
      ['2024-03-01', '5.00'],
    ])
  })

  it('keeps newlines inside quoted fields', () => {
    const rows = parseCSV('note\n"first\nsecond"\n')
    expect(rows[1][0]).toBe('first\nsecond')
  })
})

describe('transactionsToCSV + parseTransactionsCSV', () => {
  it('round-trips the exported shape', () => {
    const csv = transactionsToCSV([
      {
        date: '2024-03-01',
        categoryName: 'Groceries',
        amountCents: 123456,
        note: 'Big, "quoted" shop',
      },
      {
        date: '2024-03-02',
        categoryName: 'Dining',
        amountCents: -450,
        note: '',
      },
    ])

    const preview = parseTransactionsCSV(csv)
    expect(preview.errors).toEqual([])
    expect(preview.skippedIncome).toBe(0)
    expect(preview.rows).toEqual([
      {
        date: '2024-03-01',
        categoryName: 'Groceries',
        amountCents: 123456,
        note: 'Big, "quoted" shop',
      },
      {
        date: '2024-03-02',
        categoryName: 'Dining',
        amountCents: -450,
        note: '',
      },
    ])
  })

  it('reads header-based bank exports and skips income', () => {
    const preview = parseTransactionsCSV(
      [
        'Date,Description,Amount,Type',
        '2024-03-01,Coffee,4.50,Debit',
        '2024-03-02,Salary,2500.00,Credit',
      ].join('\n'),
    )

    expect(preview.skippedIncome).toBe(1)
    expect(preview.errors).toEqual([])
    expect(preview.rows).toHaveLength(1)
    expect(preview.rows[0]).toMatchObject({
      date: '2024-03-01',
      amountCents: 450,
      note: 'Coffee',
      categoryName: 'Other',
    })
  })

  it('supports separate debit and credit columns', () => {
    const preview = parseTransactionsCSV(
      [
        'Date,Description,Debit,Credit',
        '2024-03-01,Shop,25.00,',
        '2024-03-02,Refund,,10.00',
      ].join('\n'),
    )

    expect(preview.rows).toHaveLength(1)
    expect(preview.rows[0].amountCents).toBe(2500)
    expect(preview.skippedIncome).toBe(1)
  })

  it('reports bad rows instead of importing them', () => {
    const preview = parseTransactionsCSV(
      [
        'date,category,amount,note',
        '2024-02-30,Groceries,10.00,bad date',
        '2024-03-01,Groceries,abc,bad amount',
        '2024-03-02,Groceries,0,zero',
        '2024-03-03,Groceries,12.00,fine',
      ].join('\n'),
    )

    expect(preview.rows).toHaveLength(1)
    expect(preview.rows[0].note).toBe('fine')
    expect(preview.errors).toHaveLength(3)
    expect(preview.errors.map((error) => error.line)).toEqual([2, 3, 4])
  })

  it('falls back to positional columns without a header', () => {
    const preview = parseTransactionsCSV(
      ['2024-03-01,Groceries,10.00,market', '2024-03-02,Dining,8.25,lunch'].join('\n'),
    )

    expect(preview.errors).toEqual([])
    expect(preview.rows).toHaveLength(2)
    expect(preview.rows[1]).toMatchObject({
      date: '2024-03-02',
      categoryName: 'Dining',
      amountCents: 825,
      note: 'lunch',
    })
  })
})
