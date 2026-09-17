import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ')
}

export { cx }

/* ------------------------------- Button ------------------------------- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  iconRight?: IconName
  solidIcon?: boolean
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.97]'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-[var(--surface-raised)] hover:brightness-110 shadow-[0_2px_10px_-2px_rgb(0_0_0/0.25)]',
  secondary:
    'bg-raised text-ink border border-line hover:border-line-strong hover:bg-sunken',
  ghost: 'text-ink-soft hover:text-ink hover:bg-sunken',
  quiet: 'text-ink-soft hover:text-accent',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[0.8rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[0.95rem]',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  solidIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], !children && 'aspect-square px-0', className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} solid={solidIcon} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>
  )
}

/* -------------------------------- Chip -------------------------------- */

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  count?: number
  tone?: string
}

export function Chip({ active, count, tone, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        'group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-medium transition-all duration-200',
        active
          ? 'border-transparent text-[var(--surface-raised)]'
          : 'border-line bg-raised text-ink-soft hover:border-line-strong hover:text-ink',
        className,
      )}
      style={active ? { background: tone ?? 'var(--accent)' } : undefined}
      {...rest}
    >
      {children}
      {count !== undefined && (
        <span className={cx('text-[0.7rem] tabular-nums', active ? 'opacity-70' : 'text-ink-faint')}>{count}</span>
      )}
    </button>
  )
}

/* ------------------------------- Badge -------------------------------- */

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: string
  soft?: boolean
}

export function Badge({ tone, soft = true, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium tracking-wide',
        className,
      )}
      style={
        soft
          ? { background: `color-mix(in srgb, ${tone ?? 'var(--accent)'} 15%, transparent)`, color: tone ?? 'var(--accent)' }
          : { background: tone ?? 'var(--accent)', color: 'var(--surface-raised)' }
      }
      {...rest}
    >
      {children}
    </span>
  )
}

/* ------------------------------ Segmented ----------------------------- */

interface SegmentedProps<T extends string> {
  value: T
  options: { value: T; label: string; icon?: IconName }[]
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ value, options, onChange, className, size = 'md' }: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cx('inline-flex rounded-full border border-line bg-sunken p-0.5', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
              size === 'sm' ? 'h-7 px-2.5 text-[0.75rem]' : 'h-9 px-3.5 text-[0.82rem]',
              active ? 'bg-raised text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint hover:text-ink-soft',
            )}
          >
            {option.icon && <Icon name={option.icon} size={size === 'sm' ? 14 : 16} />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------ Section ------------------------------- */

interface SectionProps {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, subtitle, action, children, className }: SectionProps) {
  return (
    <section className={cx('space-y-4', className)}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.6rem] leading-tight font-semibold tracking-[-0.015em]">{title}</h2>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-soft text-balance-pretty">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

/* ------------------------------ DataRow ------------------------------- */

export function DataRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(6.5rem,9rem)_1fr] gap-x-4 gap-y-1 border-b border-line py-3 last:border-0">
      <dt className="text-[0.72rem] font-semibold tracking-[0.09em] text-ink-faint uppercase">{label}</dt>
      <dd className="text-[0.92rem] leading-relaxed text-ink-soft text-balance-pretty">{children}</dd>
    </div>
  )
}

/* ------------------------------- Empty -------------------------------- */

export function EmptyState({
  icon = 'seedling',
  title,
  body,
  action,
}: {
  icon?: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft text-balance-pretty">{body}</p>
      {action}
    </div>
  )
}
