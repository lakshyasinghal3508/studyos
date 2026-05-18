// AnalyticsPage.tsx — Daily analytics from real user data
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTasks, useHabits, useSubjects, useDailyLogs, useAppStore } from '@/store/useAppStore'

function EmptyState({ icon, title, desc, action, onAction }: { icon: string; title: string; desc: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-display font-semibold text-[14px] mb-1">{title}</div>
      <p className="text-[12px] text-os-text3 mb-3">{desc}</p>
      {action && onAction && <Button variant="outline" size="sm" onClick={onAction}>{action}</Button>}
    </div>
  )
}

// Activity heatmap — last 14 days
function ActivityHeatmap({ logs }: { logs: { date: string; studyMinutes: number; tasksCompleted: number }[] }) {
  const days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 13 + i)
      const dateStr = d.toISOString().slice(0, 10)
      const log = logs.find(l => l.date === dateStr)
      return { date: dateStr, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1), minutes: log?.studyMinutes ?? 0, tasks: log?.tasksCompleted ?? 0 }
    })
  }, [logs])

  const maxMinutes = Math.max(...days.map(d => d.minutes), 1)

  return (
    <div>
      <div className="flex gap-1 mb-1">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-8 rounded-[4px] border transition-all cursor-default"
              title={`${d.date}: ${Math.round(d.minutes / 60 * 10) / 10}h study, ${d.tasks} tasks`}
              style={{
                background: d.minutes > 0 ? `rgba(124,58,237,${0.2 + (d.minutes / maxMinutes) * 0.8})` : '#1A1A26',
                borderColor: d.minutes > 0 ? 'rgba(124,58,237,0.3)' : '#252535',
              }} />
            <span className="text-[9px] text-os-text3 font-display">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-os-text3 mt-1">
        <span>14 days ago</span><span>Today</span>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const tasks = useTasks()
  const habits = useHabits()
  const subjects = useSubjects()
  const dailyLogs = useDailyLogs()
  const setActivePage = useAppStore(s => s.setActivePage)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = dailyLogs.find(l => l.date === today)

  const hasAnyData = tasks.length > 0 || habits.length > 0 || dailyLogs.length > 0

  // Today's stats from real data
  const todayTasks = tasks.filter(t => t.done).length
  const todayHabits = habits.reduce((a, h) => a + (h.log[13] ? 1 : 0), 0)
  const studyHours = todayLog ? Math.round(todayLog.studyMinutes / 60 * 10) / 10 : 0
  const focusSessions = todayLog?.focusSessions ?? 0

  // Weekly totals
  const weeklyMinutes = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6)
    return dailyLogs.filter(l => new Date(l.date) >= weekAgo).reduce((a, l) => a + l.studyMinutes, 0)
  }, [dailyLogs])

  // Subject breakdown from real tasks
  const subjectBreakdown = useMemo(() =>
    subjects.map(sub => {
      const subTasks = tasks.filter(t => t.subjectId === sub.id)
      return { ...sub, done: subTasks.filter(t => t.done).length, total: subTasks.length }
    }).filter(s => s.total > 0),
    [subjects, tasks]
  )

  // Productivity score — based on real activity
  const productivityScore = useMemo(() => {
    if (!hasAnyData) return 0
    let score = 0
    if (todayTasks > 0) score += Math.min(todayTasks * 15, 40)
    if (todayHabits > 0) score += Math.min(todayHabits * 10, 30)
    if (focusSessions > 0) score += Math.min(focusSessions * 10, 30)
    return Math.min(score, 100)
  }, [todayTasks, todayHabits, focusSessions, hasAnyData])

  if (!hasAnyData) {
    return (
      <PageShell>
        <h1 className="font-display font-black text-[22px] mb-6">Analytics</h1>
        <Card>
          <EmptyState icon="▲" title="No data yet"
            desc="Complete tasks, track habits, and use the Pomodoro timer to see your analytics"
            action="Start Tracking" onAction={() => setActivePage('tasks')} />
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-[22px]">Analytics</h1>
        <span className="text-[12px] text-os-text3 bg-os-bg3 px-3 py-1.5 rounded-lg border border-os-border">
          📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Today's stats — real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { val: studyHours > 0 ? `${studyHours}h` : '—', label: 'Study Today', sub: 'via Pomodoro', color: '#67E8F9' },
          { val: todayTasks > 0 ? todayTasks : '—', label: 'Tasks Done', sub: 'today', color: '#A78BFA' },
          { val: todayHabits > 0 ? `${todayHabits}/${habits.length}` : '—', label: 'Habits Done', sub: 'today', color: '#FCD34D' },
          { val: productivityScore > 0 ? `${productivityScore}%` : '—', label: 'Score', sub: 'today', color: '#6EE7B7' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="text-center">
              <div className="font-display font-black text-[26px]" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[13px] text-os-text mt-0.5">{s.label}</div>
              <div className="text-[11px] text-os-text3 mt-0.5">{s.sub}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Activity heatmap */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Study Activity (Last 14 Days)</CardTitle>
            <span className="text-[12px] text-os-text3">{weeklyMinutes > 0 ? `${Math.round(weeklyMinutes / 60 * 10) / 10}h this week` : 'No study tracked'}</span>
          </CardHeader>
          {dailyLogs.length === 0 ? (
            <EmptyState icon="📊" title="No study sessions logged" desc="Use the Pomodoro timer to automatically log study time" action="Start Pomodoro" onAction={() => setActivePage('planner')} />
          ) : (
            <ActivityHeatmap logs={dailyLogs} />
          )}
        </Card>

        {/* Tasks by subject */}
        <Card>
          <CardHeader><CardTitle>Tasks by Subject</CardTitle></CardHeader>
          {subjectBreakdown.length === 0 ? (
            <EmptyState icon="📝" title="No tasks with subjects" desc="Assign subjects when creating tasks" />
          ) : (
            <div className="flex flex-col gap-3">
              {subjectBreakdown.map(s => (
                <div key={s.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-display font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: s.color + '26', color: s.color }}>{s.icon} {s.name}</span>
                    <span className="text-[12px] text-os-text2">{s.done}/{s.total}</span>
                  </div>
                  <div className="h-1 rounded-full bg-os-bg4 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((s.done / s.total) * 100)}%` }}
                      transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader><CardTitle>Habit Activity (Last 14 Days)</CardTitle></CardHeader>
          {habits.length === 0 ? (
            <EmptyState icon="◈" title="No habits yet" desc="Add habits to track consistency"
              action="Add Habit" onAction={() => setActivePage('habits')} />
          ) : (
            <div className="flex flex-col gap-4">
              {habits.map(h => (
                <div key={h.id}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px]">{h.name}</span>
                    <span className="text-[12px] text-amber-300 font-display font-bold">{h.streak}🔥</span>
                  </div>
                  <div className="flex gap-0.5">
                    {h.log.map((v, i) => (
                      <div key={i} className="flex-1 h-3 rounded-[2px]"
                        style={{ background: v ? `rgba(124,58,237,${0.3+(i/28)*0.7})` : '#1A1A26' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Task overview */}
        {tasks.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Task Overview</CardTitle></CardHeader>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { val: tasks.filter(t=>t.col==='todo').length, label: 'To Do', color: '#7C3AED' },
                { val: tasks.filter(t=>t.col==='inprogress').length, label: 'In Progress', color: '#F59E0B' },
                { val: tasks.filter(t=>t.col==='done').length, label: 'Completed', color: '#10B981' },
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
