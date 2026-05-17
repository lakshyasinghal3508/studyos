import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = true, glow = false, glass = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-os-border bg-os-bg3 p-5 transition-all duration-200',
        hover && 'hover:border-os-border2 hover:shadow-card-hover',
        glow && 'animate-glow',
        glass && 'glass',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
Card.displayName = 'Card'

export const CardHeader = ({ className, children, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between mb-4', className)} {...p}>{children}</div>
)

export const CardTitle = ({ className, children, ...p }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display font-semibold text-[14px] text-os-text', className)} {...p}>{children}</h3>
)
