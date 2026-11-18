export function progressTone(ratio: number): string {
  if (ratio > 1) return 'bg-red-500'
  if (ratio >= 0.8) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function remainingTextTone(
  remainingCents: number,
  ratio: number,
): string {
  if (remainingCents < 0) return 'text-red-600 dark:text-red-400'
  if (ratio >= 0.8) return 'text-amber-600 dark:text-amber-400'
  return 'text-ink'
}
