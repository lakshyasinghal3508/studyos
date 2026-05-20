import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input, Select, FormGroup } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Subject, SUBJECT_SUGGESTIONS, SUBJECT_ICONS, SUBJECT_PALETTE } from '@/constants/data'
import { generateId, cn } from '@/utils'
import toast from 'react-hot-toast'
import { trackRegister, trackLogin } from '@/supabase'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'studyos_salt_2026')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const AUTH_KEY = 'studyos_auth'

function getStoredAuth() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
}

function saveAuth(data: object) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

// ─── Subject Input ────────────────────────────────────────────
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
              <button className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 border-b"
                style={{ borderColor: 'var(--border)' }} onMouseDown={() => add(value)}>
                <span style={{ color: 'var(--accent)' }} className="font-semibold">+ Create</span>
                <span style={{ color: 'var(--text)' }}>"{value.trim()}"</span>
              </button>
            )}
            {suggestions.map(s => (
              <button key={s} className="w-full text-left px-4 py-2.5 text-[13px] hover:opacity-80 transition-opacity"
                style={{ color: 'var(--text2)' }} onMouseDown={() => add(s)}>{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Forgot Password Screen ───────────────────────────────────
function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<'verify' | 'reset'>('verify')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const verifyIdentity = async () => {
    if (!email || !dob) { setError('Enter email and date of birth'); return }
    setLoading(true)
    const auth = getStoredAuth()
    if (!auth) { setError('No account found with this email.'); setLoading(false); return }
    if (auth.email.toLowerCase() !== email.toLowerCase()) { setError('Email not found.'); setLoading(false); return }
    if (auth.dob !== dob) { setError('Date of birth does not match our records.'); setLoading(false); return }
    setError('')
    setStep('reset')
    setLoading(false)
  }

  const resetPassword = async () => {
    if (newPass.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPass !== confirmPass) { setError('Passwords do not match'); return }
    setLoading(true)
    const auth = getStoredAuth()
    const hash = await hashPassword(newPass)
    saveAuth({ ...auth, passwordHash: hash })
    toast.success('Password reset successfully!')
    onBack()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[13px] mb-6 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text3)' }}>← Back to Login</button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="font-display font-black text-[24px] mb-1" style={{ color: 'var(--text)' }}>
            {step === 'verify' ? 'Forgot Password' : 'Set New Password'}
          </h2>
          <p className="text-[13px]" style={{ color: 'var(--text2)' }}>
            {step === 'verify' ? 'Verify your identity to reset password' : 'Create a new strong password'}
          </p>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-3 p-3 rounded-lg text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          {step === 'verify' ? (
            <>
              <FormGroup label="Email Address" htmlFor="fp-email">
                <Input id="fp-email" type="email" placeholder="Your registered email"
                  value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </FormGroup>
              <FormGroup label="Date of Birth" htmlFor="fp-dob">
                <Input id="fp-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </FormGroup>
              <Button variant="primary" className="w-full mt-2" onClick={verifyIdentity} loading={loading}>
                Verify Identity →
              </Button>
            </>
          ) : (
            <>
              <FormGroup label="New Password *" htmlFor="fp-newpass">
                <div className="relative">
                  <Input id="fp-newpass" type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters" value={newPass}
                    onChange={e => { setNewPass(e.target.value); setError('') }}
                    className="pr-12" autoFocus />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
                    style={{ color: 'var(--text3)' }}>{showPass ? 'Hide' : 'Show'}</button>
                </div>
              </FormGroup>
              <FormGroup label="Confirm Password *" htmlFor="fp-confirm">
                <Input id="fp-confirm" type={showPass ? 'text' : 'password'}
                  placeholder="Repeat new password" value={confirmPass}
                  onChange={e => { setConfirmPass(e.target.value); setError('') }}
                  onKeyDown={e => { if (e.key === 'Enter') resetPassword() }} />
              </FormGroup>
              <Button variant="primary" className="w-full mt-2" onClick={resetPassword} loading={loading}>
                Reset Password ✓
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────
function LoginScreen({ onLogin, onNewAccount }: {
  onLogin: (name: string, email: string, mobile: string) => void
  onNewAccount: () => void
}) {
  const stored = getStoredAuth()
  const [email, setEmail] = useState(stored?.email || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  if (showForgot) return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Enter email and password'); return }
    setLoading(true); setError('')
    try {
      const hash = await hashPassword(password)
      const auth = getStoredAuth()
      if (!auth) { setError('No account found. Please register first.'); setLoading(false); return }
      if (auth.email.toLowerCase() !== email.toLowerCase()) { setError('Email not found.'); setLoading(false); return }
      if (auth.passwordHash !== hash) { setError('Wrong password. Please try again.'); setLoading(false); return }
      toast.success(`Welcome back, ${auth.name}! 👋`)
      // Track login
await trackLogin(email)
      onLogin(auth.name, auth.email, auth.mobile)
    } catch { setError('Login failed. Try again.') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-display font-black text-white"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', boxShadow: '0 0 30px rgba(124,58,237,0.3)' }}>A</div>
          <h1 className="font-display font-black text-[28px]" style={{ color: 'var(--text)' }}>Welcome back</h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--text2)' }}>Sign in to StudyOS</p>
        </div>

        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
          {error && (
            <div className="mb-3 p-3 rounded-lg text-[13px]"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
              {error}
            </div>
          )}
          <FormGroup label="Email Address" htmlFor="login-email">
            <Input id="login-email" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
          </FormGroup>
          <FormGroup label="Password" htmlFor="login-pass">
            <div className="relative">
              <Input id="login-pass" type={showPass ? 'text' : 'password'}
                placeholder="Your password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
                className="pr-12" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
                style={{ color: 'var(--text3)' }}>{showPass ? 'Hide' : 'Show'}</button>
            </div>
          </FormGroup>

          {/* Forgot password link */}
          <div className="text-right mb-3">
            <button className="text-[12px] underline" style={{ color: 'var(--accent2)' }}
              onClick={() => setShowForgot(true)}>
              Forgot password?
            </button>
          </div>

          <Button variant="primary" className="w-full" onClick={handleLogin} loading={loading}>
            Sign In →
          </Button>
        </div>

        <div className="text-center mt-4">
          <span className="text-[13px]" style={{ color: 'var(--text3)' }}>New to StudyOS? </span>
          <button className="text-[13px] underline font-medium" style={{ color: 'var(--accent2)' }}
            onClick={onNewAccount}>
            Create new account
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Signup Flow ─────────────────────────────────────────
const STEPS = ['Welcome', 'Register', 'Subjects', 'Ready']

export function OnboardingPage() {
  const { completeOnboarding } = useAppStore(s => ({ completeOnboarding: s.completeOnboarding }))

  const hasExistingAccount = !!getStoredAuth()
  const [showLogin, setShowLogin] = useState(hasExistingAccount)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', email: '', mobile: '', dob: '' })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passError, setPassError] = useState('')
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])

  const set = (k: keyof typeof profile) => (v: string) => setProfile(p => ({ ...p, [k]: v }))

  const handleLogin = (name: string, email: string, mobile: string) => {
    completeOnboarding({ name, email, mobile }, [])
  }

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

  const validateAccount = () => {
    if (!profile.name.trim()) { setPassError('Name is required'); return false }
    if (!profile.email.includes('@')) { setPassError('Enter valid email'); return false }
    if (!profile.dob) { setPassError('Date of birth is required'); return false }
    if (password.length < 6) { setPassError('Password must be at least 6 characters'); return false }
    if (password !== confirmPassword) { setPassError('Passwords do not match'); return false }
    setPassError(''); return true
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!validateAccount()) return
      setLoading(true)
      try {
        const hash = await hashPassword(password)
        saveAuth({
          name: profile.name, email: profile.email,
          mobile: profile.mobile, dob: profile.dob, passwordHash: hash,
        })
        toast.success('Account created! 🎉')
        // Track registration
await trackRegister({
  name: profile.name,
  email: profile.email,
  mobile: profile.mobile,
  device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
})
        setStep(2)
      } catch { toast.error('Something went wrong') }
      setLoading(false)
      return
    }
    if (step === STEPS.length - 1) {
      completeOnboarding({ name: profile.name, email: profile.email, mobile: profile.mobile }, subjects)
      return
    }
    setStep(s => s + 1)
  }

  const canNext =
    step === 0 ? true :
    step === 1 ? !!(profile.name.trim() && profile.email.includes('@') && profile.dob && password.length >= 6 && confirmPassword === password) :
    true

  if (showLogin) return <LoginScreen onLogin={handleLogin} onNewAccount={() => setShowLogin(false)} />

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Progress */}
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
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl font-display font-black text-white"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>A</div>
              <h1 className="font-display font-black text-[36px] mb-3" style={{ color: 'var(--text)' }}>Welcome to StudyOS</h1>
              <p className="text-[15px] leading-relaxed max-w-md mx-auto mb-8" style={{ color: 'var(--text2)' }}>
                Your AI-powered student OS. Tasks, notes, habits, AI tutoring — all in one workspace.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[{i:'✓',l:'Task Manager',d:'Kanban board'},{i:'✦',l:'AI Assistant',d:'Gemini powered'},{i:'◈',l:'Habit Tracker',d:'Build streaks'}].map((f,idx) => (
                  <div key={idx} className="p-4 rounded-xl border text-center" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                    <div className="text-2xl mb-2">{f.i}</div>
                    <div className="text-[13px] font-display font-semibold" style={{ color: 'var(--text)' }}>{f.l}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{f.d}</div>
                  </div>
                ))}
              </div>
              <button className="text-[13px] underline" style={{ color: 'var(--text3)' }}
                onClick={() => setShowLogin(true)}>
                Already have an account? Sign in
              </button>
            </motion.div>
          )}

          {/* Step 1 — Register New User */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-5">
                <h2 className="font-display font-black text-[26px] mb-1" style={{ color: 'var(--text)' }}>Register New User</h2>
                <p className="text-[13px]" style={{ color: 'var(--text2)' }}>Create your StudyOS account</p>
              </div>
              <div className="rounded-2xl border p-5 space-y-2" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                {passError && (
                  <div className="p-3 rounded-lg text-[13px]"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}>
                    {passError}
                  </div>
                )}
                <FormGroup label="Full Name *" htmlFor="ob-name">
                  <Input id="ob-name" placeholder="Your full name" value={profile.name}
                    onChange={e => set('name')(e.target.value)} autoFocus />
                </FormGroup>
                <FormGroup label="Email Address *" htmlFor="ob-email">
                  <Input id="ob-email" type="email" placeholder="you@example.com" value={profile.email}
                    onChange={e => set('email')(e.target.value)} />
                </FormGroup>
                <FormGroup label="Mobile Number" htmlFor="ob-mobile">
                  <Input id="ob-mobile" type="tel" placeholder="10-digit (optional)" value={profile.mobile}
                    onChange={e => set('mobile')(e.target.value.replace(/\D/g,'').slice(0,10))} />
                </FormGroup>
                <FormGroup label="Date of Birth * (for password recovery)" htmlFor="ob-dob">
                  <Input id="ob-dob" type="date" value={profile.dob}
                    onChange={e => set('dob')(e.target.value)} />
                </FormGroup>
                <FormGroup label="Password * (min 6 characters)" htmlFor="ob-pass">
                  <div className="relative">
                    <Input id="ob-pass" type={showPass ? 'text' : 'password'}
                      placeholder="Create a strong password" value={password}
                      onChange={e => { setPassword(e.target.value); setPassError('') }}
                      className="pr-14" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
                      style={{ color: 'var(--text3)' }}>{showPass ? 'Hide' : 'Show'}</button>
                  </div>
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-1.5 items-center">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: password.length >= i*3 ? i<=1?'#EF4444':i<=2?'#F59E0B':i<=3?'#06B6D4':'#10B981' : 'var(--border)' }} />
                      ))}
                      <span className="text-[10px] ml-1 shrink-0" style={{ color: 'var(--text3)' }}>
                        {password.length<3?'Weak':password.length<6?'Fair':password.length<9?'Good':'Strong'}
                      </span>
                    </div>
                  )}
                </FormGroup>
                <FormGroup label="Confirm Password *" htmlFor="ob-confirm">
                  <Input id="ob-confirm" type={showPass ? 'text' : 'password'}
                    placeholder="Repeat your password" value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPassError('') }}
                    onKeyDown={e => { if (e.key === 'Enter' && canNext) handleNext() }} />
                  {confirmPassword.length > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: confirmPassword === password ? '#10B981' : '#EF4444' }}>
                      {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </FormGroup>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Subjects */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <h2 className="font-display font-black text-[28px] mb-2" style={{ color: 'var(--text)' }}>What are you studying?</h2>
                <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Type anything — no restrictions</p>
              </div>
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg3)', borderColor: 'var(--border)' }}>
                <SubjectInput onAdd={handleAddSubject} existingNames={subjects.map(s => s.name)} />
                <div className="mt-3 mb-4">
                  <p className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>Quick add:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Mathematics','Physics','DSA','Machine Learning','UPSC','JEE','Chemistry','Economics'].map(s =>
                      subjects.some(sub => sub.name.toLowerCase() === s.toLowerCase()) ? null : (
                        <button key={s} onClick={() => handleAddSubject(s)}
                          className="text-[11px] px-2.5 py-1 rounded-full border transition-all font-display"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg4)', color: 'var(--text2)' }}>
                          + {s}
                        </button>
                      )
                    )}
                  </div>
                </div>
                {subjects.length === 0 ? (
                  <div className="text-center py-3 text-[12px]" style={{ color: 'var(--text3)' }}>
                    No subjects yet — add later in Settings too.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <AnimatePresence>
                      {subjects.map(s => (
                        <motion.div key={s.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-display font-semibold"
                          style={{ background: s.color+'26', color: s.color, border: `1px solid ${s.color}44` }}>
                          {s.icon} {s.name}
                          <button onClick={() => setSubjects(p => p.filter(x => x.id !== s.id))}
                            className="ml-1 opacity-60 hover:opacity-100 text-[14px] leading-none">×</button>
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
            <motion.div key="3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }} className="text-6xl mb-6">🎓</motion.div>
              <h2 className="font-display font-black text-[32px] mb-3" style={{ color: 'var(--text)' }}>
                You&apos;re all set, {profile.name}!
              </h2>
              <p className="text-[15px] mb-4" style={{ color: 'var(--text2)' }}>Your workspace is ready.</p>
              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {subjects.map(s => (
                    <span key={s.id} className="text-[12px] px-3 py-1 rounded-full font-display font-semibold"
                      style={{ background: s.color+'26', color: s.color }}>{s.icon} {s.name}</span>
                  ))}
                </div>
              )}
              <p className="text-[13px]" style={{ color: 'var(--text3)' }}>
                💡 Next visit: login with email + password
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Button>
          ) : <div />}
          <Button variant="primary" size="lg" onClick={handleNext} disabled={!canNext} loading={loading}>
            {step === 0 ? 'Register New User →' :
             step === STEPS.length - 1 ? 'Launch StudyOS 🚀' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  )
}
