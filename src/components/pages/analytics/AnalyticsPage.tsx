import { useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTasks, useHabits, useSubjects, useAppStore } from '@/store/useAppStore'

function BarChart({ data }: { data: { day: string; h: number }[] }) {
  const max = Math.max(...data.map(d => d.h), 1)
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex-1 w-full flex items-end">
            <motion.div initial={{ height: 0 }} animate={{ height: `${(d.h / max) * 90}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="w-full rounded-t-sm" style={{
                minHeight: 4,
                background: `rgba(124,58,237,${0.3 + (i / data.length) * 0.6})`,
              }} />
          </div>
          <span className="text-[9px] text-os-text3 font-display">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, desc, onAction, action }: {
  icon: string; title: string; desc: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-display font-semibold text-[14px] mb-1">{title}</div>
      <p className="text-[12px] text-os-text3 mb-3">{desc}</p>
      {action && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>{action}</Button>
      )}
    </div>
  )
}

export function AnalyticsPage() {
  const tasks = useTasks()
  const habits = useHabits()
  const subjects = useSubjects()
  const setActivePage = useAppStore(s => s.setActivePage)

  const hasAnyData = tasks.length > 0 || habits.length > 0

  const totalDays = habits.reduce((a, h) => a + h.log.filter(Boolean).length, 0)
  const totalPossible = habits.length * 14

  const subjectBreakdown = useMemo(() =>
    subjects.map(sub => {
      const subTasks = tasks.filter(t => t.subjectId === sub.id)
      return { ...sub, done: subTasks.filter(t => t.done).length, total: subTasks.length }
    }).filter(s => s.total > 0),
    [subjects, tasks]
  )

  if (!hasAnyData) {
    return (
      <PageShell>
        <h1 className="font-display font-black text-[22px] mb-6">Analytics</h1>
        <Card>
          <EmptyState
            icon="▲"
            title="No data yet"
            desc="Start adding tasks and habits to see your analytics here"
            action="Add Tasks"
            onAction={() => setActivePage('tasks')}
          />
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <h1 className="font-display font-black text-[22px] mb-6">Analytics</h1>

      {/* Real stats only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            val: tasks.length > 0 ? `${tasks.filter(t=>t.done).length}/${tasks.length}` : '—',
            label: 'Tasks Done', sub: 'total',
            color: '#A78BFA',
          },
          {
            val: habits.length > 0 && totalPossible > 0
              ? `${Math.round(totalDays/totalPossible*100)}%` : '—',
            label: 'Habit Rate', sub: 'last 14 days',
            color: '#FCD34D',
          },
          {
            val: subjects.length > 0 ? subjects.length : '—',
            label: 'Subjects', sub: 'being tracked',
            color: '#67E8F9',
          },
          {
            val: habits.length > 0 ? Math.max(...habits.map(h=>h.streak)) : '—',
            label: 'Best Streak', sub: 'days in a row',
            color: '#6EE7B7',
          },
        ].map((s, i) => (
          <Card key={i} className="text-center">
            <div className="font-display font-black text-[26px]" style={{ color: s.color }}>{s.val}</div>
            <div className="text-[13px] text-os-text mt-0.5">{s.label}</div>
            <div className="text-[11px] text-os-text3 mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Tasks by subject */}
        <Card>
          <CardHeader><CardTitle>Tasks by Subject</CardTitle></CardHeader>
          {subjectBreakdown.length === 0 ? (
            <EmptyState icon="📊" title="No subject data" desc="Assign subjects to tasks to see this chart" />
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

        {/* Habit activity */}
        <Card>
          <CardHeader><CardTitle>Habit Activity</CardTitle></CardHeader>
          {habits.length === 0 ? (
            <EmptyState icon="◈" title="No habits yet" desc="Add habits to track your daily consistency"
              action="Add Habit" onAction={() => setActivePage('habits')} />
          ) : (
            <div className="flex flex-col gap-4">
              {habits.slice(0, 4).map(h => (
                <div key={h.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px]">{h.name}</span>
                    <span className="text-[12px] text-amber-300 font-display font-bold">{h.streak}🔥</span>
                  </div>
                  <div className="flex gap-0.5">
                    {h.log.map((v, i) => (
                      <div key={i} className="flex-1 h-3 rounded-[2px]"
                        style={{
                          background: v ? `rgba(124,58,237,${0.3+(i/28)*0.7})` : '#1A1A26',
                        }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Task completion overall */}
        {tasks.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Task Overview</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { val: tasks.filter(t=>t.col==='todo').length, label: 'To Do', color: '#7C3AED' },
                { val: tasks.filter(t=>t.col==='inprogress').length, label: 'In Progress', color: '#F59E0B' },
                { val: tasks.filter(t=>t.col==='done').length, label: 'Done', color: '#10B981' },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-os-bg4 border border-os-border">
                  <div className="font-display font-black text-[28px]" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[13px] text-os-text2 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
