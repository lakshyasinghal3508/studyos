// Badge.tsx — dynamic subject badges (no hardcoded Subject type)
import { cn } from '@/utils'
import { Subject, Priority, PRIORITY_CONFIG } from '@/constants/data'
import { useSubjectById } from '@/store/useAppStore'

interface SubjectBadgeProps {
  subjectId: string
  className?: string
}
interface PriorityBadgeProps { priority: Priority; className?: string }

export function SubjectBadge({ subjectId, className }: SubjectBadgeProps) {
  const subject = useSubjectById(subjectId)
  if (!subject) return null
  // Generate bg from color with opacity
  const bg = subject.color + '26' // ~15% opacity hex
  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-display font-semibold tracking-wide', className)}
      style={{ background: bg, color: subject.color }}
    >
      {subject.icon} {subject.name}
    </span>
  )
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const c = PRIORITY_CONFIG[priority]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', className)} style={{ color: c.color }}>
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  )
}
