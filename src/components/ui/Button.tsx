import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const v: Record<Variant, string> = {
  primary:   'bg-[var(--accent)] hover:opacity-90 text-white border-transparent shadow-glow-accent/30',
  secondary: 'bg-os-bg4 hover:bg-os-bg5 text-os-text border-os-border2',
  ghost:     'bg-transparent hover:bg-os-bg4 text-os-text2 hover:text-os-text border-transparent',
  danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30',
  outline:   'bg-transparent border-os-border2 text-os-text hover:border-[var(--accent)] hover:text-[var(--accent)]',
}
const s: Record<Size, string> = {
  xs: 'text-xs px-2.5 py-1 gap-1',
  sm: 'text-[13px] px-3 py-1.5 gap-1.5',
  md: 'text-[13px] px-4 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] border font-body font-medium transition-all duration-150 cursor-pointer whitespace-nowrap select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-os-bg',
        v[variant], s[size], className
      )}
      {...props}
    >
      {loading ? <span className="animate-spin text-sm" aria-hidden>⏳</span> : icon}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
