// OnboardingPage.tsx — Simplified: Name + Email + Mobile + OTP UI + Subjects
import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Subject, SUBJECT_SUGGESTIONS, SUBJECT_ICONS, SUBJECT_PALETTE } from '@/constants/data'
import { generateId, cn } from '@/utils'
import toast from 'react-hot-toast'

const STEPS = ['Welcome', 'Account', 'Verify', 'Subjects', 'Ready']

// ─── OTP Input ────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const arr = [...digits]
    arr[i] = d
    onChange(arr.join(''))
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center my-4">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-[18px] font-display font-bold rounded-xl border bg-os-bg4 text-os-text outline-none transition-all"
          style={{ borderColor: digits[i] ? '#7C3AED' : '#252535' }}
        />
      ))}
    </div>
  )
}

// ─── Subject input with autocomplete ─────────────────────────
function SubjectInput({ onAdd, existingNames }: { onAdd: (name: string) => void; existingNames: string[] }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return SUBJECT_SUGGESTIONS.filter(s =>
      s.toLowerCase().includes(q) && !existingNames.some(n => n.toLowerCase() === s.toLowerCase())
    ).slice(0, 6)
  }, [value, existingNames])

  const showCreate = value.trim().length > 0 &&
    !existingNames.some(n => n.toLowerCase() === value.trim().toLowerCase())

  const handleAdd = useCallback((name: string) => {
    if (!name.trim()) return
    onAdd(name.trim())
    setValue('')
    inputRef.current?.focus()
  }, [onAdd])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { e.preventDefault(); handleAdd(value) } }}
          placeholder="Type any subject — e.g. DSA, UPSC, Machine Learning..."
          autoComplete="off" className="flex-1" />
        <Button variant="primary" size="sm" onClick={() => handleAdd(value)} disabled={!value.trim()}>Add</Button>
      </div>
      <AnimatePresence>
        {focused && (suggestions.length > 0 || showCreate) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 mt-1 bg-os-bg3 border border-os-border2 rounded-xl shadow-modal z-50 overflow-hidden">
            {showCreate && (
              <button className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-os-bg4 transition-colors flex items-center gap-2 border-b border-os-border"
                onMouseDown={() => handleAdd(value)}>
                <span className="text-[var(--accent)] font-semibold">+ Create</span>
                <span>"{value.trim()}"</span>
              </button>
            )}
            {suggestions.map(s => (
              <button key={s} className="w-full text-left px-4 py-2.5 text-[13px] text-os-text2 hover:bg-os-bg4 hover:text-os-text transition-colors"
                onMouseDown={() => handleAdd(s)}>{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Onboarding ──────────────────────────────────────────
export function OnboardingPage() {
  const { completeOnboarding } = useAppStore(s => ({ completeOnboarding: s.completeOnboarding }))
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '' })
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [otpLoading, setOtpLoading] = useState(false)

  const set = (k: keyof typeof profile) => (v: string) => setProfile(p => ({ ...p, [k]: v }))

  // Simulated OTP send (in production: connect to Firebase/Twilio/Supabase)
  const sendOTP = async () => {
    if (!profile.mobile || profile.mobile.length < 10) { toast.error('Enter valid mobile number'); return }
    setOtpLoading(true)
    await new Promise(r => setTimeout(r, 1500)) // Simulate API call
    setOtpLoading(false)
    setOtpSent(true)
    setOtpTimer(30)
    toast.success(`OTP sent to +91 ${profile.mobile}`)
    // Start countdown
    const iv = setInterval(() => setOtpTimer(t => { if (t <= 1) { clearInterval(iv); return 0 } return t - 1 }), 1000)
  }

  const verifyOTP = () => {
    // In production: verify with Firebase/Twilio
    // For demo: accept any 6-digit OTP
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    toast.success('Verified successfully! ✓')
    setStep(3)
  }

  const handleAddSubject = useCallback((name: string) => {
    setSubjects(prev => {
      if (prev.some(s => s.name.toLowerCase() === name.toLowerCase())) return prev
      const idx = prev.length
      return [...prev, {
        id: `sub_${generateId()}`, name, createdAt: Date.now(),
        color: SUBJECT_PALETTE[idx % SUBJECT_PALETTE.length],
        icon: SUBJECT_ICONS[idx % SUBJECT_ICONS.length],
      }]
    })
  }, [])

  const next = () => {
    if (step === 1) { sendOTP(); setStep(2); return }
    if (step === 2) { verifyOTP(); return }
    if (step === STEPS.length - 1) { completeOnboarding({ name: profile.name, email: profile.email, mobile: profile.mobile }, subjects); return }
    setStep(s => s + 1)
  }

  const canNext =
    step === 0 ? true :
    step === 1 ? !!(profile.name.trim() && profile.email.includes('@') && profile.mobile.length >= 10) :
    step === 2 ? otp.length === 6 :
    true

  return (
    <div className="fixed inset-0 bg-os-bg flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
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
            <motion.div key="0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-display font-black text-white"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>A</div>
              <h1 className="font-display font-black text-[36px] mb-3">Welcome to StudyOS</h1>
              <p className="text-os-text2 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
                Your AI-powered student operating system. Tasks, notes, habits, AI tutoring — all in one beautiful workspace.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[{icon:'✓',label:'Task Manager',desc:'Kanban board'},{icon:'✦',label:'AI Assistant',desc:'Gemini powered'},{icon:'◈',label:'Habit Tracker',desc:'Build streaks'}].map((f,i) => (
                  <div key={i} className="p-4 rounded-xl bg-os-bg3 border border-os-border text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <div className="text-[13px] font-display font-semibold">{f.label}</div>
                    <div className="text-[11px] text-os-text3 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Account Details (simplified) */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2">Create your account</h2>
                <p className="text-os-text2 text-[14px]">Just 3 fields — quick and simple</p>
              </div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl p-6 space-y-3">
                <FormGroup label="Full Name *" htmlFor="ob-name">
                  <Input id="ob-name" placeholder="Your full name" value={profile.name}
                    onChange={e => set('name')(e.target.value)} autoFocus />
                </FormGroup>
                <FormGroup label="Email Address *" htmlFor="ob-email">
                  <Input id="ob-email" type="email" placeholder="you@example.com" value={profile.email}
                    onChange={e => set('email')(e.target.value)} />
                </FormGroup>
                <FormGroup label="Mobile Number *" htmlFor="ob-mobile">
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 rounded-[8px] bg-os-bg5 border border-os-border text-[13px] text-os-text2 shrink-0">+91</div>
                    <Input id="ob-mobile" type="tel" placeholder="10-digit mobile number" value={profile.mobile}
                      onChange={e => set('mobile')(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={e => { if (e.key === 'Enter' && canNext) next() }} />
                  </div>
                </FormGroup>
              </div>
            </motion.div>
          )}

          {/* Step 2 — OTP Verification */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">📱</div>
                <h2 className="font-display font-black text-[28px] mb-2">Verify your number</h2>
                <p className="text-os-text2 text-[14px]">
                  OTP sent to <strong>+91 {profile.mobile}</strong>
                </p>
              </div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl p-6">
                <p className="text-[13px] text-os-text2 text-center mb-2">Enter 6-digit OTP</p>
                <OTPInput value={otp} onChange={setOtp} />
                <div className="text-center mt-3">
                  {otpTimer > 0 ? (
                    <p className="text-[12px] text-os-text3">Resend in {otpTimer}s</p>
                  ) : (
                    <button className="text-[12px] text-[var(--accent2)] underline" onClick={sendOTP}>
                      Resend OTP
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-os-text3 text-center mt-3">
                  💡 Demo: Enter any 6 digits to continue
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Subjects */}
          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2">What are you studying?</h2>
                <p className="text-os-text2 text-[14px]">Type anything — no restrictions</p>
              </div>
              <div className="bg-os-bg3 border border-os-border rounded-2xl p-5">
                <SubjectInput onAdd={handleAddSubject} existingNames={subjects.map(s => s.name)} />
                <div className="mt-3 mb-4">
                  <p className="text-[11px] text-os-text3 mb-2">Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mathematics','Physics','Chemistry','DSA','Machine Learning','UPSC','JEE','Economics'].map(s =>
                      subjects.some(sub => sub.name.toLowerCase() === s.toLowerCase()) ? null : (
                        <button key={s} onClick={() => handleAddSubject(s)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-os-border bg-os-bg4 text-os-text2 hover:border-[var(--accent)] hover:text-[#A78BFA] transition-all font-display">
                          + {s}
                        </button>
                      )
                    )}
                  </div>
                </div>
                {subjects.length === 0 ? (
                  <div className="text-center py-3 text-os-text3 text-[12px]">No subjects yet. You can add them later in Settings.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {subjects.map(s => (
                        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-display font-semibold"
                          style={{ background: s.color + '26', color: s.color, border: `1px solid ${s.color}44` }}>
                          {s.icon} {s.name}
                          <button onClick={() => setSubjects(p => p.filter(x => x.id !== s.id))}
                            className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-[14px] leading-none">×</button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4 — Ready */}
          {step === 4 && (
            <motion.div key="4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="text-6xl mb-6">🎓</motion.div>
              <h2 className="font-display font-black text-[32px] mb-3">
                You&apos;re all set{profile.name ? `, ${profile.name}` : ''}!
              </h2>
              <p className="text-os-text2 text-[15px] mb-6">
                Your personalized study workspace is ready.
              </p>
              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {subjects.map(s => (
                    <span key={s.id} className="text-[12px] px-3 py-1 rounded-full font-display font-semibold"
                      style={{ background: s.color + '26', color: s.color }}>{s.icon} {s.name}</span>
                  ))}
                </div>
              )}
              <p className="text-[13px] text-os-text3">💡 Start by adding your first task or chatting with AI</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8">
          {step > 0 && step !== 2 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : <div />}
          <Button variant="primary" size="lg" onClick={next} disabled={!canNext} loading={otpLoading}>
            {step === 1 ? 'Send OTP →' :
             step === 2 ? 'Verify OTP →' :
             step === STEPS.length - 1 ? 'Launch StudyOS 🚀' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
