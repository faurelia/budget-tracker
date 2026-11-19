import { cn } from '../../lib/cn'
import { progressTone } from '../../lib/progress'

interface ProgressBarProps {
  /** `spent / limit`. Values above 1 render a full bar. */
  ratio: number
  /** Where the month is, from 0 to 1. Draws a pace marker when provided. */
  markerAt?: number | null
  variant?: 'default' | 'plate'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZES = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
} as const

export function ProgressBar({
  ratio,
  markerAt = null,
  variant = 'default',
  size = 'md',
  className,
  label,
}: ProgressBarProps) {
  const width = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) * 100 : 0
  const marker =
    markerAt !== null && Number.isFinite(markerAt)
      ? Math.min(Math.max(markerAt, 0), 1) * 100
      : null
  const onPlate = variant === 'plate'

  return (
    <div
      className={cn(
        'meter rounded-[2px] border',
        SIZES[size],
        onPlate
          ? '[--ui-meter-marker:var(--ui-plate-ink)] [--ui-meter-tick:rgb(240_244_236/0.34)] border-plate-line bg-plate-line/50'
          : 'border-line bg-surface-2',
        className,
      )}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <span
        className="absolute inset-0 overflow-hidden rounded-[1px]"
        aria-hidden="true"
      >
        <span
          className={cn(
            'block h-full transition-[width] duration-300',
            onPlate
              ? ratio > 1
                ? 'bg-plate-danger'
                : 'bg-brass'
              : progressTone(ratio),
          )}
          style={{ width: `${width}%` }}
        />
        <span className="meter-ticks" />
      </span>
      {marker !== null ? (
        <span
          className="meter-marker"
          style={{ left: `calc(${marker}% - 1px)` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}
