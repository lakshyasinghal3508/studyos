import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { POMODORO_PRESETS, SCHEDULE } from '@/constants/data'
import { cn } from '@/utils'

const CIRC = 2 * Math.PI * 70

export function PlannerPage() {
  const [preset, setPreset] = useState(POMODORO_PRESETS[0])
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [secs, setSecs] = useState(POMODORO_PRESETS[0].work * 60)
  const [sessions, setSessions] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            if (phase === 'work') { setSessions(n => n + 1); setPhase('rest'); return preset.rest * 60 }
            else { setPhase('work'); return preset.work * 60 }
          }
          return s - 1
        })
      }, 1000)
    } else if (ref.current) clearInterval(ref.current)
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running, phase, preset])

  const changePreset = (p: typeof POMODORO_PRESETS[0]) => {
    if (ref.current) clearInterval(ref.current)
    setRunning(false); setPreset(p); setPhase('work'); setSecs(p.work * 60)
  }

  const reset = () => {
    if (ref.current) clearInterval(ref.current)
    setRunning(false); setPhase('work'); setSecs(preset.work * 60)
  }

  const total = (phase === 'work' ? preset.work : preset.rest) * 60
  const progress = (total - secs) / total
  const offset = CIRC * (1 - progress)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  const color = phase === 'work' ? '#7C3AED' : '#10B981'

  return (
    <PageShell>
      <h1 className="font-display font-black text-[22px] mb-6">Study Planner</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Pomodoro */}
        <Card>
          <CardHeader><CardTitle>Pomodoro Timer</CardTitle></CardHeader>
          <div className="flex gap-2 mb-5" role="group" aria-label="Timer presets">
            {POMODORO_PRESETS.map(p => (
              <button key={p.label} onClick={() => changePreset(p)}
                aria-pressed={preset.label === p.label}
                className={cn(
                  'text-[12px] font-display px-3 py-1.5 rounded-md border transition-all',
                  preset.label === p.label
                    ? 'bg-os-bg4 border-os-border2 text-os-text'
                    : 'border-os-border text-os-text3 hover:text-os-text bg-transparent'
                )}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40" role="timer" aria-label={`${phase}: ${mm}:${ss}`}>
              <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden>
                <circle cx="80" cy="80" r="70" fill="none" stroke="#1A1A26" strokeWidth="6" />
                <circle cx="80" cy="80" r="70" fill="none" stroke={color} strokeWidth="6"
                  strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset .5s ease, stroke .3s', transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-black text-[32px] tracking-tight">{mm}:{ss}</div>
                <div className="text-[11px] font-display font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: phase === 'work' ? '#A78BFA' : '#6EE7B7' }}>
                  {phase === 'work' ? 'Work' : 'Break'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" style={{ minWidth: 88 }} onClick={() => setRunning(r => !r)}>
                {running ? '⏸ Pause' : '▶ Start'}
              </Button>
              <Button onClick={reset}>Reset</Button>
            </div>
            <div className="text-[13px] text-os-text2 text-center">
              Sessions: <strong className="text-[#A78BFA] font-display">{sessions}</strong>{' '}
              <span className="text-os-text3">({(sessions * preset.work / 60).toFixed(1)}h)</span>
            </div>
          </div>
        </Card>

        {/* Exam countdown */}
        <Card>
          <CardHeader><CardTitle>Exam Countdown</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {[
              { name: 'Upcoming Exam 1', days: 11, color: '#7C3AED', pct: 63 },
              { name: 'Upcoming Exam 2', days: 17, color: '#F59E0B', pct: 43 },
              { name: 'Upcoming Exam 3', days: 24, color: '#06B6D4', pct: 20 },
            ].map((e, i) => (
              <div key={i} className="p-3 rounded-[8px] bg-os-bg4 border border-os-border">
                <div className="flex justify-between mb-2">
                  <span className="font-display font-medium text-[13px]">{e.name}</span>
                  <span className="font-display font-black text-[22px]" style={{ color: e.color }}>{e.days}d</span>
                </div>
                <div className="h-1 rounded-full bg-os-bg5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${e.pct}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                    className="h-full rounded-full" style={{ background: e.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Daily Schedule Template</CardTitle></CardHeader>
          <ol className="space-y-0" aria-label="Daily schedule">
            {SCHEDULE.map((s, i) => (
              <li key={i} className="flex gap-3 items-stretch">
                <div className="text-[11px] text-os-text3 font-display w-12 pt-2.5 shrink-0">{s.time}</div>
                <div className="flex flex-col items-center w-4 shrink-0">
                  <div className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-[var(--accent)]" aria-hidden />
                  {i < SCHEDULE.length - 1 && <div className="flex-1 w-px bg-os-border mt-0.5" aria-hidden />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium">{s.task}</span>
                    <span className="ml-auto text-[11px] text-os-text3">{s.dur}</span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </PageShell>
  )
}
