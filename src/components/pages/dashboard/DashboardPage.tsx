// DashboardPage.tsx — Real data only, no fake stats, beautiful empty states
import { useMemo, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { SubjectBadge, PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useTasks, useHabits, useAppStore, useSubjects } from '@/store/useAppStore'
import { formatDate } from '@/utils'

function EmptyCard({ icon, title, desc, action, onAction }: {
  icon: string; title: string; desc: string; action?: string; onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-3xl mb-3" aria-hidden>{icon}</div>
      <div className="font-display font-semibold text-[14px] text-os-text mb-1">{title}</div>
      <p className="text-[12px] text-os-text3 mb-3">{desc}</p>
      {action && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>{action}</Button>
      )}
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
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, a, a + sl)
      ctx.closePath()
      ctx.fillStyle = d.color; ctx.globalAlpha = 0.88; ctx.fill()
      a += sl
    })
    ctx.globalAlpha = 1
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.56, 0, 2 * Math.PI)
    ctx.fillStyle = '#14141E'; ctx.fill()
  }, [data])
  return <canvas ref={ref} width={90} height={90} />
}

export function DashboardPage() {
  const tasks = useTasks()
  const habits = useHabits()
  const subjects = useSubjects()
  const profile = useAppStore(s => s.profile)
  const setActivePage = useAppStore(s => s.setActivePage)

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done).length
    const total = tasks.length
    const pending = tasks.filter(t => !t.done).slice(0, 4)
    const topStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0
    // Real completion rate
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0
    return { done, total, pending, topStreak, completionRate }
  }, [tasks, habits])

  // Donut from real tasks per subject
  const donutData = useMemo(() => {
    const total = tasks.length || 1
    return subjects
      .map(sub => ({
        name: sub.name,
        pct: Math.round((tasks.filter(t => t.subjectId === sub.id).length / total) * 100),
        color: sub.color,
      }))
      .filter(d => d.pct > 0)
  }, [subjects, tasks])

  const isNewUser = tasks.length === 0 && habits.length === 0 && subjects.length === 0

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6">
        <div className="text-[11px] text-os-text3 font-display tracking-widest uppercase mb-1">{dateStr}</div>
        <h1 className="font-display font-black text-[26px]">
          {greeting}{profile.name ? `, ${profile.name}` : ''} {hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'}
        </h1>
        {isNewUser ? (
          <p className="text-os-text2 text-[13px] mt-1">Welcome to StudyOS! Let's set up your workspace.</p>
        ) : (
          <p className="text-os-text2 text-[13px] mt-1">
            {stats.pending.length > 0
              ? <>You have <strong className="text-[#A78BFA]">{stats.pending.length} tasks</strong> pending. Let&apos;s make today count.</>
              : '🎉 All tasks done! Great work today.'
            }
          </p>
        )}
      </div>

      {/* New user welcome */}
      {isNewUser && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-5 rounded-xl border border-violet-500/25 bg-violet-500/6"
        >
          <div className="font-display font-bold text-[16px] mb-2 text-[#A78BFA]">🚀 Get Started</div>
          <p className="text-[13px] text-os-text2 mb-4">Set up your workspace in 3 quick steps:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Add Subjects', desc: 'Go to Settings → Manage Subjects', action: () => setActivePage('settings') },
              { step: '2', title: 'Create a Task', desc: 'Add your first task to the board', action: () => setActivePage('tasks') },
              { step: '3', title: 'Chat with AI', desc: 'Get your personalized study plan', action: () => setActivePage('ai') },
            ].map(s => (
              <button key={s.step} onClick={s.action}
                className="text-left p-3 rounded-lg bg-os-bg3 border border-os-border hover:border-[var(--accent)] transition-all">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[11px] font-bold flex items-center justify-center mb-2">{s.step}</div>
                <div className="font-display font-semibold text-[13px]">{s.title}</div>
                <div className="text-[11px] text-os-text3 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats — only show real numbers */}
      {!isNewUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            {
              val: tasks.length > 0 ? `${stats.done}/${stats.total}` : '—',
              label: 'Tasks Done',
              sub: tasks.length > 0 ? `${stats.completionRate}% completion` : 'No tasks yet',
              color: '#67E8F9',
            },
            {
              val: habits.length > 0 ? `${stats.topStreak}d 🔥` : '—',
              label: 'Top Streak',
              sub: habits.length > 0 ? 'best habit streak' : 'No habits yet',
              color: '#FCD34D',
            },
            {
              val: subjects.length > 0 ? subjects.length : '—',
              label: 'Subjects',
              sub: subjects.length > 0 ? 'being tracked' : 'Add in settings',
              color: '#A78BFA',
            },
            {
              val: tasks.filter(t => !t.done && t.due).length > 0
                ? tasks.filter(t => !t.done && t.due).length
                : '—',
              label: 'Due Soon',
              sub: 'upcoming tasks',
              color: '#FCA5A5',
            },
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            {tasks.length > 0 && (
              <Button variant="ghost" size="xs" onClick={() => setActivePage('tasks')}>View all →</Button>
            )}
          </CardHeader>
          {stats.pending.length === 0 ? (
            <EmptyCard
              icon="✓"
              title="No pending tasks"
              desc={tasks.length === 0 ? "Add your first task to get started" : "You're all caught up! 🎉"}
              action={tasks.length === 0 ? "+ Add Task" : undefined}
              onAction={() => setActivePage('tasks')}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {stats.pending.map(t => (
                <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-[8px] bg-os-bg4 border border-os-border">
                  <PriorityBadge priority={t.priority} className="shrink-0" />
                  <span className="flex-1 text-[13px] truncate">{t.title}</span>
                  <SubjectBadge subjectId={t.subjectId} />
                  {t.due && <span className="text-[11px] text-os-text3 shrink-0">{formatDate(t.due)}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Habit Streaks */}
        <Card>
          <CardHeader>
            <CardTitle>Habit Streaks</CardTitle>
            {habits.length > 0 && (
              <Button variant="ghost" size="xs" onClick={() => setActivePage('habits')}>View all →</Button>
            )}
          </CardHeader>
          {habits.length === 0 ? (
            <EmptyCard
              icon="◈"
              title="No habits tracked"
              desc="Build daily consistency with habit tracking"
              action="+ Add Habit"
              onAction={() => setActivePage('habits')}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {habits.slice(0, 4).map(h => (
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
          )}
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
          {donutData.length === 0 ? (
            <EmptyCard
              icon="📚"
              title="No subjects yet"
              desc="Add subjects in Settings to track your studies"
              action="Manage Subjects"
              onAction={() => setActivePage('settings')}
            />
          ) : (
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
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '✓', label: 'New Task',      page: 'tasks'     as const },
              { icon: '▦', label: 'New Note',      page: 'notes'     as const },
              { icon: '✦', label: 'Ask AI',        page: 'ai'        as const },
              { icon: '◈', label: 'Track Habit',   page: 'habits'    as const },
              { icon: '◷', label: 'Start Pomodoro',page: 'planner'   as const },
              { icon: '▲', label: 'Analytics',     page: 'analytics' as const },
            ].map(a => (
              <button key={a.label} onClick={() => setActivePage(a.page)}
                className="flex items-center gap-2.5 p-3 rounded-lg bg-os-bg4 border border-os-border hover:border-[var(--accent)] hover:bg-[var(--accent)]/6 transition-all text-left">
                <span className="text-base" aria-hidden>{a.icon}</span>
                <span className="text-[13px] font-display font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
