import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { SubjectBadge, PriorityBadge } from '@/components/ui/Badge'
import { useAppStore, useTasks, useSubjects } from '@/store/useAppStore'
import { KANBAN_COLS, Priority, KanbanColumn } from '@/constants/data'
import { formatDate, cn } from '@/utils'

interface TaskForm { title: string; subjectId: string; priority: Priority; due: string; col: KanbanColumn }

export function TasksPage() {
  const tasks = useTasks()
  const subjects = useSubjects()
  const { addTask, moveTask, toggleTask, deleteTask } = useAppStore(s => ({
    addTask: s.addTask, moveTask: s.moveTask, toggleTask: s.toggleTask, deleteTask: s.deleteTask,
  }))

  const defaultForm: TaskForm = {
    title: '', subjectId: subjects[0]?.id ?? '', priority: 'medium', due: '', col: 'todo'
  }

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<TaskForm>(defaultForm)
  const [error, setError] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const set = useCallback((k: keyof TaskForm, v: string) => setForm(p => ({ ...p, [k]: v })), [])

  const submit = () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.subjectId)    { setError('Subject is required'); return }
    addTask({ ...form, done: form.col === 'done' })
    setForm(defaultForm); setError(''); setModal(false)
  }

  return (
    <PageShell>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-[22px]">Tasks</h1>
          <p className="text-os-text2 text-[13px] mt-1">Drag cards between columns to update status</p>
        </div>
        <Button variant="primary" onClick={() => setModal(true)}>+ New Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {KANBAN_COLS.map(col => {
          const colTasks = tasks.filter(t => t.col === col.id)
          const isOver = overCol === col.id
          return (
            <div
              key={col.id}
              className={cn(
                'rounded-xl border p-3 min-h-[360px] transition-all duration-150',
                isOver ? 'border-[var(--accent)] bg-[var(--accent)]/4' : 'border-os-border bg-os-bg2'
              )}
              onDragOver={e => { e.preventDefault(); setOverCol(col.id) }}
              onDragLeave={() => setOverCol(null)}
              onDrop={e => {
                e.preventDefault(); setOverCol(null)
                if (dragId) { moveTask(dragId, col.id); setDragId(null) }
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-[2px]" style={{ background: col.color }} aria-hidden />
                <span className="font-display font-semibold text-[13px]">{col.label}</span>
                <span className="ml-auto text-[11px] text-os-text3 bg-os-bg4 rounded-full px-2 py-0.5 font-display">
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0 && (
                <div className="text-center text-os-text3 text-[12px] py-8">Drop tasks here</div>
              )}

              <AnimatePresence>
                {colTasks.map(task => (
                  <motion.div
                    key={task.id} layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: dragId === task.id ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    draggable
                    onDragStart={() => setDragId(task.id)}
                    onDragEnd={() => setDragId(null)}
                    className="bg-os-bg3 border border-os-border rounded-[8px] p-3 mb-2 cursor-grab hover:border-os-border2 hover:shadow-card transition-all select-none"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox" checked={task.done}
                        onChange={() => toggleTask(task.id)}
                        className="mt-0.5 accent-[#7C3AED] shrink-0"
                        aria-label={`Mark "${task.title}" ${task.done ? 'incomplete' : 'complete'}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-[13px] font-medium', task.done && 'line-through text-os-text3')}>
                          {task.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                          <SubjectBadge subjectId={task.subjectId} />
                          <PriorityBadge priority={task.priority} />
                          {task.due && (
                            <span className="text-[11px] text-os-text3">📅 {formatDate(task.due)}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-os-text3 hover:text-red-400 text-sm leading-none p-1 transition-colors shrink-0"
                        aria-label={`Delete: ${task.title}`}
                      >×</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Create Task">
        {error && (
          <p className="text-[12px] text-red-400 mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">{error}</p>
        )}
        <FormGroup label="Title *" htmlFor="task-title">
          <Input id="task-title" placeholder="e.g. Read Chapter 7" value={form.title}
            onChange={e => set('title', e.target.value)} autoFocus />
        </FormGroup>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Subject" htmlFor="task-subject">
            <Select id="task-subject" value={form.subjectId} onChange={e => set('subjectId', e.target.value)}>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Priority" htmlFor="task-priority">
            <Select id="task-priority" value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </FormGroup>
          <FormGroup label="Due Date" htmlFor="task-due">
            <Input id="task-due" type="date" value={form.due} onChange={e => set('due', e.target.value)} />
          </FormGroup>
          <FormGroup label="Column" htmlFor="task-col">
            <Select id="task-col" value={form.col} onChange={e => set('col', e.target.value)}>
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </Select>
          </FormGroup>
        </div>
        <ModalActions>
          <Button onClick={() => { setModal(false); setError('') }}>Cancel</Button>
          <Button variant="primary" onClick={submit}>Create Task</Button>
        </ModalActions>
      </Modal>
    </PageShell>
  )
}
