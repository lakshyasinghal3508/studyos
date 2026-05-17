import { useState } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Input, FormGroup } from '@/components/ui/Input'
import { useAppStore, useHabits } from '@/store/useAppStore'
import { getLast14Days } from '@/utils'
import toast from 'react-hot-toast'

const DAYS = getLast14Days()

export function HabitsPage() {
  const habits = useHabits()
  const { addHabit, deleteHabit, toggleHabitDay } = useAppStore(s => ({
    addHabit: s.addHabit, deleteHabit: s.deleteHabit, toggleHabitDay: s.toggleHabitDay,
  }))
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')

  const totalDays = habits.reduce((a, h) => a + h.log.filter(Boolean).length, 0)
  const totalPossible = habits.length * 14
  const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0

  const submit = () => {
    if (!name.trim()) { setErr('Name required'); return }
    addHabit(name.trim())
    setName(''); setErr(''); setModal(false)
    toast.success('Habit added!')
  }

  return (
    <PageShell>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-[22px]">Habit Tracker</h1>
          <p className="text-os-text2 text-[13px] mt-1">Build consistency, one day at a time</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>+ New Habit</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { val: habits.length, label: 'Habits', color: '#A78BFA' },
          { val: `${topStreak}d 🔥`, label: 'Best Streak', color: '#FCD34D' },
          { val: totalPossible > 0 ? `${Math.round((totalDays / totalPossible) * 100)}%` : '—', label: 'Completion', color: '#6EE7B7' },
        ].map((s, i) => (
          <Card key={i} className="text-center">
            <div className="font-display font-black text-[24px]" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[13px] text-os-text mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Habit grid */}
      <Card className="overflow-x-auto">
        {habits.length === 0 && (
          <div className="text-center text-os-text3 text-[13px] py-10">
            No habits yet. Add your first one to start building streaks! 🎯
          </div>
        )}
        {habits.length > 0 && (
          <>
            {/* Day headers */}
            <div className="grid gap-1 mb-2 items-center" style={{ gridTemplateColumns: '180px repeat(14, 1fr)', minWidth: 480 }}>
              <div className="text-[11px] text-os-text3">Habit</div>
              {DAYS.map((d, i) => (
                <div key={i} className="text-center text-[10px] font-display"
                  style={{ color: i === 13 ? '#A78BFA' : '#54527A', fontWeight: i === 13 ? 700 : 400 }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="h-px bg-os-border mb-3" />

            {habits.map((h, hi) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: hi * 0.05 }}
                className="grid gap-1 items-center mb-2.5"
                style={{ gridTemplateColumns: '180px repeat(14, 1fr)', minWidth: 480 }}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  <span className="text-[12px] text-amber-300 font-display shrink-0">{h.streak}🔥</span>
                  <span className="text-[13px] truncate flex-1" title={h.name}>{h.name}</span>
                  <button
                    onClick={() => { deleteHabit(h.id); toast.success('Habit removed') }}
                    className="text-[12px] text-os-text3 hover:text-red-400 shrink-0 transition-colors"
                    aria-label={`Delete habit: ${h.name}`}
                  >×</button>
                </div>
                {h.log.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => toggleHabitDay(h.id, i)}
                    role="checkbox" aria-checked={Boolean(v)}
                    aria-label={`${h.name} day ${i + 1}: ${v ? 'done' : 'missed'}`}
                    className="h-6 rounded-[4px] border transition-all hover:scale-110"
                    style={{
                      background: v ? `rgba(124,58,237,${0.3 + (i / 28) * 0.7})` : '#1A1A26',
                      borderColor: v ? 'rgba(124,58,237,0.4)' : '#252535',
                    }}
                  />
                ))}
              </motion.div>
            ))}
          </>
        )}
      </Card>

      <Modal open={modal} onClose={() => { setModal(false); setErr('') }} title="New Habit" size="sm">
        <FormGroup label="Habit Name *" htmlFor="habit-name" error={err}>
          <Input id="habit-name" placeholder="e.g. Morning study session" value={name}
            onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => { if (e.key === 'Enter') submit() }} />
        </FormGroup>
        <ModalActions>
          <Button onClick={() => { setModal(false); setErr('') }}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Add Habit</Button>
        </ModalActions>
      </Modal>
    </PageShell>
  )
}
