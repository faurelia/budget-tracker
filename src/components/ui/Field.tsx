import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { cn } from '../../lib/cn'

export const controlClass =
  'w-full rounded-[3px] border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/60 hover:border-ink/20 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-9', controlClass, className)} {...props} />
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('h-9 pr-8', controlClass, className)} {...props}>
      {children}
    </select>
  )
}

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold tracking-[0.01em] text-muted"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-snug text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
