import type { MonthKey } from '../../types'
import { currentMonthKey, isCurrentMonth, monthLabel, shiftMonth } from '../../lib/date'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'

interface MonthPickerProps {
  month: MonthKey
  onChange: (month: MonthKey) => void
}

const buttonClass =
  'grid size-8 place-items-center text-muted transition-colors hover:bg-surface-2 hover:text-ink'

export function MonthPicker({ month, onChange }: MonthPickerProps) {
  const isCurrent = isCurrentMonth(month)

  return (
    <div className="flex items-center rounded-[3px] border border-line bg-surface">
      <button
        type="button"
        aria-label="Previous month"
        className={buttonClass}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeftIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange(currentMonthKey())}
        title={isCurrent ? 'Current month' : 'Jump to current month'}
        className="min-w-[7.5rem] border-x border-line px-1 py-1.5 text-center text-[12px] font-semibold text-ink transition-colors hover:text-brand sm:min-w-[8.25rem]"
      >
        {monthLabel(month)}
      </button>
      <button
        type="button"
        aria-label="Next month"
        className={buttonClass}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRightIcon size={16} />
      </button>
    </div>
  )
}
