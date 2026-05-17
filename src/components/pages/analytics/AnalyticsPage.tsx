import { useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useTasks, useHabits, useSubjects } from '@/store/useAppStore'
import { STUDY_DATA } from '@/constants/data'

function BarChart({ data }: { data: { day: string; h: number }[] }) {
  const max = Math.max(...data.map(d => d.h), 1)
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex-1 w-full flex items-end">
            <motion.div
              initial={{ height: 0 }} animate={{ height: `${(d.h / max) * 90}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="w-full rounded-t-sm" style={{
                minHeight: 4,
                background: i === data.length - 1
                  ? 'linear-gradient(to top,#7C3AED,#06B6D4)'
                  : `rgba(124,58,237,${0.2 + (i / data.length) * 0.5})`,
              }}
            />
          </div>
          <span className="text-[9px] text-os-text3 font-display">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data }: { data: { name: string; pct: number; color: string }[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const size = 110, cx = size / 2, cy = size / 2, r = size * 0.4
    let a = -Math.PI / 2
    ctx.clearRect(0, 0, size, size)
    data.forEach(d => {
      const sl = (d.pct / 100) * 2 * Math.PI
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a + sl)
      ctx.closePath(); ctx.fillStyle = d.color; ctx.globalAlpha = 0.88; ctx.fill(); a += sl
    })
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(cx, cy, r * 0.56, 0, 2 * Math.PI)
    ctx.fillStyle = '#14141E'; ctx.fill()
  }, [data])
  return <canvas ref={ref} width={110} height={110} />
}

export function AnalyticsPage() {
  const tasks = useTasks()
  const habits = useHabits()
  const subjects = useSubjects()

  const totalDays = habits.reduce((a, h) => a + h.log.filter(Boolean).length, 0)
  const totalPossible = habits.length * 14

  // Dynamic subject breakdown from actual tasks
  const subjectBreakdown = useMemo(() => {
    return subjects.map(sub => {
      const subTasks = tasks.filter(t => t.subjectId === sub.id)
      const done = subTasks.filter(t => t.done).length
      return { ...sub, done, total: subTasks.length }
    }).filter(s => s.total > 0)
  }, [subjects, tasks])

  // Dynamic donut data
  const donutData = useMemo(() => {
    const total = subjectBreakdown.reduce((a, s) => a + s.total, 0) || 1
    return subjectBreakdown.map(s => ({
      name: s.name, pct: Math.round((s.total / total) * 100), color: s.color
    }))
  }, [subjectBreakdown])

  return (
    <PageShell>
      <h1 className="font-display font-black text-[22px] mb-6">Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { val: `${tasks.filter(t => t.done).length}/${tasks.length}`, label: 'Tasks Done',   sub: 'total',          color: '#A78BFA' },
          { val: '31.5h',                                               label: 'Study / Week', sub: '↑8% vs prev',    color: '#67E8F9' },
          { val: totalPossible > 0 ? `${Math.round(totalDays / totalPossible * 100)}%` : '—',
            label: 'Habit Rate', sub: 'last 14 days', color: '#FCD34D' },
          { val: '87', label: 'Focus Score', sub: 'productivity', color: '#6EE7B7' },
        ].map((s, i) => (
          <Card key={i} className="text-center">
            <div className="font-display font-black text-[26px]" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[13px] text-os-text mt-0.5">{s.label}</div>
            <div className="text-[11px] text-os-text3 mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle>Weekly Study Hours</CardTitle></CardHeader>
          <BarChart data={STUDY_DATA} />
        </Card>

        <Card>
          <CardHeader><CardTitle>Tasks by Subject</CardTitle></CardHeader>
          {subjectBreakdown.length === 0 ? (
            <p className="text-os-text3 text-[13px]">No tasks yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {subjectBreakdown.map(s => (
                <div key={s.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-display font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: s.color + '26', color: s.color }}>
                      {s.icon} {s.name}
                    </span>
                    <span className="text-[12px] text-os-text2">{s.done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-os-bg4 overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: `${Math.round((s.done / s.total) * 100)}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full" style={{ background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Habit Activity (Last 14 Days)</CardTitle></CardHeader>
          {habits.length === 0 && <p className="text-os-text3 text-[13px]">No habits tracked yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map(h => (
              <div key={h.id}>
                <div className="flex justify-between mb-2">
                  <span className="text-[13px]">{h.name}</span>
                  <span className="text-[12px] text-amber-300 font-display font-bold">{h.streak}🔥</span>
                </div>
                <div className="flex gap-1">
                  {h.log.map((v, i) => (
                    <div key={i} className="flex-1 h-3.5 rounded-[3px] border"
                      style={{
                        background: v ? `rgba(124,58,237,${0.3 + (i / 28) * 0.7})` : '#1A1A26',
                        borderColor: v ? 'rgba(124,58,237,0.35)' : '#252535',
                      }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Subject Distribution</CardTitle></CardHeader>
          {donutData.length > 0 ? (
            <div className="flex items-center gap-5 justify-center">
              <DonutChart data={donutData} />
              <div className="flex flex-col gap-2">
                {donutData.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: s.color }} />
                    <span className="text-[12px] text-os-text2 flex-1">{s.name}</span>
                    <span className="text-[12px] font-display font-bold" style={{ color: s.color }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-os-text3 text-[13px] text-center py-4">Add tasks to see distribution</p>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
