import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils'

const baseInput = 'w-full rounded-[8px] border border-os-border bg-os-bg4 px-3 py-2 text-[13px] text-os-text placeholder:text-os-text3 transition-colors focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseInput, className)} {...props} />
  )
)
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseInput, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseInput, 'resize-vertical min-h-[120px] leading-relaxed', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export function FormGroup({ label, htmlFor, error, children }: {
  label: string; htmlFor?: string; error?: string; children: ReactNode
}) {
  return (
    <div className="mb-3">
      <label htmlFor={htmlFor} className="block text-[12px] text-os-text2 font-display font-medium mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

import { ReactNode } from 'react'
