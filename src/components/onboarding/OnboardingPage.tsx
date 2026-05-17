import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { SUBJECTS } from '@/constants/data'

const STEPS = ['Welcome', 'Profile', 'Goals', 'Ready']

export function OnboardingPage() {
  const { updateProfile, completeOnboarding } = useAppStore(s => ({
    updateProfile: s.updateProfile, completeOnboarding: s.completeOnboarding,
  }))
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', year: 'Junior', gpa: '', university: '' })
  const set = (k: keyof typeof profile) => (v: string) => setProfile(p => ({ ...p, [k]: v }))

  const next = () => {
    if (step === STEPS.length - 1) {
      if (profile.name) updateProfile(profile)
      completeOnboarding()
    } else setStep(s => s + 1)
  }

  const canNext = step === 0 ? true : step === 1 ? !!profile.name : true

  return (
    <div className="fixed inset-0 bg-os-bg mesh-bg flex items-center justify-center p-4 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} aria-hidden />

      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, background: i <= step ? '#7C3AED' : '#252535' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-display font-black text-white animate-glow"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}>
                A
              </div>
              <h1 className="font-display font-black text-[36px] mb-3">Welcome to StudyOS</h1>
              <p className="text-os-text2 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
                Your AI-powered student operating system. Manage tasks, notes, habits, and get personalized study coaching — all in one beautiful workspace.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8 text-center">
                {[
                  { icon: '✓', label: 'Task Manager', desc: 'Kanban board' },
                  { icon: '✦', label: 'AI Assistant', desc: 'Powered by Claude' },
                  { icon: '◈', label: 'Habit Tracker', desc: 'Build streaks' },
                ].map((f, i) => (
                  <div key={i} className="p-4 rounded-xl bg-os-bg3 border border-os-border">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-[13px] font-display font-semibold">{f.label}</div>
                    <div className="text-[11px] text-os-text3 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-black text-[28px] mb-2">Tell us about yourself</h2>
                <p className="text-os-text2 text-[14px]">Personalize your StudyOS experience</p>
              </div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl p-6 space-y-3">
                <FormGroup label="Full Name *" htmlFor="ob-name">
                  <Input id="ob-name" placeholder="Alex Kumar" value={profile.name} onChange={e => set('name')(e.target.value)} autoFocus />
                </FormGroup>
                <FormGroup label="University" htmlFor="ob-uni">
                  <Input id="ob-uni" placeholder="State University" value={profile.university} onChange={e => set('university')(e.target.value)} />
                </FormGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FormGroup label="Year" htmlFor="ob-year">
                    <Select id="ob-year" value={profile.year} onChange={e => set('year')(e.target.value)}>
                      {['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'].map(y => <option key={y}>{y}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup label="GPA (optional)" htmlFor="ob-gpa">
                    <Input id="ob-gpa" placeholder="3.8" value={profile.gpa} onChange={e => set('gpa')(e.target.value)} />
                  </FormGroup>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h2 className="font-display font-black text-[28px] mb-2">What are you studying?</h2>
                <p className="text-os-text2 text-[14px]">Select your focus subjects for AI-personalized help</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {SUBJECTS.map(s => (
                  <button key={s}
                    className="p-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/8 text-[#A78BFA] font-display font-semibold text-[14px] hover:bg-[var(--accent)]/15 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="text-6xl mb-6">🎓</motion.div>
              <h2 className="font-display font-black text-[32px] mb-3">You&apos;re all set, {profile.name || 'Scholar'}!</h2>
              <p className="text-os-text2 text-[15px] mb-8">
                Your AI-powered study workspace is ready. Let&apos;s make this semester your best one yet.
              </p>
              <div className="flex flex-col items-center gap-2">
                <div className="text-[13px] text-os-text3">Pro tip: Start by adding your tasks for the week</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
