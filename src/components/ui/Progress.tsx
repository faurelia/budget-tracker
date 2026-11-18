import { cn } from '../../lib/cn'
import { progressTone } from '../../lib/progress'

interface ProgressBarProps {
  /** `spent / limit`. Values above 1 render a full bar. */
  ratio: number
  className?: string
  label?: string
}

export function ProgressBar({ ratio, className, label }: ProgressBarProps) {
  const width = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) * 100 : 0

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300',
          progressTone(ratio),
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
