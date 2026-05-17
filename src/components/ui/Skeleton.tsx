import { cn } from '@/utils'

interface Props { className?: string; width?: string; height?: string; rounded?: boolean }

export function Skeleton({ className, width, height, rounded }: Props) {
  return (
    <div
      className={cn('skeleton', rounded ? 'rounded-full' : 'rounded-lg', className)}
      style={{ width, height }}
      aria-hidden
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-os-border bg-os-bg3 p-5" aria-busy aria-label="Loading...">
      <Skeleton height="14px" width="55%" className="mb-3" />
      <Skeleton height="11px" width="35%" className="mb-4" />
      <Skeleton height="72px" />
    </div>
  )
}

export function ChatMsgSkeleton() {
  return (
    <div className="flex gap-3" aria-busy>
      <Skeleton width="32px" height="32px" rounded />
      <div className="flex-1">
        <Skeleton height="13px" width="70%" className="mb-2" />
        <Skeleton height="13px" width="50%" />
      </div>
    </div>
  )
}
