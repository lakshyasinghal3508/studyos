// SettingsPage.tsx — Appearance section REMOVED, system theme auto-detects
import { useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PageShell } from '@/components/layout/PageShell'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Modal, ModalActions } from '@/components/ui/Modal'
import { useAppStore, useProfile, useSubjects } from '@/store/useAppStore'
import { SUBJECT_ICONS, SUBJECT_PALETTE, SUBJECT_SUGGESTIONS } from '@/constants/data'
import { cn } from '@/utils'
import toast from 'react-hot-toast'

// Stable sub-components — prevents focus loss bug
const Section = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="mb-3">
    <div className="font-display font-semibold text-[14px] pb-3 border-b border-os-border mb-4">{title}</div>
    {children}
  </Card>
))

const Row = memo(({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-os-border last:border-none gap-4">
    <span className="text-[13px] text-os-text2 shrink-0">{label}</span>
    <div className="flex justify-end flex-wrap gap-2">{children}</div>
  </div>
))

// ─── Subject Manager ──────────────────────────────────────────
function SubjectManagerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const subjects = useSubjects()
  const { addSubject, updateSubject, deleteSubject } = useAppStore(s => ({
    addSubject: s.addSubject, updateSubject: s.updateSubject, deleteSubject: s.deleteSubject,
  }))
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#7C3AED', icon: '📚' })
  const [formError, setFormError] = useState('')
  const [subjectSearch, setSubjectSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions = subjectSearch.trim().length > 0
    ? SUBJECT_SUGGESTIONS.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase()) && !subjects.some(sub => sub.name.toLowerCase() === s.toLowerCase())).slice(0, 5)
    : []

  const resetForm = useCallback(() => {
    setForm({ name: '', color: '#7C3AED', icon: '📚' })
    setFormError(''); setAdding(false); setEditId(null); setSubjectSearch('')
  }, [])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) { setFormError('Name is required'); return }
    const dup = subjects.find(s => s.name.toLowerCase() === form.name.trim().toLowerCase() && s.id !== editId)
    if (dup) { setFormError('Subject already exists'); return }
    if (editId) { updateSubject(editId, { name: form.name.trim(), color: form.color, icon: form.icon }); toast.success('Updated') }
    else { addSubject({ name: form.name.trim(), color: form.color, icon: form.icon }); toast.success('Subject added!') }
    resetForm()
  }, [form, editId, subjects, addSubject, updateSubject, resetForm])

  return (
    <Modal open={open} onClose={onClose} title="Manage Subjects" size="lg">
      <div className="flex flex-col gap-2 mb-4 max-h-44 overflow-y-auto pr-1">
        {subjects.length === 0 && <p className="text-os-text3 text-[13px] text-center py-4">No subjects yet.</p>}
        <AnimatePresence>
          {subjects.map(sub => (
            <motion.div key={sub.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-os-bg4 border border-os-border">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: sub.color + '26' }}>{sub.icon}</div>
              <span className="flex-1 text-[13px] font-medium truncate">{sub.name}</span>
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: sub.color }} />
              <Button size="xs" variant="ghost" onClick={() => { setForm({ name: sub.name, color: sub.color, icon: sub.icon }); setEditId(sub.id); setAdding(false); setFormError('') }}>Edit</Button>
              <Button size="xs" variant="danger" onClick={() => setDeleteId(sub.id)}>Del</Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(adding || editId) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="border border-os-border2 rounded-xl p-4 mb-4 bg-os-bg4">
            <div className="text-[13px] font-display font-semibold mb-3">{editId ? 'Edit Subject' : 'New Subject'}</div>
            {formError && <p className="text-[12px] text-red-400 mb-2 p-2 rounded bg-red-500/10">{formError}</p>}
            <div className="relative mb-3">
              <FormGroup label="Subject Name *" htmlFor="sub-name">
                <Input id="sub-name" placeholder="Type any subject name..." value={form.name}
                  onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setSubjectSearch(e.target.value); setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} autoFocus />
              </FormGroup>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-os-bg3 border border-os-border2 rounded-xl shadow-modal z-50 overflow-hidden">
                  {suggestions.map(s => (
                    <button key={s} className="w-full text-left px-3 py-2 text-[12px] hover:bg-os-bg4 transition-colors"
                      onMouseDown={() => { setForm(p => ({ ...p, name: s })); setShowSuggestions(false) }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-3">
              <div className="text-[12px] text-os-text2 font-display font-medium mb-1.5">Icon</div>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_ICONS.map(icon => (
                  <button key={icon} onClick={() => setForm(p => ({ ...p, icon }))}
                    className={cn('w-9 h-9 rounded-lg text-lg transition-all border', form.icon === icon ? 'border-[var(--accent)] bg-[var(--accent)]/12' : 'border-os-border bg-os-bg5 hover:border-os-border2')}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-[12px] text-os-text2 font-display font-medium mb-1.5">Color</div>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_PALETTE.map(color => (
                  <button key={color} onClick={() => setForm(p => ({ ...p, color }))}
                    className={cn('w-7 h-7 rounded-full border-2 transition-all', form.color === color ? 'border-white scale-125' : 'border-transparent')}
                    style={{ background: color }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={resetForm}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={handleSave}>{editId ? 'Save' : 'Add Subject'}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {deleteId && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/8 mb-4">
          <p className="text-[13px] text-red-400 mb-3">Delete this subject? Tasks and notes will be moved to another subject.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button size="sm" variant="danger" onClick={() => { deleteSubject(deleteId); setDeleteId(null); toast.success('Deleted') }}>Delete</Button>
          </div>
        </div>
      )}

      <ModalActions>
        {!adding && !editId && <Button variant="primary" onClick={() => { setAdding(true); setEditId(null) }}>+ Add Subject</Button>}
        <Button onClick={onClose}>Close</Button>
      </ModalActions>
    </Modal>
  )
}

// ─── Settings Page — NO appearance section ───────────────────
export function SettingsPage() {
  const profile = useProfile()
  const { updateProfile } = useAppStore(s => ({ updateProfile: s.updateProfile }))

  // Individual state fields — prevents focus loss bug
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [mobile, setMobile] = useState(profile.mobile || '')
  const [gpa, setGpa] = useState(profile.gpa)
  const [year, setYear] = useState(profile.year)
  const [aiStyle, setAiStyle] = useState(profile.aiStyle)
  const [notifications, setNotifications] = useState(profile.notifications)
  const [subjectModal, setSubjectModal] = useState(false)
  const subjects = useSubjects()

  const handleNotif = useCallback((k: keyof typeof notifications) => (v: boolean) =>
    setNotifications(prev => ({ ...prev, [k]: v })), [])

  const save = useCallback(() => {
    updateProfile({ name, email, mobile, gpa, year, aiStyle, notifications })
    toast.success('Settings saved!')
  }, [name, email, mobile, gpa, year, aiStyle, notifications, updateProfile])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify({ profile: { name, email, mobile, gpa, year }, exported: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'studyos-data.json'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }, [name, email, mobile, gpa, year])

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-[22px]">Settings</h1>
        <Button variant="primary" onClick={save}>Save Changes</Button>
      </div>

      <div className="max-w-2xl">
        {/* Profile */}
        <Section title="Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormGroup label="Full Name" htmlFor="s-name">
              <Input id="s-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
            </FormGroup>
            <FormGroup label="Email" htmlFor="s-email">
              <Input id="s-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </FormGroup>
            <FormGroup label="Mobile" htmlFor="s-mobile">
              <Input id="s-mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" />
            </FormGroup>
            <FormGroup label="GPA / Score" htmlFor="s-gpa">
              <Input id="s-gpa" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="e.g. 3.8" />
            </FormGroup>
            <FormGroup label="Year / Level" htmlFor="s-year">
              <Select id="s-year" value={year} onChange={e => setYear(e.target.value)}>
                {['Freshman','Sophomore','Junior','Senior','Graduate','Self-Study','Professional'].map(y => <option key={y}>{y}</option>)}
              </Select>
            </FormGroup>
          </div>
        </Section>

        {/* Subjects */}
        <Section title="Subjects">
          <Row label={`${subjects.length} subject${subjects.length !== 1 ? 's' : ''} configured`}>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {subjects.slice(0, 5).map(s => (
                <span key={s.id} className="text-[11px] px-2 py-0.5 rounded-full font-display font-semibold"
                  style={{ background: s.color + '26', color: s.color }}>{s.icon} {s.name}</span>
              ))}
              {subjects.length > 5 && <span className="text-[11px] text-os-text3">+{subjects.length - 5}</span>}
            </div>
          </Row>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setSubjectModal(true)}>⚙ Manage Subjects</Button>
          </div>
        </Section>

        {/* AI */}
        <Section title="AI Preferences">
          <Row label="Response Style">
            <Select value={aiStyle} onChange={e => setAiStyle(e.target.value)} className="w-auto">
              {['Encouraging & Motivating','Direct & Concise','Detailed & Thorough','Socratic'].map(s => <option key={s}>{s}</option>)}
            </Select>
          </Row>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          {(Object.keys(notifications) as Array<keyof typeof notifications>).map(k => (
            <Row key={k} label={k === 'tasks' ? 'Task Reminders' : k === 'pomodoro' ? 'Pomodoro Sound' : k === 'habits' ? 'Habit Reminders' : 'Exam Alerts'}>
              <Toggle checked={notifications[k]} onChange={handleNotif(k)} label={k} />
            </Row>
          ))}
        </Section>

        {/* Theme info — no controls, system auto-detects */}
        <Section title="Appearance">
          <div className="py-2 flex items-center gap-3">
            <div className="text-2xl">🌓</div>
            <div>
              <div className="text-[13px] font-medium">System Theme</div>
              <div className="text-[11px] text-os-text3">Theme automatically matches your device settings. No manual control needed.</div>
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data & Privacy">
          <Row label="Export Data"><Button size="sm" onClick={exportData}>Export JSON</Button></Row>
          <Row label="Clear All Data">
            <Button variant="danger" size="sm" onClick={() => {
              if (confirm('Clear all data? Cannot be undone.')) { localStorage.clear(); location.reload() }
            }}>Clear All Data</Button>
          </Row>
        </Section>
      </div>

      <SubjectManagerModal open={subjectModal} onClose={() => setSubjectModal(false)} />
    </PageShell>
  )
}
