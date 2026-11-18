const formatterCache = new Map<string, Intl.NumberFormat>()

export const CURRENCIES = [
  { code: 'USD', label: 'US dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British pound' },
  { code: 'JPY', label: 'Japanese yen' },
  { code: 'CHF', label: 'Swiss franc' },
  { code: 'CAD', label: 'Canadian dollar' },
  { code: 'AUD', label: 'Australian dollar' },
  { code: 'NZD', label: 'New Zealand dollar' },
  { code: 'SEK', label: 'Swedish krona' },
  { code: 'NOK', label: 'Norwegian krone' },
  { code: 'DKK', label: 'Danish krone' },
  { code: 'PLN', label: 'Polish złoty' },
  { code: 'INR', label: 'Indian rupee' },
  { code: 'BRL', label: 'Brazilian real' },
  { code: 'MXN', label: 'Mexican peso' },
  { code: 'ZAR', label: 'South African rand' },
  { code: 'SGD', label: 'Singapore dollar' },
] as const

export function isSupportedCurrency(code: string): boolean {
  return CURRENCIES.some((currency) => currency.code === code)
}

function getFormatter(
  currency: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${currency}|${JSON.stringify(options)}`
  const cached = formatterCache.get(key)
  if (cached) return cached

  let formatter: Intl.NumberFormat
  try {
    formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      ...options,
    })
  } catch {
    formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      ...options,
    })
  }
  formatterCache.set(key, formatter)
  return formatter
}

/**
 * A lone separator followed by exactly three digits is read as a thousands
 * group (`1,234`), except for values like `0.005` where that reading would
 * be nonsense.
 */
function isGroupSeparator(value: string, separator: '.' | ','): boolean {
  const pattern = separator === '.' ? /\.\d{3}$/ : /,\d{3}$/
  if (!pattern.test(value)) return false
  if (value.split(separator).length > 2) return true
  const integerPart = value.split(separator)[0]
  return !/^0$/.test(integerPart)
}

/**
 * Parse a human-entered amount into integer cents.
 * Accepts currency symbols, spaces, and both `1,234.56` and `1.234,56`.
 * Returns `null` when the input is not a usable number.
 */
export function parseAmountToCents(raw: string): number | null {
  if (!raw) return null

  let value = raw.trim().replace(/[\s\u00a0\u202f]/g, '')
  value = value.replace(/[^\d.,+-]/g, '')
  if (!value) return null

  const negative = value.startsWith('-')
  value = value.replace(/[+-]/g, '')
  if (!value || !/\d/.test(value)) return null

  const lastComma = value.lastIndexOf(',')
  const lastDot = value.lastIndexOf('.')
  let normalized: string

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandSeparator = decimalSeparator === ',' ? '.' : ','
    normalized = value
      .split(thousandSeparator)
      .join('')
      .replace(decimalSeparator, '.')
  } else if (lastComma !== -1) {
    normalized = isGroupSeparator(value, ',')
      ? value.replace(/,/g, '')
      : value.replace(',', '.')
  } else if (lastDot !== -1) {
    normalized = isGroupSeparator(value, '.') ? value.replace(/\./g, '') : value
  } else {
    normalized = value
  }

  const number = Number(normalized)
  if (!Number.isFinite(number)) return null

  const cents = Math.round(number * 100)
  if (!Number.isSafeInteger(cents)) return null
  return negative ? -Math.abs(cents) : cents
}

export function formatMoney(
  cents: number,
  currency: string,
  options: { signed?: boolean } = {},
): string {
  const formatter = getFormatter(currency, {
    minimumFractionDigits: undefined,
    maximumFractionDigits: 2,
    signDisplay: options.signed ? 'always' : 'auto',
  })
  return formatter.format(cents / 100)
}

/** Currency glyph for input adornments, e.g. `$` or `€`. */
export function currencySymbol(currency: string): string {
  const parts = getFormatter(currency, {}).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

/** Compact amount for chart axes, e.g. `$1.2K`. */
export function formatMoneyShort(cents: number, currency: string): string {
  const formatter = getFormatter(currency, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
  return formatter.format(cents / 100)
}

/** Plain editable value for inputs, e.g. `1234.50`. Zero becomes blank. */
export function centsToInput(cents: number): string {
  if (!Number.isFinite(cents) || cents === 0) return ''
  return (cents / 100).toFixed(2)
}

export function formatPercent(ratio: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(ratio)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits,
  }).format(ratio)
}

export function safeCurrency(currency: string): string {
  return isSupportedCurrency(currency) ? currency : 'USD'
}
