import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Input, FormGroup } from '@/components/ui/Input'
import { useAppStore, useHabits } from '@/store/useAppStore'
import toast from 'react-hot-toast'

// Get last 7 days labels
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday: i === 6,
      index: 7 + i, // maps to log array (last 14 days, we show last 7)
    }
  })
}

const WEEK_DAYS = getLast7Days()
const TODAY_INDEX = 13 // last element in 14-day log = today

export function HabitsPage() {
  const habits = useHabits()
  const { addHabit, deleteHabit, toggleHabitDay } = useAppStore(s => ({
    addHabit: s.addHabit, deleteHabit: s.deleteHabit, toggleHabitDay: s.toggleHabitDay,
  }))
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [view, setView] = useState<'today' | 'week'>('today')

  const totalDone = habits.filter(h => h.log[TODAY_INDEX]).length
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
          <p className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>+ New Habit</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { val: habits.length, label: 'Total Habits', color: '#A78BFA' },
          { val: `${totalDone}/${habits.length}`, label: 'Done Today', color: '#6EE7B7' },
          { val: `${topStreak}d 🔥`, label: 'Best Streak', color: '#FCD34D' },
        ].map((s, i) => (
          <Card key={i} className="text-center py-3">
            <div className="font-display font-black text-[22px]" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--text2)' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('today')}
          className="px-4 py-2 rounded-lg text-[13px] font-display font-semibold transition-all border"
          style={{
            background: view === 'today' ? 'rgba(124,58,237,0.12)' : 'var(--bg3)',
            borderColor: view === 'today' ? 'rgba(124,58,237,0.3)' : 'var(--border)',
            color: view === 'today' ? '#A78BFA' : 'var(--text2)',
          }}>
          📅 Today
        </button>
        <button
          onClick={() => setView('week')}
          className="px-4 py-2 rounded-lg text-[13px] font-display font-semibold transition-all border"
          style={{
            background: view === 'week' ? 'rgba(124,58,237,0.12)' : 'var(--bg3)',
            borderColor: view === 'week' ? 'rgba(124,58,237,0.3)' : 'var(--border)',
            color: view === 'week' ? '#A78BFA' : 'var(--text2)',
          }}>
          📊 Weekly Analysis
        </button>
      </div>

      {/* TODAY VIEW */}
      <AnimatePresence mode="wait">
        {view === 'today' && (
          <motion.div key="today" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-4xl mb-3">◈</div>
                  <div className="font-display font-semibold text-[14px] mb-1" style={{ color: 'var(--text)' }}>No habits yet</div>
                  <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>Add your first habit to start building consistency</p>
                  <Button variant="outline" size="sm" onClick={() => setModal(true)}>+ Add First Habit</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="text-[11px] font-display font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>
                    Mark today&apos;s habits
                  </div>
                  <AnimatePresence>
                    {habits.map((h, i) => {
                      const doneToday = !!h.log[TODAY_INDEX]
                      return (
                        <motion.div key={h.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                          style={{
                            background: doneToday ? 'rgba(16,185,129,0.06)' : 'var(--bg4)',
                            borderColor: doneToday ? 'rgba(16,185,129,0.25)' : 'var(--border)',
                          }}>

                          {/* Checkbox */}
                          <button
                            onClick={() => toggleHabitDay(h.id, TODAY_INDEX)}
                            className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{
                              borderColor: doneToday ? '#10B981' : 'var(--border2)',
                              background: doneToday ? '#10B981' : 'transparent',
                            }}
                            aria-label={`Mark ${h.name} ${doneToday ? 'undone' : 'done'}`}>
                            {doneToday && <span className="text-white text-[14px]">✓</span>}
                          </button>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px]"
                              style={{
                                color: doneToday ? '#6EE7B7' : 'var(--text)',
                                textDecoration: doneToday ? 'line-through' : 'none',
                                opacity: doneToday ? 0.7 : 1,
                              }}>
                              {h.name}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                              {h.streak}🔥 streak
                            </div>
                          </div>

                          {/* Delete */}
                          <button onClick={() => { deleteHabit(h.id); toast.success('Habit removed') }}
                            className="text-[18px] leading-none transition-opacity hover:opacity-60 shrink-0"
                            style={{ color: 'var(--text3)' }}>×</button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>

                  {/* Progress bar */}
                  {habits.length > 0 && (
                    <div className="mt-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex justify-between mb-2">
                        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Today&apos;s Progress</span>
                        <span className="text-[12px] font-display font-bold" style={{ color: '#10B981' }}>
                          {totalDone}/{habits.length}
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg5)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${habits.length > 0 ? Math.round((totalDone / habits.length) * 100) : 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(to right,#10B981,#06B6D4)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* WEEKLY ANALYSIS VIEW */}
        {view === 'week' && (
          <motion.div key="week" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              {habits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-[12px]" style={{ color: 'var(--text3)' }}>Add habits first to see weekly analysis</p>
                </div>
              ) : (
                <>
                  {/* Day headers */}
                  <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: '1fr repeat(7, 1fr)' }}>
                    <div />
                    {WEEK_DAYS.map((d, i) => (
                      <div key={i} className="text-center">
                        <div className="text-[10px] font-display font-semibold"
                          style={{ color: d.isToday ? '#A78BFA' : 'var(--text3)' }}>
                          {d.label}
                        </div>
                        <div className="text-[9px]" style={{ color: 'var(--text3)' }}>{d.date}</div>
                        {d.isToday && (
                          <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: '#7C3AED' }} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="h-px mb-3" style={{ background: 'var(--border)' }} />

                  {/* Habit rows */}
                  <div className="flex flex-col gap-3">
                    {habits.map((h, hi) => (
                      <motion.div key={h.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: hi * 0.05 }}
                        className="grid gap-2 items-center"
                        style={{ gridTemplateColumns: '1fr repeat(7, 1fr)' }}>

                        {/* Habit name */}
                        <div className="min-w-0 pr-2">
                          <div className="text-[12px] font-medium truncate" style={{ color: 'var(--text)' }}>
                            {h.name}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {h.streak}🔥
                          </div>
                        </div>

                        {/* Day cells */}
                        {WEEK_DAYS.map((d, di) => {
                          const done = !!h.log[d.index]
                          return (
                            <button key={di}
                              onClick={() => toggleHabitDay(h.id, d.index)}
                              className="aspect-square rounded-lg border transition-all mx-auto w-full max-w-[32px]"
                              style={{
                                background: done ? `rgba(124,58,237,${0.3 + di * 0.1})` : 'var(--bg4)',
                                borderColor: done ? 'rgba(124,58,237,0.4)' : 'var(--border)',
                              }}
                              title={`${d.label}: ${done ? '✓ Done' : '✗ Missed'}`}>
                              {done && <span className="text-white text-[10px]">✓</span>}
                            </button>
                          )
                        })}
                      </motion.div>
                    ))}
                  </div>

                  {/* Weekly summary */}
                  <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-3 text-center" style={{ borderColor: 'var(--border)' }}>
                    {(() => {
                      const weekDone = habits.reduce((acc, h) =>
                        acc + WEEK_DAYS.filter(d => h.log[d.index]).length, 0)
                      const weekTotal = habits.length * 7
                      const rate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0
                      const bestHabit = habits.reduce((best, h) => {
                        const score = WEEK_DAYS.filter(d => h.log[d.index]).length
                        return score > (best?.score ?? -1) ? { name: h.name, score } : best
                      }, null as { name: string; score: number } | null)

                      return (
                        <>
                          <div>
                            <div className="font-display font-black text-[20px]" style={{ color: '#A78BFA' }}>{rate}%</div>
                            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Weekly Rate</div>
                          </div>
                          <div>
                            <div className="font-display font-black text-[20px]" style={{ color: '#6EE7B7' }}>{weekDone}</div>
                            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Completions</div>
                          </div>
                          <div>
                            <div className="font-display font-bold text-[12px] truncate" style={{ color: '#FCD34D' }}>
                              {bestHabit?.name ?? '—'}
                            </div>
                            <div className="text-[11px]" style={{ color: 'var(--text3)' }}>Best Habit</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Habit Modal */}
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
