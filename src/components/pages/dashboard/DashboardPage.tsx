import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SubjectBadge, PriorityBadge } from '@/components/ui/Badge'
import { useTasks, useHabits, useAppStore, useSubjects } from '@/store/useAppStore'
import { STUDY_DATA } from '@/constants/data'
import { formatDate } from '@/utils'

function BarChart({ data }: { data: { day: string; h: number }[] }) {
  const max = Math.max(...data.map(d => d.h), 1)
  return (
    <div className="flex items-end gap-1.5 h-[100px]">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex-1 w-full flex items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.h / max) * 90}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              className="w-full rounded-t-[3px]"
              style={{
                background: i === data.length - 1 ? 'linear-gradient(to top,#7C3AED,#06B6D4)' : `rgba(124,58,237,${0.2 + (i / data.length) * 0.5})`,
                minHeight: 4,
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
    const size = 90, cx = size / 2, cy = size / 2, r = size * 0.4
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
  return <canvas ref={ref} width={90} height={90} aria-label="Subject distribution" />
}

export function DashboardPage() {
  const tasks = useTasks()
  const habits = useHabits()
  const subjects = useSubjects()
  const profile = useAppStore(s => s.profile)

  const stats = useMemo(() => ({
    done: tasks.filter(t => t.done).length,
    total: tasks.length,
    topStreak: habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0,
    pending: tasks.filter(t => !t.done).slice(0, 4),
  }), [tasks, habits])

  // Dynamic donut from subjects + tasks
  const donutData = useMemo(() => {
    const total = tasks.length || 1
    return subjects.map(sub => ({
      name: sub.name,
      pct: Math.round((tasks.filter(t => t.subjectId === sub.id).length / total) * 100),
      color: sub.color,
    })).filter(d => d.pct > 0)
  }, [subjects, tasks])

  return (
    <PageShell>
      <div className="mb-6">
        <div className="text-[11px] text-os-text3 font-display tracking-widest uppercase mb-1">
          Sunday, May 17, 2026
        </div>
        <h1 className="font-display font-black text-[26px]">
          Good morning, {profile.name.split(' ')[0]} ☀️
        </h1>
        <p className="text-os-text2 text-[13px] mt-1">
          You have <strong className="text-[#A78BFA]">{stats.pending.length} tasks</strong> pending. Let&apos;s make today count.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { val: `${stats.done}/${stats.total}`, label: 'Tasks Done',  sub: 'this week', color: '#67E8F9' },
          { val: '31.5h',                        label: 'Study Hours', sub: 'this week', color: '#A78BFA' },
          { val: `${stats.topStreak}d 🔥`,       label: 'Top Streak',  sub: 'habit',     color: '#FCD34D' },
          { val: '87%',                          label: 'Focus Score', sub: '+5% week',  color: '#6EE7B7' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="text-center relative overflow-hidden">
              <div className="font-display font-black text-[26px]" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[13px] text-os-text mt-0.5">{s.label}</div>
              <div className="text-[11px] text-os-text3 mt-0.5">{s.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle>Study Time</CardTitle>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-display font-semibold" style={{ background: 'rgba(6,182,212,0.12)', color: '#67E8F9' }}>This Week</span>
          </CardHeader>
          <BarChart data={STUDY_DATA} />
        </Card>

        <Card>
          <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
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

        <Card>
          <CardHeader><CardTitle>Upcoming Tasks</CardTitle></CardHeader>
          <div className="flex flex-col gap-2">
            {stats.pending.length === 0 ? (
              <div className="text-center text-os-text3 text-[13px] py-6">🎉 All caught up!</div>
            ) : stats.pending.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-[8px] bg-os-bg4 border border-os-border">
                <PriorityBadge priority={t.priority} className="shrink-0" />
                <span className="flex-1 text-[13px] truncate">{t.title}</span>
                <SubjectBadge subjectId={t.subjectId} />
                <span className="text-[11px] text-os-text3 shrink-0">{formatDate(t.due)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Habit Streaks</CardTitle></CardHeader>
          <div className="flex flex-col gap-3">
            {habits.length === 0 ? (
              <p className="text-os-text3 text-[13px] text-center py-4">No habits yet</p>
            ) : habits.slice(0, 4).map(h => (
              <div key={h.id}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[13px]">{h.name}</span>
                  <span className="text-[12px] text-amber-300 font-display font-bold">{h.streak}d 🔥</span>
                </div>
                <div className="h-1 rounded-full bg-os-bg4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((h.streak / h.target) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right,#F59E0B,#7C3AED)' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/4 flex gap-3"
      >
        <div className="text-xl shrink-0 animate-float" aria-hidden>✦</div>
        <div>
          <div className="text-[13px] font-display font-semibold text-[#A78BFA] mb-1">AI Insight</div>
          <p className="text-[13px] text-os-text2 leading-relaxed">
            Based on your schedule, your Algorithms assignment is due soon. You study best in the morning —
            block 9–11 AM tomorrow for focused work. Your reading streak is incredible — keep it going!
          </p>
        </div>
      </motion.div>
    </PageShell>
  )
}
