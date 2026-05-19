// OnboardingPage.tsx — Real Firebase Phone OTP Authentication
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Subject, SUBJECT_SUGGESTIONS, SUBJECT_ICONS, SUBJECT_PALETTE } from '@/constants/data'
import { generateId, cn } from '@/utils'
import toast from 'react-hot-toast'

// Firebase imports — loaded lazily to avoid blocking initial render
let firebaseAuth: any = null
let RecaptchaVerifier: any = null
let signInWithPhoneNumber: any = null

async function loadFirebase() {
  if (firebaseAuth) return
  try {
    const [{ auth }, { RecaptchaVerifier: RV }, { signInWithPhoneNumber: SIWPN }] = await Promise.all([
      import('@/firebase'),
      import('firebase/auth'),
      import('firebase/auth'),
    ])
    firebaseAuth = auth
    RecaptchaVerifier = RV
    signInWithPhoneNumber = SIWPN
  } catch (e) {
    console.error('Firebase load failed:', e)
  }
}

const STEPS = ['Welcome', 'Account', 'Verify', 'Subjects', 'Ready']

// ─── OTP Input boxes ──────────────────────────────────────────
function OTPInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const arr = [...digits]; arr[i] = d
    onChange(arr.join(''))
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length > 0) { onChange(text); refs.current[Math.min(text.length - 1, 5)]?.focus() }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-center my-5">
      {Array.from({ length: 6 }, (_, i) => (
        <input key={i}
          ref={el => { refs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-[20px] font-display font-bold rounded-xl border bg-os-bg4 outline-none transition-all disabled:opacity-50"
          style={{
            borderColor: digits[i] ? '#7C3AED' : 'var(--border2)',
            color: 'var(--text)',
            boxShadow: digits[i] ? '0 0 0 2px rgba(124,58,237,0.2)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

// ─── Subject autocomplete ─────────────────────────────────────
function SubjectInput({ onAdd, existingNames }: { onAdd: (name: string) => void; existingNames: string[] }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    return SUBJECT_SUGGESTIONS
      .filter(s => s.toLowerCase().includes(value.toLowerCase()) &&
        !existingNames.some(n => n.toLowerCase() === s.toLowerCase()))
      .slice(0, 6)
  }, [value, existingNames])

  const showCreate = value.trim().length > 0 &&
    !existingNames.some(n => n.toLowerCase() === value.trim().toLowerCase())

  const add = useCallback((name: string) => {
    if (!name.trim()) return
    onAdd(name.trim()); setValue(''); inputRef.current?.focus()
  }, [onAdd])

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input ref={inputRef} value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { e.preventDefault(); add(value) } }}
          placeholder="Type any subject — DSA, UPSC, ML..." autoComplete="off" className="flex-1" />
        <Button variant="primary" size="sm" onClick={() => add(value)} disabled={!value.trim()}>Add</Button>
      </div>
      <AnimatePresence>
        {focused && (suggestions.length > 0 || showCreate) && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border z-50 overflow-hidden shadow-modal"
            style={{ background: 'var(--bg3)', borderColor: 'var(--border2)' }}>
            {showCreate && (
              <button className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 border-b hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--border)' }}
                onMouseDown={() => add(value)}>
                <span style={{ color: 'var(--accent)' }} className="font-semibold">+ Create</span>
                <span style={{ color: 'var(--text)' }}>"{value.trim()}"</span>
              </button>
            )}
            {suggestions.map(s => (
              <button key={s} className="w-full text-left px-4 py-2.5 text-[13px] hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text2)' }}
                onMouseDown={() => add(s)}>{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main onboarding ──────────────────────────────────────────
export function OnboardingPage() {
  const { completeOnboarding } = useAppStore(s => ({ completeOnboarding: s.completeOnboarding }))
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '' })
  const [otp, setOtp] = useState('')
  const [otpTimer, setOtpTimer] = useState(0)
  const [loading, setLoading] = useState(false)
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [firebaseReady, setFirebaseReady] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasFirebaseConfig = !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'undefined'
  )

  // Preload Firebase
  useEffect(() => {
    if (hasFirebaseConfig) {
      loadFirebase().then(() => setFirebaseReady(true))
    }
  }, [hasFirebaseConfig])

  const set = (k: keyof typeof profile) => (v: string) => setProfile(p => ({ ...p, [k]: v }))

  const startTimer = useCallback(() => {
    setOtpTimer(30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setOtpTimer(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0 } return t - 1 })
    }, 1000)
  }, [])

  const sendOTP = useCallback(async () => {
    if (!profile.mobile || profile.mobile.length !== 10) {
      toast.error('Enter valid 10-digit mobile number'); return
    }
    if (!hasFirebaseConfig) {
      toast.error('Firebase not configured. Add VITE_FIREBASE_* env variables.'); return
    }
    if (!firebaseReady) { toast.error('Loading Firebase...'); return }

    setLoading(true)
    try {
      // Clear existing reCAPTCHA
      const existing = (window as any).__recaptchaVerifier
      if (existing) { try { existing.clear() } catch {} }

      const verifier = new RecaptchaVerifier(firebaseAuth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => toast.error('reCAPTCHA expired. Please try again.'),
      })
      ;(window as any).__recaptchaVerifier = verifier

      const result = await signInWithPhoneNumber(firebaseAuth, `+91${profile.mobile}`, verifier)
      setConfirmResult(result)
      startTimer()
      toast.success(`OTP sent to +91 ${profile.mobile} ✓`)
      setStep(2)
    } catch (err: any) {
      console.error('OTP send error:', err)
      const msg = err.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number format'
        : err.code === 'auth/too-many-requests'
        ? 'Too many attempts. Try again later.'
        : err.code === 'auth/billing-not-enabled'
        ? 'Firebase billing not enabled. Enable in Firebase Console.'
        : err.message || 'Failed to send OTP'
      toast.error(msg)
    }
    setLoading(false)
  }, [profile.mobile, hasFirebaseConfig, firebaseReady, startTimer])

  const verifyOTP = useCallback(async () => {
    if (otp.length !== 6) { toast.error('Enter complete 6-digit OTP'); return }
    if (!confirmResult) { toast.error('Please request OTP first'); return }
    setLoading(true)
    try {
      await confirmResult.confirm(otp)
      toast.success('Mobile verified! ✓')
      setStep(3)
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-verification-code'
        ? 'Wrong OTP. Please check and try again.'
        : err.code === 'auth/code-expired'
        ? 'OTP expired. Please resend.'
        : 'Verification failed. Try again.'
      toast.error(msg)
      setOtp('')
    }
    setLoading(false)
  }, [otp, confirmResult])

  const handleAddSubject = useCallback((name: string) => {
    setSubjects(prev => {
      if (prev.some(s => s.name.toLowerCase() === name.toLowerCase())) return prev
      const i = prev.length
      return [...prev, {
        id: `sub_${generateId()}`, name, createdAt: Date.now(),
        color: SUBJECT_PALETTE[i % SUBJECT_PALETTE.length],
        icon: SUBJECT_ICONS[i % SUBJECT_ICONS.length],
      }]
    })
  }, [])

  const canNext = step === 0 ? true :
    step === 1 ? !!(profile.name.trim() && profile.email.includes('@') && profile.mobile.length === 10) :
    step === 2 ? otp.length === 6 : true

  const handleNext = () => {
    if (step === 1) { sendOTP(); return }
    if (step === 2) { verifyOTP(); return }
    if (step === STEPS.length - 1) { completeOnboarding({ name: profile.name, email: profile.email, mobile: profile.mobile }, subjects); return }
    setStep(s => s + 1)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      </div>

      {/* Invisible reCAPTCHA container — required by Firebase */}
      <div id="recaptcha-container" />

      <div className="w-full max-w-lg relative z-10">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 28 : 8, background: i <= step ? '#7C3AED' : 'var(--border2)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <motion.div key="0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-display font-black text-white animate-glow"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}>A</div>
              <h1 className="font-display font-black text-[36px] mb-3" style={{ color: 'var(--text)' }}>Welcome to StudyOS</h1>
              <p className="text-[15px] leading-relaxed max-w-md mx-auto mb-8" style={{ color: 'var(--text2)' }}>
                Your AI-powered student OS. Tasks, notes, habits, AI tutoring — all in one workspace.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[{i:'✓',l:'Task Manager',d:'Kanban board'},{i:'✦',l:'AI Assistant',d:'Gemini powered'},{i:'◈',l:'Habit Tracker',d:'Build streaks'}].map((f,i) => (
                  <div key={i} className="p-4 rounded-xl border text-center" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                    <div className="text-2xl mb-2">{f.i}</div>
                    <div className="text-[13px] font-display font-semibold" style={{ color: 'var(--text)' }}>{f.l}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{f.d}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 1 — Account */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2" style={{ color: 'var(--text)' }}>Create your account</h2>
                <p className="text-[14px]" style={{ color: 'var(--text2)' }}>3 fields — quick setup</p>
              </div>
              <div className="rounded-2xl border p-6 space-y-3" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
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
                    <div className="flex items-center px-3 rounded-[8px] text-[13px] shrink-0 border"
                      style={{ background: 'var(--bg5)', borderColor: 'var(--border)', color: 'var(--text2)' }}>
                      🇮🇳 +91
                    </div>
                    <Input id="ob-mobile" type="tel" placeholder="10-digit number" value={profile.mobile}
                      onChange={e => set('mobile')(e.target.value.replace(/\D/g,'').slice(0,10))}
                      onKeyDown={e => { if (e.key === 'Enter' && canNext) handleNext() }} />
                  </div>
                </FormGroup>
                {!hasFirebaseConfig && (
                  <div className="text-[11px] p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.2)' }}>
                    ⚠ Firebase not configured. Add VITE_FIREBASE_* keys in Vercel to enable real OTP.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2 — OTP Verify */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📱</div>
                <h2 className="font-display font-black text-[28px] mb-2" style={{ color: 'var(--text)' }}>Verify your number</h2>
                <p className="text-[14px]" style={{ color: 'var(--text2)' }}>
                  OTP sent to <strong>+91 {profile.mobile}</strong>
                </p>
              </div>
              <div className="rounded-2xl border p-6" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                <p className="text-[13px] text-center" style={{ color: 'var(--text2)' }}>Enter the 6-digit OTP</p>
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />
                <div className="text-center">
                  {otpTimer > 0 ? (
                    <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                      Resend OTP in <strong style={{ color: 'var(--accent)' }}>{otpTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      className="text-[12px] underline transition-opacity hover:opacity-80"
                      style={{ color: 'var(--accent2)' }}
                      onClick={sendOTP}
                      disabled={loading}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Subjects */}
          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2" style={{ color: 'var(--text)' }}>What are you studying?</h2>
                <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Type anything — no restrictions. Add more later in Settings.</p>
              </div>
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                <SubjectInput onAdd={handleAddSubject} existingNames={subjects.map(s => s.name)} />
                <div className="mt-3 mb-4">
                  <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mathematics','Physics','DSA','Machine Learning','UPSC','JEE','Chemistry','Economics'].map(s =>
                      subjects.some(sub => sub.name.toLowerCase() === s.toLowerCase()) ? null : (
                        <button key={s} onClick={() => handleAddSubject(s)}
                          className="text-[11px] px-2.5 py-1 rounded-full border transition-all font-display hover:opacity-80"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg4)', color: 'var(--text2)' }}>
                          + {s}
                        </button>
                      )
                    )}
                  </div>
                </div>
                {subjects.length === 0 ? (
                  <div className="text-center py-3 text-[12px]" style={{ color: 'var(--text3)' }}>
                    No subjects yet — you can add them later in Settings too.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <AnimatePresence>
                      {subjects.map(s => (
                        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-display font-semibold"
                          style={{ background: s.color + '26', color: s.color, border: `1px solid ${s.color}44` }}>
                          {s.icon} {s.name}
                          <button onClick={() => setSubjects(p => p.filter(x => x.id !== s.id))}
                            className="ml-1 opacity-60 hover:opacity-100 text-[14px] leading-none transition-opacity">×</button>
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
              <h2 className="font-display font-black text-[32px] mb-3" style={{ color: 'var(--text)' }}>
                You&apos;re all set{profile.name ? `, ${profile.name}` : ''}!
              </h2>
              <p className="text-[15px] mb-6" style={{ color: 'var(--text2)' }}>
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
              <p className="text-[13px]" style={{ color: 'var(--text3)' }}>💡 Start by adding your first task or chatting with AI</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 && step !== 2 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : <div />}
          <Button variant="primary" size="lg" onClick={handleNext} disabled={!canNext} loading={loading}>
            {step === 1 ? 'Send OTP →' :
             step === 2 ? 'Verify OTP →' :
             step === STEPS.length - 1 ? 'Launch StudyOS 🚀' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
