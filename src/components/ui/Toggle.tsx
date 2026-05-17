import { cn } from '@/utils'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[22px] w-[40px] rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-os-bg5 border-os-border2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] left-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all duration-200',
          checked && 'translate-x-[18px]'
        )}
        aria-hidden
      />
    </button>
  )
}
