'use client'
import { ReactNode, useEffect, useRef, KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement
    const el = ref.current?.querySelector<HTMLElement>('button,input,select,textarea,[tabindex]:not([tabindex="-1"])')
    el?.focus()
    return () => { prev?.focus() }
  }, [open])

  useEffect(() => {
    const handler = (e: Event) => { if ((e as globalThis.KeyboardEvent).key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          role="dialog" aria-modal aria-labelledby="modal-title"
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'w-full rounded-2xl border border-os-border2 bg-os-bg3 p-7 shadow-modal',
              sizes[size]
            )}
          >
            <h2 id="modal-title" className="font-display text-[17px] font-bold text-os-text mb-5">
              {title}
            </h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ModalActions({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex gap-2 justify-end mt-5', className)}>{children}</div>
}
