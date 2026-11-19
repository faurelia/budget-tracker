import { cn } from '../../lib/cn'
import type { ThemePreference } from '../../types'
import { useBudget } from '../../store/budgetContext'
import { MonitorIcon, MoonIcon, SunIcon } from '../icons'

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  Icon: typeof SunIcon
}> = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
]

export function ThemeToggle({ showLabels = false }: { showLabels?: boolean }) {
  const { state, dispatch } = useBudget()

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex rounded-[3px] border border-line bg-surface-2/70 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = state.theme === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => dispatch({ type: 'theme/set', theme: value })}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 text-[11px] font-medium transition-colors',
              active ? 'bg-surface text-ink' : 'text-muted hover:text-ink',
            )}
          >
            <Icon size={14} />
            {showLabels ? label : <span className="sr-only">{label}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function ThemeCycleButton() {
  const { state, dispatch, isDark } = useBudget()

  const next: ThemePreference =
    state.theme === 'light' ? 'system' : state.theme === 'system' ? 'dark' : 'light'
  const Icon = state.theme === 'system' ? MonitorIcon : isDark ? MoonIcon : SunIcon
  const label =
    state.theme === 'system'
      ? 'Theme: system'
      : state.theme === 'dark'
        ? 'Theme: dark'
        : 'Theme: light'

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'theme/set', theme: next })}
      title={`${label} — switch to ${next}`}
      aria-label={`${label}. Switch to ${next} theme.`}
      className="grid size-8 place-items-center rounded-[3px] border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-ink"
    >
      <Icon size={15} />
    </button>
  )
}
