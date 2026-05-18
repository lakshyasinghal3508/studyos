import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore, useExams, useStudyBlocks } from '@/store/useAppStore'
import { useSubjects } from '@/store/useAppStore'
import { useNotifications } from '@/hooks/useNotifications'
import { POMODORO_PRESETS, SUBJECT_PALETTE } from '@/constants/data'
import { cn } from '@/utils'
import toast from 'react-hot-toast'

const CIRC = 2 * Math.PI * 70

// ─── Exam countdown item ──────────────────────────────────────
function ExamCard({ exam, onEdit, onDelete }: { exam: any; onEdit: () => void; onDelete: () => void }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [days, setDays] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(exam.date).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Exam day!'); setDays(0); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setDays(d)
      setTimeLeft(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`)
    }
    calc()
    const iv = setInterval(calc, 60000)
    return () => clearInterval(iv)
  }, [exam.date])

  const urgency = days <= 3 ? '#EF4444' : days <= 7 ? '#F59E0B' : days <= 14 ? '#06B6D4' : '#10B981'

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-os-bg4 border border-os-border hover:border-os-border2 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[14px] truncate">{exam.name}</div>
          {exam.subject && <div className="text-[11px] text-os-text3 mt-0.5">{exam.subject}</div>}
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="font-display font-black text-[24px]" style={{ color: urgency }}>{timeLeft}</div>
          <div className="text-[10px] text-os-text3">{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>
      {exam.notes && <p className="text-[12px] text-os-text3 mb-2">{exam.notes}</p>}
      <div className="flex gap-2">
        <Button size="xs" variant="ghost" onClick={onEdit}>Edit</Button>
        <Button size="xs" variant="danger" onClick={onDelete}>Delete</Button>
      </div>
    </motion.div>
  )
}

// ─── Study block item ─────────────────────────────────────────
function BlockCard({ block, onEdit, onDelete, subjectName, subjectColor }: { block: any; onEdit: () => void; onDelete: () => void; subjectName: string; subjectColor: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-os-bg4 border border-os-border hover:border-os-border2 transition-all">
      <div className="w-1 h-full min-h-[40px] rounded-full shrink-0" style={{ background: subjectColor || '#7C3AED' }} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13px] truncate">{block.title}</div>
        <div className="text-[11px] text-os-text3 mt-0.5">
          {block.startTime} – {block.endTime}
          {subjectName && <span className="ml-2" style={{ color: subjectColor }}>{subjectName}</span>}
        </div>
        {block.notes && <div className="text-[11px] text-os-text3 truncate mt-0.5">{block.notes}</div>}
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="xs" variant="ghost" onClick={onEdit}>✎</Button>
        <Button size="xs" variant="danger" onClick={onDelete}>×</Button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export function PlannerPage() {
  const exams = useExams()
  const studyBlocks = useStudyBlocks()
  const subjects = useSubjects()
  const { addExam, updateExam, deleteExam, addStudyBlock, updateStudyBlock, deleteStudyBlock, logStudySession } = useAppStore(s => ({
    addExam: s.addExam, updateExam: s.updateExam, deleteExam: s.deleteExam,
    addStudyBlock: s.addStudyBlock, updateStudyBlock: s.updateStudyBlock, deleteStudyBlock: s.deleteStudyBlock,
    logStudySession: s.logStudySession,
  }))
  const { permission, request, notify } = useNotifications()

  // Pomodoro state
  const [preset, setPreset] = useState(POMODORO_PRESETS[0])
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'work' | 'rest'>('work')
  const [secs, setSecs] = useState(POMODORO_PRESETS[0].work * 60)
  const [sessions, setSessions] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Modal state
  const [examModal, setExamModal] = useState(false)
  const [blockModal, setBlockModal] = useState(false)
  const [editExam, setEditExam] = useState<any>(null)
  const [editBlock, setEditBlock] = useState<any>(null)
  const [selectedDay, setSelectedDay] = useState<string>(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }))

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  // Exam form
  const [examForm, setExamForm] = useState({ name: '', date: '', subject: '', notes: '' })
  const [blockForm, setBlockForm] = useState({ title: '', startTime: '09:00', endTime: '10:00', subjectId: '', notes: '', day: selectedDay, color: '#7C3AED' })

  // Pomodoro timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecs(s => {
          if (s <= 1) {
            if (phase === 'work') {
              setSessions(n => { const newN = n + 1; logStudySession(preset.work); return newN })
              notify('Pomodoro Complete! 🎉', `Great work! Time for a ${preset.rest} min break.`)
              setPhase('rest'); return preset.rest * 60
            } else {
              notify('Break Over!', `Back to work for ${preset.work} minutes.`)
              setPhase('work'); return preset.work * 60
            }
          }
          return s - 1
        })
      }, 1000)
    } else if (timerRef.current) clearInterval(timerRef.current)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, phase, preset, notify, logStudySession])

  const changePreset = (p: typeof POMODORO_PRESETS[0]) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false); setPreset(p); setPhase('work'); setSecs(p.work * 60)
  }
  const reset = () => { if (timerRef.current) clearInterval(timerRef.current); setRunning(false); setPhase('work'); setSecs(preset.work * 60) }

  const total = (phase === 'work' ? preset.work : preset.rest) * 60
  const offset = CIRC * (1 - (total - secs) / total)
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss2 = String(secs % 60).padStart(2, '0')

  // Save exam
  const saveExam = () => {
    if (!examForm.name.trim() || !examForm.date) { toast.error('Name and date required'); return }
    if (editExam) { updateExam(editExam.id, examForm); toast.success('Exam updated') }
    else { addExam(examForm); toast.success('Exam added!') }
    setExamModal(false); setEditExam(null); setExamForm({ name: '', date: '', subject: '', notes: '' })
  }

  // Save block
  const saveBlock = () => {
    if (!blockForm.title.trim()) { toast.error('Title required'); return }
    if (editBlock) { updateStudyBlock(editBlock.id, blockForm); toast.success('Session updated') }
    else { addStudyBlock(blockForm); toast.success('Session added!') }
    setBlockModal(false); setEditBlock(null); setBlockForm({ title: '', startTime: '09:00', endTime: '10:00', subjectId: '', notes: '', day: selectedDay, color: '#7C3AED' })
  }

  const openEditExam = (exam: any) => { setEditExam(exam); setExamForm({ name: exam.name, date: exam.date, subject: exam.subject, notes: exam.notes }); setExamModal(true) }
  const openEditBlock = (block: any) => { setEditBlock(block); setBlockForm({ title: block.title, startTime: block.startTime, endTime: block.endTime, subjectId: block.subjectId, notes: block.notes, day: block.day, color: block.color }); setBlockModal(true) }

  const dayBlocks = useMemo(() => studyBlocks.filter(b => b.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime)), [studyBlocks, selectedDay])
  const sortedExams = useMemo(() => [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [exams])

  return (
    <PageShell>
      <h1 className="font-display font-black text-[22px] mb-6">Study Planner</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* ── Pomodoro ── */}
        <Card>
          <CardHeader>
            <CardTitle>Pomodoro Timer</CardTitle>
            {permission !== 'granted' && (
              <Button size="xs" variant="outline" onClick={request}>Enable Alerts</Button>
            )}
          </CardHeader>
          <div className="flex gap-2 mb-5">
            {POMODORO_PRESETS.map(p => (
              <button key={p.label} onClick={() => changePreset(p)}
                className={cn('text-[12px] font-display px-3 py-1.5 rounded-md border transition-all',
                  preset.label === p.label ? 'bg-os-bg4 border-os-border2 text-os-text' : 'border-os-border text-os-text3 hover:text-os-text bg-transparent')}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#1A1A26" strokeWidth="6" />
                <circle cx="80" cy="80" r="70" fill="none" stroke={phase === 'work' ? '#7C3AED' : '#10B981'} strokeWidth="6"
                  strokeDasharray={CIRC} strokeDashoffset={offset} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset .5s ease, stroke .3s', transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-black text-[32px] tracking-tight">{mm}:{ss2}</div>
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
              <span className="text-os-text3">({(sessions * preset.work / 60).toFixed(1)}h focus)</span>
            </div>
          </div>
        </Card>

        {/* ── Exam Countdown ── */}
        <Card>
          <CardHeader>
            <CardTitle>Exam Countdown</CardTitle>
            <Button variant="primary" size="xs" onClick={() => { setEditExam(null); setExamForm({ name: '', date: '', subject: '', notes: '' }); setExamModal(true) }}>
              + Add Exam
            </Button>
          </CardHeader>
          {sortedExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-3">📅</div>
              <div className="font-display font-semibold text-[14px] mb-1">No exams added</div>
              <p className="text-[12px] text-os-text3 mb-3">Add your upcoming exams to track countdown</p>
              <Button variant="outline" size="sm" onClick={() => setExamModal(true)}>+ Add First Exam</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              <AnimatePresence>
                {sortedExams.map(exam => (
                  <ExamCard key={exam.id} exam={exam}
                    onEdit={() => openEditExam(exam)}
                    onDelete={() => { deleteExam(exam.id); toast.success('Exam removed') }} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>

        {/* ── Daily Planner ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Schedule</CardTitle>
            <Button variant="primary" size="xs" onClick={() => { setEditBlock(null); setBlockForm({ title: '', startTime: '09:00', endTime: '10:00', subjectId: subjects[0]?.id ?? '', notes: '', day: selectedDay, color: '#7C3AED' }); setBlockModal(true) }}>
              + Add Session
            </Button>
          </CardHeader>

          {/* Day selector */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {DAYS.map(day => (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={cn('text-[12px] font-display px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all shrink-0',
                  selectedDay === day ? 'bg-[var(--accent)]/12 border-[var(--accent)]/25 text-[#A78BFA]' : 'border-os-border text-os-text3 hover:text-os-text hover:border-os-border2')}>
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {dayBlocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-3xl mb-3">📋</div>
              <div className="font-display font-semibold text-[14px] mb-1">No sessions for {selectedDay}</div>
              <p className="text-[12px] text-os-text3 mb-3">Plan your study sessions for the day</p>
              <Button variant="outline" size="sm" onClick={() => setBlockModal(true)}>+ Plan {selectedDay}</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {dayBlocks.map(block => {
                  const sub = subjects.find(s => s.id === block.subjectId)
                  return (
                    <BlockCard key={block.id} block={block}
                      subjectName={sub?.name ?? ''}
                      subjectColor={sub?.color ?? block.color}
                      onEdit={() => openEditBlock(block)}
                      onDelete={() => { deleteStudyBlock(block.id); toast.success('Session removed') }} />
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>

      {/* ── Exam Modal ── */}
      <Modal open={examModal} onClose={() => { setExamModal(false); setEditExam(null) }}
        title={editExam ? 'Edit Exam' : 'Add Exam'} size="sm">
        <FormGroup label="Exam Name *" htmlFor="exam-name">
          <Input id="exam-name" placeholder="e.g. JEE Mains, GATE CS" value={examForm.name}
            onChange={e => setExamForm(p => ({ ...p, name: e.target.value }))} autoFocus />
        </FormGroup>
        <FormGroup label="Exam Date *" htmlFor="exam-date">
          <Input id="exam-date" type="datetime-local" value={examForm.date}
            onChange={e => setExamForm(p => ({ ...p, date: e.target.value }))} />
        </FormGroup>
        <FormGroup label="Subject (optional)" htmlFor="exam-subject">
          <Input id="exam-subject" placeholder="e.g. Mathematics" value={examForm.subject}
            onChange={e => setExamForm(p => ({ ...p, subject: e.target.value }))} />
        </FormGroup>
        <FormGroup label="Notes (optional)" htmlFor="exam-notes">
          <Input id="exam-notes" placeholder="Any notes..." value={examForm.notes}
            onChange={e => setExamForm(p => ({ ...p, notes: e.target.value }))} />
        </FormGroup>
        <ModalActions>
          <Button onClick={() => { setExamModal(false); setEditExam(null) }}>Cancel</Button>
          <Button variant="primary" onClick={saveExam}>{editExam ? 'Update' : 'Add Exam'}</Button>
        </ModalActions>
      </Modal>

      {/* ── Study Block Modal ── */}
      <Modal open={blockModal} onClose={() => { setBlockModal(false); setEditBlock(null) }}
        title={editBlock ? 'Edit Session' : 'Add Study Session'}>
        <FormGroup label="Session Title *" htmlFor="block-title">
          <Input id="block-title" placeholder="e.g. DSA Practice, Read Chapter 5" value={blockForm.title}
            onChange={e => setBlockForm(p => ({ ...p, title: e.target.value }))} autoFocus />
        </FormGroup>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Start Time" htmlFor="block-start">
            <Input id="block-start" type="time" value={blockForm.startTime}
              onChange={e => setBlockForm(p => ({ ...p, startTime: e.target.value }))} />
          </FormGroup>
          <FormGroup label="End Time" htmlFor="block-end">
            <Input id="block-end" type="time" value={blockForm.endTime}
              onChange={e => setBlockForm(p => ({ ...p, endTime: e.target.value }))} />
          </FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormGroup label="Day" htmlFor="block-day">
            <Select id="block-day" value={blockForm.day}
              onChange={e => setBlockForm(p => ({ ...p, day: e.target.value }))}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Subject" htmlFor="block-subject">
            <Select id="block-subject" value={blockForm.subjectId}
              onChange={e => setBlockForm(p => ({ ...p, subjectId: e.target.value }))}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </Select>
          </FormGroup>
        </div>
        <FormGroup label="Notes (optional)" htmlFor="block-notes">
          <Input id="block-notes" placeholder="What to cover..." value={blockForm.notes}
            onChange={e => setBlockForm(p => ({ ...p, notes: e.target.value }))} />
        </FormGroup>
        <ModalActions>
          <Button onClick={() => { setBlockModal(false); setEditBlock(null) }}>Cancel</Button>
          <Button variant="primary" onClick={saveBlock}>{editBlock ? 'Update' : 'Add Session'}</Button>
        </ModalActions>
      </Modal>
    </PageShell>
  )
}
