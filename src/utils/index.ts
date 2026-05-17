import { clsx, type ClassValue } from 'clsx'

export const cn = (...inputs: ClassValue[]) => clsx(inputs)

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return ''
  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return dateStr.slice(5) }
}

export const stripMarkdown = (md: string, max = 60): string => {
  const stripped = md.replace(/[#*`>_~\[\]\(\)]/g, '').replace(/\n+/g, ' ').trim()
  return stripped.length > max ? `${stripped.slice(0, max)}…` : stripped
}

export const calcStreak = (log: number[]): number => {
  const rev = [...log].reverse()
  const miss = rev.findIndex(v => !v)
  return miss === -1 ? log.length : miss
}

export const getLast14Days = (): string[] =>
  Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 13 + i)
    return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
  })

export const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
  let t: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max)
