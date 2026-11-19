export function progressTone(ratio: number): string {
  if (ratio > 1) return 'bg-danger'
  if (ratio >= 0.8) return 'bg-warn'
  return 'bg-brand'
}

export function remainingTextTone(
  remainingCents: number,
  ratio: number,
): string {
  if (remainingCents < 0) return 'text-danger'
  if (ratio >= 0.8) return 'text-warn'
  return 'text-ink'
}
