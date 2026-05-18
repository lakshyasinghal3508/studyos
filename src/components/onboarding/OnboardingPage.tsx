// OnboardingPage.tsx
// Step 2 now has FREE-FORM subject input with autocomplete
// No hardcoded subject buttons — user types anything they want
// Subjects created here are saved to the store on completion

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Subject, SUBJECT_SUGGESTIONS, SUBJECT_ICONS, SUBJECT_PALETTE } from '@/constants/data'
import { generateId, cn } from '@/utils'

const STEPS = ['Welcome', 'Profile', 'Subjects', 'Ready']

// ─── Subject Autocomplete Input ───────────────────────────────
function SubjectInput({
  onAdd,
  existingNames,
}: {
  onAdd: (name: string) => void
  existingNames: string[]
}) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return SUBJECT_SUGGESTIONS
      .filter(s =>
        s.toLowerCase().includes(q) &&
        !existingNames.some(n => n.toLowerCase() === s.toLowerCase())
      )
      .slice(0, 6)
  }, [value, existingNames])

  const showCreate = value.trim().length > 0 &&
    !existingNames.some(n => n.toLowerCase() === value.trim().toLowerCase())

  const handleAdd = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
    inputRef.current?.focus()
  }, [onAdd])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => {
            if (e.key === 'Enter' && value.trim()) {
              e.preventDefault()
              handleAdd(value)
            }
          }}
          placeholder="Type any subject — e.g. Machine Learning, UPSC, DSA..."
          className="flex-1"
          autoComplete="off"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleAdd(value)}
          disabled={!value.trim()}
        >
          Add
        </Button>
      </div>

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {focused && (suggestions.length > 0 || showCreate) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-os-bg3 border border-os-border2 rounded-xl shadow-modal z-50 overflow-hidden"
          >
            {showCreate && (
              <button
                className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-os-bg4 transition-colors flex items-center gap-2 border-b border-os-border"
                onMouseDown={() => handleAdd(value)}
              >
                <span className="text-[var(--accent)] font-semibold">+ Create</span>
                <span className="text-os-text">"{value.trim()}"</span>
              </button>
            )}
            {suggestions.map(s => (
              <button
                key={s}
                className="w-full text-left px-4 py-2.5 text-[13px] text-os-text2 hover:bg-os-bg4 hover:text-os-text transition-colors"
                onMouseDown={() => handleAdd(s)}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Onboarding Page ──────────────────────────────────────────
export function OnboardingPage() {
  const { completeOnboarding } = useAppStore(s => ({ completeOnboarding: s.completeOnboarding }))
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', year: 'Freshman', gpa: '', university: '' })
  const [subjects, setSubjects] = useState<Subject[]>([])
  const set = (k: keyof typeof profile) => (v: string) =>
    setProfile(p => ({ ...p, [k]: v }))

  const handleAddSubject = useCallback((name: string) => {
    setSubjects(prev => {
      if (prev.some(s => s.name.toLowerCase() === name.toLowerCase())) return prev
      const colorIndex = prev.length % SUBJECT_PALETTE.length
      const iconIndex = prev.length % SUBJECT_ICONS.length
      return [...prev, {
        id: `sub_${generateId()}`,
        name,
        color: SUBJECT_PALETTE[colorIndex],
        icon: SUBJECT_ICONS[iconIndex],
        createdAt: Date.now(),
      }]
    })
  }, [])

  const handleRemoveSubject = useCallback((id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id))
  }, [])

  const handleFinish = () => {
    completeOnboarding(profile, subjects)
  }

  const next = () => {
    if (step === STEPS.length - 1) handleFinish()
    else setStep(s => s + 1)
  }

  const canNext =
    step === 0 ? true :
    step === 1 ? !!profile.name.trim() :
    true

  return (
    <div className="fixed inset-0 bg-os-bg flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 28 : 8, background: i <= step ? '#7C3AED' : '#252535' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-display font-black text-white"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
                A
              </div>
              <h1 className="font-display font-black text-[36px] mb-3">Welcome to StudyOS</h1>
              <p className="text-os-text2 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
                Your AI-powered student operating system. Manage tasks, notes, habits, and get personalized study coaching — all in one beautiful workspace.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { icon: '✓', label: 'Task Manager', desc: 'Kanban board' },
                  { icon: '✦', label: 'AI Assistant', desc: 'Free & Powerful' },
                  { icon: '◈', label: 'Habit Tracker', desc: 'Build streaks' },
                ].map((f, i) => (
                  <div key={i} className="p-4 rounded-xl bg-os-bg3 border border-os-border text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-[13px] font-display font-semibold">{f.label}</div>
                    <div className="text-[11px] text-os-text3 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Profile */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-black text-[28px] mb-2">Tell us about yourself</h2>
                <p className="text-os-text2 text-[14px]">Personalize your StudyOS experience</p>
              </div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl p-6 space-y-3">
                <FormGroup label="Full Name *" htmlFor="ob-name">
                  <Input id="ob-name" placeholder="Your name" value={profile.name}
                    onChange={e => set('name')(e.target.value)} autoFocus />
                </FormGroup>
                <FormGroup label="University / School" htmlFor="ob-uni">
                  <Input id="ob-uni" placeholder="e.g. IIT Delhi, DU, Coursera..." value={profile.university}
                    onChange={e => set('university')(e.target.value)} />
                </FormGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FormGroup label="Year / Level" htmlFor="ob-year">
                    <Select id="ob-year" value={profile.year} onChange={e => set('year')(e.target.value)}>
                      {['Freshman','Sophomore','Junior','Senior','Graduate','Self-Study','Professional'].map(y => (
                        <option key={y}>{y}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup label="GPA / Score (optional)" htmlFor="ob-gpa">
                    <Input id="ob-gpa" placeholder="e.g. 3.8 or 85%" value={profile.gpa}
                      onChange={e => set('gpa')(e.target.value)} />
                  </FormGroup>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Subjects (fully free-form) */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2">What are you studying?</h2>
                <p className="text-os-text2 text-[14px]">
                  Type ANY subject — no restrictions. You can add more later in Settings.
                </p>
              </div>

              <div className="bg-os-bg3 border border-os-border rounded-2xl p-5">
                <SubjectInput
                  onAdd={handleAddSubject}
                  existingNames={subjects.map(s => s.name)}
                />

                {/* Quick suggestions */}
                <div className="mt-3 mb-4">
                  <p className="text-[11px] text-os-text3 mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mathematics','Physics','Chemistry','Computer Science','History','Economics','DSA','Machine Learning','UPSC','JEE'].map(s => (
                      subjects.some(sub => sub.name.toLowerCase() === s.toLowerCase()) ? null : (
                        <button
                          key={s}
                          onClick={() => handleAddSubject(s)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-os-border bg-os-bg4 text-os-text2 hover:border-[var(--accent)] hover:text-[#A78BFA] transition-all font-display"
                        >
                          + {s}
                        </button>
                      )
                    ))}
                  </div>
                </div>

                {/* Added subjects */}
                {subjects.length === 0 ? (
                  <div className="text-center py-4 text-os-text3 text-[13px]">
                    No subjects added yet. Type above to add your first subject.
                    <br />
                    <span className="text-[11px]">(You can skip this and add subjects later)</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {subjects.map(s => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-display font-semibold"
                          style={{ background: s.color + '26', color: s.color, border: `1px solid ${s.color}44` }}
                        >
                          {s.icon} {s.name}
                          <button
                            onClick={() => handleRemoveSubject(s.id)}
                            className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-[14px] leading-none"
                            aria-label={`Remove ${s.name}`}
                          >
                            ×
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3 — Ready */}
          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="text-6xl mb-6">🎓
              </motion.div>
              <h2 className="font-display font-black text-[32px] mb-3">
                You&apos;re all set{profile.name ? `, ${profile.name}` : ''}!
              </h2>
              <p className="text-os-text2 text-[15px] mb-6">
                Your personalized study workspace is ready. Let&apos;s make this the most productive semester yet.
              </p>
              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {subjects.map(s => (
                    <span key={s.id}
                      className="text-[12px] px-3 py-1 rounded-full font-display font-semibold"
                      style={{ background: s.color + '26', color: s.color }}>
                      {s.icon} {s.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[13px] text-os-text3">
                💡 Tip: Start by adding your first task for today
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : <div />}
          <Button variant="primary" size="lg" onClick={next} disabled={!canNext}>
            {step === STEPS.length - 1 ? 'Launch StudyOS 🚀' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
